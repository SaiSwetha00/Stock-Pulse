'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { notify } from '@/app/(dashboard)/notifications/actions'
import {
  validateSupplier,
  toSupplierPayload,
  type SupplierErrors,
  type SupplierInput,
} from '@/lib/validation/supplier'

export type SupplierActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: SupplierErrors }

/**
 * Suppliers are owner-only, matching the roles filter in lib/nav.ts. The UI
 * hides these controls from staff; this is the check that actually holds.
 */
async function requireOwner() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) return null
  return store
}

export async function saveSupplier(
  input: SupplierInput,
  supplierId?: string,
): Promise<SupplierActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: 'You do not have permission to manage suppliers.' }

  const errors = validateSupplier(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Please correct the highlighted fields.' }
  }

  const supabase = await createClient()
  const payload = toSupplierPayload(input)

  if (supplierId) {
    const { error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('id', supplierId)
      .eq('store_id', store.id)

    if (error) return { ok: false, message: error.message }
  } else {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ ...payload, store_id: store.id })
      .select('id')
      .single()

    if (error) return { ok: false, message: error.message }

    // Mirrors what the old client-side modal did: a new supplier shows up in
    // the activity feed. A failure here must not fail the whole operation —
    // the supplier exists either way, and the feed is informational.
    await supabase.from('supplier_activity').insert({
      store_id: store.id,
      supplier_id: data?.id ?? null,
      supplier_name: payload.name,
      message: `${payload.name} added as a new supplier`,
    })

    // Store-wide: a new vendor is operational news, not owner-only. Raised
    // only for a create — an edit to a phone number is not worth a bell.
    await notify({
      title: 'New supplier added',
      body: `${payload.name} is now on your supplier list.`,
      kind: 'supplier',
      entity: 'suppliers',
      entityId: data?.id ?? undefined,
    })
  }

  revalidatePath('/suppliers')
  return { ok: true }
}

export type ShipmentInput = {
  supplierId: string
  poNumber: string
  status: string
  pallets: string
  eta: string
}

const SHIPMENT_STATUSES = ['ordered', 'shipped', 'transit', 'dock']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Shipments render on the same page as suppliers, so a create here has to
 * revalidate /suppliers too — otherwise the incoming-shipments panel and the
 * pallet counts stay stale until a manual refresh.
 */
export async function saveShipment(input: ShipmentInput): Promise<SupplierActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: 'You do not have permission to manage shipments.' }

  const poNumber = input.poNumber.trim()
  if (!poNumber) return { ok: false, message: 'PO number is required.' }
  if (!SHIPMENT_STATUSES.includes(input.status)) {
    return { ok: false, message: 'Choose a valid shipment status.' }
  }
  if (input.eta.trim() && !ISO_DATE.test(input.eta.trim())) {
    return { ok: false, message: 'Use the date picker for the ETA.' }
  }

  const pallets = Number(input.pallets.trim() || '0')
  if (!Number.isInteger(pallets) || pallets < 0) {
    return { ok: false, message: 'Pallets must be a whole number, zero or more.' }
  }

  const supabase = await createClient()

  // The supplier must belong to this store; otherwise a crafted request could
  // file a shipment against another business's vendor.
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('id', input.supplierId)
    .eq('store_id', store.id)
    .maybeSingle()

  if (!supplier) return { ok: false, message: 'That supplier is not on this store.' }

  const { error } = await supabase.from('shipments').insert({
    store_id: store.id,
    supplier_id: supplier.id,
    po_number: poNumber,
    status: input.status,
    pallets,
    eta: input.eta.trim() || null,
  })

  if (error) return { ok: false, message: error.message }

  await supabase.from('supplier_activity').insert({
    store_id: store.id,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    message: `${supplier.name} PO ${poNumber} created`,
  })

  await notify({
    title: 'Incoming shipment logged',
    body: `${supplier.name} PO ${poNumber}${input.eta.trim() ? `, due ${input.eta.trim()}` : ''}.`,
    kind: 'supplier',
    entity: 'suppliers',
    entityId: supplier.id,
  })

  revalidatePath('/suppliers')
  return { ok: true }
}

export async function deleteSupplier(supplierId: string): Promise<SupplierActionResult> {
  const store = await requireOwner()
  if (!store) return { ok: false, message: 'You do not have permission to manage suppliers.' }

  const supabase = await createClient()

  // Read the feed rows first. supplier_activity.supplier_id is `on delete set
  // null`, so the moment the supplier row goes there is nothing left to match
  // them on — collecting the ids afterwards would find nothing.
  const { data: activity } = await supabase
    .from('supplier_activity')
    .select('id')
    .eq('store_id', store.id)
    .eq('supplier_id', supplierId)

  // `.select()` makes the delete return what it removed. Without it a request
  // naming a supplier on someone else's store comes back with no error and no
  // rows, and the dialog reports a success that never happened.
  const { data: deleted, error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId)
    .eq('store_id', store.id)
    .select('id')

  if (error) return { ok: false, message: error.message }
  if (!deleted?.length) return { ok: false, message: 'That supplier is no longer on this store.' }

  // Shipments cascade. The feed does not: left alone these rows keep printing
  // "<name> added as a new supplier" for a supplier that is gone, and they
  // crowd out the ten rows the panel shows. Dropping them loses no history —
  // the audit_suppliers trigger from migration 0001 already recorded the
  // delete in audit_logs with a full snapshot of the row.
  //
  // Deletes here need the policy added in migration 0003; before it, this is a
  // silent no-op. Not worth failing the action over either way — the supplier
  // itself is already deleted.
  const orphaned = (activity ?? []).map((a) => a.id)
  if (orphaned.length > 0) {
    await supabase.from('supplier_activity').delete().eq('store_id', store.id).in('id', orphaned)
  }

  revalidatePath('/suppliers')
  return { ok: true }
}
