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
