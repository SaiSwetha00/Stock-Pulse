'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { notify } from '@/app/(dashboard)/notifications/actions'
import {
  validateProduct,
  toProductPayload,
  type ProductErrors,
  type ProductInput,
} from '@/lib/validation/product'

export type ActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: ProductErrors }

/** Postgres foreign_key_violation — product still referenced by sale_items. */
const FK_VIOLATION = '23503'
/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505'

/**
 * Creates or updates a product, then invalidates the routes that render it.
 *
 * Why this is a Server Action rather than a browser insert:
 *
 * 1. `revalidatePath` is server-only. Writing from the client meant nothing
 *    ever invalidated the Router Cache — the UI relied entirely on a
 *    fire-and-forget `router.refresh()`, so the table kept showing stale rows
 *    for the couple of seconds the re-render took, which reads as "I have to
 *    refresh manually".
 * 2. Validation on the client is a convenience, not a control. A crafted
 *    request can skip it entirely, so the same rules run here too.
 * 3. `store_id` is taken from the session, never from the caller. Previously
 *    the browser supplied it, so the row's owner was client-controlled; RLS
 *    would have caught a mismatch, but the server should not be asking.
 */
export async function saveProduct(
  input: ProductInput,
  productId?: string,
): Promise<ActionResult> {
  const { profile, store } = await getCurrentUser()

  // The UI only shows these controls to owners; enforce it where it counts.
  if (!canManage(profile.role)) {
    return { ok: false, message: 'You do not have permission to change inventory.' }
  }

  const errors = validateProduct(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Please correct the highlighted fields.' }
  }

  const supabase = await createClient()
  const payload = toProductPayload(input)

  const { error } = productId
    ? await supabase
        .from('products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('store_id', store.id)
    : await supabase.from('products').insert({ ...payload, store_id: store.id })

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, message: 'A product with that SKU already exists.' }
    }
    return { ok: false, message: error.message }
  }

  // Raised from the values just saved rather than by re-reading the row: the
  // threshold is per product, so "low" is only meaningful against the number
  // written alongside it.
  if (payload.stock <= payload.low_stock_threshold) {
    await notify({
      title: payload.stock === 0 ? 'Out of stock' : 'Low stock',
      body: `${payload.name} is down to ${payload.stock} (reorder at ${payload.low_stock_threshold}).`,
      kind: 'low_stock',
      entity: 'products',
      entityId: productId,
    })
  }

  // Both routes read products: /inventory lists them, /dashboard derives its
  // low-stock count and total value from them.
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { ok: true }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const { profile, store } = await getCurrentUser()

  if (!canManage(profile.role)) {
    return { ok: false, message: 'You do not have permission to change inventory.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('store_id', store.id)

  if (error) {
    if (error.code === FK_VIOLATION) {
      return {
        ok: false,
        message:
          'This product appears in past sales and cannot be removed. Set its stock to 0 to retire it instead.',
      }
    }
    return { ok: false, message: error.message }
  }

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { ok: true }
}

export interface ImportResult {
  ok: boolean
  created: number
  updated: number
  /** Rows the server rejected, by their line number in the uploaded file. */
  failed: { line: number; reason: string }[]
  message?: string
}

/** Guards against a crafted request pushing an unbounded batch. */
const MAX_IMPORT_ROWS = 2_000

/**
 * Bulk create/update from an uploaded CSV.
 *
 * The browser has already previewed and filtered these rows, but that preview
 * is a convenience, not a control: every row is validated again here, the
 * store comes from the session, and the owner check is repeated. A crafted
 * request that skips the modal entirely meets exactly the same rules.
 *
 * Matching is on SKU within the store. Rows without a SKU always insert —
 * there is no other stable key to match them on, and silently merging
 * same-named products would destroy data.
 */
export async function importProducts(
  rows: { line: number; input: ProductInput }[]
): Promise<ImportResult> {
  const { profile, store } = await getCurrentUser()

  if (!canManage(profile.role)) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      failed: [],
      message: 'You do not have permission to import inventory.',
    }
  }
  if (rows.length === 0) {
    return { ok: false, created: 0, updated: 0, failed: [], message: 'Nothing to import.' }
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      created: 0,
      updated: 0,
      failed: [],
      message: `Too many rows in one import (limit ${MAX_IMPORT_ROWS}).`,
    }
  }

  const supabase = await createClient()

  // One read to resolve every SKU, rather than a query per row.
  const { data: existing } = await supabase
    .from('products')
    .select('id, sku')
    .eq('store_id', store.id)

  const idBySku = new Map<string, string>()
  for (const p of existing ?? []) {
    if (p.sku) idBySku.set(p.sku.trim().toLowerCase(), p.id)
  }

  const failed: ImportResult['failed'] = []
  let created = 0
  let updated = 0

  for (const { line, input } of rows) {
    const errors = validateProduct(input)
    if (Object.keys(errors).length > 0) {
      failed.push({ line, reason: Object.values(errors).filter(Boolean).join(' ') })
      continue
    }

    const payload = toProductPayload(input)
    const sku = payload.sku?.trim().toLowerCase()
    const existingId = sku ? idBySku.get(sku) : undefined

    const { error } = existingId
      ? await supabase
          .from('products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existingId)
          .eq('store_id', store.id)
      : await supabase.from('products').insert({ ...payload, store_id: store.id })

    if (error) {
      failed.push({
        line,
        reason:
          error.code === UNIQUE_VIOLATION
            ? 'A product with that SKU already exists.'
            : error.message,
      })
      continue
    }

    if (existingId) {
      updated++
    } else {
      created++
      // Keep the map current so a later row repeating this new SKU updates
      // rather than colliding on the unique index.
      if (sku) {
        const { data: back } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('sku', payload.sku as string)
          .maybeSingle()
        if (back?.id) idBySku.set(sku, back.id)
      }
    }
  }

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { ok: failed.length === 0, created, updated, failed }
}
