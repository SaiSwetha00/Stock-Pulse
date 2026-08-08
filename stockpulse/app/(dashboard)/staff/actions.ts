'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import {
  validateShift,
  toShiftPayload,
  type ShiftErrors,
  type ShiftInput,
} from '@/lib/validation/shift'

export type ShiftActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: ShiftErrors }

/**
 * Scheduling is an owner action — staff can view the rota but not rewrite it,
 * which is why StaffScheduleClient hides these controls behind `isOwner`. That
 * is presentation; this is the check that holds.
 */
async function requireOwner() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) return null
  return store
}

export async function saveShift(
  input: ShiftInput,
  shiftId?: string,
): Promise<ShiftActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: 'You do not have permission to change the schedule.' }

  const errors = validateShift(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Please correct the highlighted fields.' }
  }

  const supabase = await createClient()
  const payload = toShiftPayload(input)

  // A staff_id from the browser must belong to this store, otherwise a crafted
  // request could roster someone from another business onto your rota.
  if (payload.staff_id) {
    const { data: member } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', payload.staff_id)
      .eq('store_id', store.id)
      .maybeSingle()

    if (!member) return { ok: false, errors: { staffId: 'That person is not on this team.' } }

    /**
     * Nobody gets rostered on a day they are on leave.
     *
     * This is the enforcement, not the hint. StaffScheduleClient marks the
     * person in the picker, but that is presentation: the shift date and staff
     * id both arrive from the browser, and a stale tab — someone with the form
     * already open when the leave was recorded — would otherwise post straight
     * through it.
     *
     * Both columns are inclusive, so the overlap test for a single day is
     * `starts_on <= day and ends_on >= day`. Compared as dates in Postgres
     * rather than in JavaScript, so there is no timezone in the question.
     */
    const { data: leave, error: leaveError } = await supabase
      .from('staff_leave')
      .select('id, starts_on, ends_on, kind')
      .eq('store_id', store.id)
      .eq('staff_id', payload.staff_id)
      .lte('starts_on', payload.shift_date)
      .gte('ends_on', payload.shift_date)
      .limit(1)

    // 42P01 means 0011 has not been run yet. Scheduling worked before leave
    // existed and must keep working: treat an absent table as "no leave on
    // record" rather than blocking every shift in the shop.
    if (leaveError && leaveError.code !== '42P01') {
      return { ok: false, message: leaveError.message }
    }

    if (leave && leave.length > 0) {
      return {
        ok: false,
        errors: { shiftDate: 'That person is on leave on this date.' },
        message: 'They are on leave that day. Choose another date, or remove the leave first.',
      }
    }
  }

  const { error } = shiftId
    ? await supabase.from('shifts').update(payload).eq('id', shiftId).eq('store_id', store.id)
    : await supabase.from('shifts').insert({ ...payload, store_id: store.id })

  if (error) return { ok: false, message: error.message }

  revalidatePath('/staff')
  return { ok: true }
}

export async function deleteShift(shiftId: string): Promise<ShiftActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: 'You do not have permission to change the schedule.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)
    .eq('store_id', store.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/staff')
  return { ok: true }
}
