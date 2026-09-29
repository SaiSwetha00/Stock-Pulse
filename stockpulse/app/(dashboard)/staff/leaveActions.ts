'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import {
  validateLeave,
  toLeavePayload,
  type LeaveErrors,
  type LeaveInput,
} from '@/lib/validation/leave'

/**
 * The reader's copy, resolved server-side from the locale cookie. Each action
 * reads it itself: a message the browser supplied is not one this server
 * should repeat back.
 */
async function copy() {
  return appCopy(await getLocale()).staff
}

export type LeaveActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: LeaveErrors }

/**
 * Recording absence is a scheduling action, so it takes the same gate as the
 * rota itself: owners and managers, not staff. Someone cannot book their own
 * holiday here — that is a request-and-approve flow, which is a different
 * feature and is not what was asked for.
 *
 * Returns the caller as well as the store, because `created_by` records who
 * entered the row.
 */
async function requireScheduler() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) return null
  return { store, profile }
}

export async function saveLeave(
  input: LeaveInput,
  leaveId?: string,
): Promise<LeaveActionResult> {
  const gate = await requireScheduler()
  const ts = await copy()
  if (!gate) return { ok: false, message: ts.actLeaveNoPermission }

  const errors = validateLeave(input, ts)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: ts.actFixFields }
  }

  const supabase = await createClient()
  const payload = toLeavePayload(input)

  // The same check saveShift makes about staff_id: a person id arriving from
  // the browser must belong to this store, or a crafted request could book
  // leave against somebody in another business. RLS would stop the row landing
  // in the wrong store, but not this row naming a foreign profile.
  const { data: member } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', payload.staff_id)
    .eq('store_id', gate.store.id)
    .maybeSingle()

  if (!member) return { ok: false, errors: { staffId: ts.actNotOnTeam } }

  const { error } = leaveId
    ? await supabase
        .from('staff_leave')
        .update(payload)
        .eq('id', leaveId)
        .eq('store_id', gate.store.id)
    : await supabase.from('staff_leave').insert({
        ...payload,
        store_id: gate.store.id,
        created_by: gate.profile.id,
      })

  if (error) {
    // 42P01: the table does not exist. An app deployed ahead of its migration
    // is common enough to be worth naming — "relation public.staff_leave does
    // not exist" otherwise sends the next person debugging this function,
    // where nothing is wrong.
    if (error.code === '42P01') {
      return {
        ok: false,
        message: ts.actLeaveNotSetUp,
      }
    }
    return { ok: false, message: error.message }
  }

  revalidatePath('/staff')
  return { ok: true }
}

export async function deleteLeave(leaveId: string): Promise<LeaveActionResult> {
  const gate = await requireScheduler()
  if (!gate) return { ok: false, message: (await copy()).actLeaveNoPermission }

  const supabase = await createClient()
  const { error } = await supabase
    .from('staff_leave')
    .delete()
    .eq('id', leaveId)
    .eq('store_id', gate.store.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/staff')
  return { ok: true }
}
