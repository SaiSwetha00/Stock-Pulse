'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import {
  validateCustomer,
  toCustomerPayload,
  type CustomerErrors,
  type CustomerInput,
} from '@/lib/validation/customer'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'

/**
 * The reader's copy, resolved server-side from the locale cookie. Each action
 * reads it itself: a message the browser supplied is not one this server
 * should repeat back.
 */
async function copy() {
  return appCopy(await getLocale()).customers
}

export type CustomerActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: CustomerErrors }

/** Partial unique index on customers(store_id, lower(email)). */
const UNIQUE_VIOLATION = '23505'

/**
 * Customer records are owner-only, matching the nav filter in lib/nav.ts and
 * the redirect guard on the page. Checked here because the UI guard is a
 * convenience, not a control.
 */
async function requireOwner() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) return null
  return store
}

export async function saveCustomer(
  input: CustomerInput,
  customerId?: string,
): Promise<CustomerActionResult> {
  const store = await requireOwner()
  const tc = await copy()
  if (!store) return { ok: false, message: tc.actNoPermission }

  const errors = validateCustomer(input, tc)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: tc.actFixFields }
  }

  const supabase = await createClient()
  const payload = toCustomerPayload(input)

  const { error } = customerId
    ? await supabase
        .from('customers')
        .update(payload)
        .eq('id', customerId)
        .eq('store_id', store.id)
    : await supabase.from('customers').insert({ ...payload, store_id: store.id })

  if (error) {
    return {
      ok: false,
      message:
        error.code === UNIQUE_VIOLATION
          ? tc.actEmailExists
          : error.message,
    }
  }

  revalidatePath('/customers')
  return { ok: true }
}

export async function deleteCustomer(customerId: string): Promise<CustomerActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: (await copy()).actNoPermission }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('store_id', store.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/customers')
  return { ok: true }
}
