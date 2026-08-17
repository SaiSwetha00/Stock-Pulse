'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { getStoreCategories } from '@/lib/categories'
import { notify } from '@/app/(dashboard)/notifications/actions'
import type { Product } from '@/types'
import {
  validateProduct,
  toProductPayload,
  type ProductErrors,
  type ProductInput,
} from '@/lib/validation/product'

export type ActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: ProductErrors }

/**
 * The category slugs this store actually has, read server-side.
 *
 * Never taken from the caller. The category is a foreign key now, and a
 * crafted request naming another store's category would otherwise get as far
 * as the database — where `products_category_fkey` would refuse it as an
 * opaque 23503 rather than as "Choose a valid category."
 */
async function allowedCategorySlugs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
): Promise<string[]> {
  const { categories } = await getStoreCategories(supabase, storeId)
  return categories.map((c) => c.slug)
}

/** Postgres foreign_key_violation — product still referenced by sale_items. */
const FK_VIOLATION = '23503'
/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505'
/** Postgres check_violation — a barcode that is not 8-14 digits (0014). */
const CHECK_VIOLATION = '23514'

/**
 * The product already holding this barcode in this store, if any.
 *
 * Exists so the shopkeeper is told *which* product they clashed with. The
 * database can only say "duplicate key value violates unique constraint
 * products_store_barcode_key", which names an index rather than a thing on a
 * shelf — that is the raw error this is here to stop surfacing.
 *
 * Scoped to store_id as well as barcode even though RLS already scopes the
 * read: the unique index is per store (0014), so a match in another shop is
 * not a conflict and must never be named — that would leak a product name
 * across tenants. Belt and braces, and it makes the intent legible.
 */
async function barcodeConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  barcode: string,
  /** The row being edited, which cannot conflict with itself. */
  excludeProductId?: string,
): Promise<{ id: string; name: string } | null> {
  let q = supabase
    .from('products')
    .select('id, name')
    .eq('store_id', storeId)
    .eq('barcode', barcode)
  if (excludeProductId) q = q.neq('id', excludeProductId)

  const { data } = await q.limit(1)
  return data?.[0] ?? null
}

/**
 * The message the form shows for a duplicate, with the clashing product named.
 *
 * Falls back to a sentence that still says what happened when the lookup finds
 * nothing — which is genuinely possible: the conflicting row can be deleted
 * between the failed write and this read. "Another product" is vague and true;
 * inventing a name would be neither.
 */
function duplicateBarcodeMessage(conflict: { name: string } | null): string {
  return conflict
    ? `This barcode is already used by ${conflict.name}.`
    : 'This barcode is already used by another product in this store.'
}

/**
 * PostgREST's answer when 0014 has not been applied: PGRST204, "Could not find
 * the 'barcode' column of 'products' in the schema cache".
 *
 * Handled for the same reason /staff special-cases 42P01 for staff_leave
 * (D21): a branch must stay deployable ahead of its migration, and every
 * product save on this branch writes a barcode field. Without this, an
 * unmigrated database turns "Add Product" into an opaque schema-cache error.
 *
 * Narrow on purpose — this code and this code only. D21's bug was an
 * over-broad catch that swallowed every error into a page that rendered
 * perfectly with nothing on it and nothing saying why.
 */
function isMissingBarcodeColumn(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST204' && /barcode/i.test(error.message ?? '')
}

const MISSING_BARCODE_COLUMN = {
  ok: false as const,
  message:
    'Barcodes are not set up on this database yet. Run ' +
    'supabase/migrations/0014_product_barcode.sql in the Supabase SQL editor.',
}

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

  const supabase = await createClient()

  const errors = validateProduct(input, await allowedCategorySlugs(supabase, store.id))
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: 'Please correct the highlighted fields.' }
  }

  const payload = toProductPayload(input)

  // Checked before the write so the common case gets a sentence naming the
  // other product rather than a constraint name. This is NOT the guarantee —
  // two saves racing would both pass this read — so the 23505 branch below
  // stays as the real backstop. Two people adding stock at one counter is an
  // ordinary Saturday in a grocery, not a hypothetical.
  if (payload.barcode) {
    const conflict = await barcodeConflict(supabase, store.id, payload.barcode, productId)
    if (conflict) {
      return {
        ok: false,
        errors: { barcode: duplicateBarcodeMessage(conflict) },
        message: duplicateBarcodeMessage(conflict),
      }
    }
  }

  const { error } = productId
    ? await supabase
        .from('products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('store_id', store.id)
    : await supabase.from('products').insert({ ...payload, store_id: store.id })

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // products_store_barcode_key is the only unique index on this table —
      // there is none on sku, verified across schema.sql and migrations
      // 0001-0014 — so a 23505 here is a barcode clash. The constraint name is
      // still checked rather than assumed, because "the only one today" is a
      // fact with a shelf life.
      const isBarcode =
        !error.message || /barcode/i.test(`${error.message} ${error.details ?? ''}`)
      if (isBarcode && payload.barcode) {
        const conflict = await barcodeConflict(supabase, store.id, payload.barcode, productId)
        const message = duplicateBarcodeMessage(conflict)
        return { ok: false, errors: { barcode: message }, message }
      }
      return { ok: false, message: 'A product with that SKU already exists.' }
    }
    if (error.code === CHECK_VIOLATION && /barcode/i.test(error.message ?? '')) {
      // The validator should have caught this; if it did not, the two rules
      // have drifted and the message should say something a human can act on.
      return {
        ok: false,
        errors: { barcode: 'Use 8 to 14 digits, numbers only.' },
        message: 'Use 8 to 14 digits, numbers only.',
      }
    }
    if (isMissingBarcodeColumn(error)) return MISSING_BARCODE_COLUMN
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

/**
 * Resolve a scanned barcode to a product IN THIS STORE.
 *
 * Phase 3's whole server-side surface. It reads; it writes nothing.
 *
 * `store_id` comes from the session and is never accepted from the caller —
 * the same rule saveProduct follows, and the reason a scan on one shop's phone
 * cannot resolve to another shop's product. `.eq('store_id')` is written out
 * even though RLS already scopes the read: it makes the intent legible, and it
 * is the pair the unique index `products_store_barcode_key` is built on, so
 * this is an index lookup rather than a scan.
 *
 * Guarded by canManage() even though it is a read and staff may already SELECT
 * products under RLS. Two reasons: the only things a scan can lead to are
 * create and edit, both of which saveProduct refuses for staff, so an
 * unguarded read here would be a path to a dead end; and it avoids adding a
 * barcode-enumeration endpoint no UI offers.
 *
 * `product: null` is a SUCCESSFUL result, not a failure — "no product has this
 * barcode" is the answer that opens the create form. Distinguishing that from
 * "the lookup failed" is why this returns a discriminated result rather than
 * `Product | null` (D17).
 */
export async function findProductByBarcode(
  barcode: string,
): Promise<{ ok: false; message: string } | { ok: true; product: Product | null }> {
  const { profile, store } = await getCurrentUser()

  if (!canManage(profile.role)) {
    return { ok: false, message: 'You do not have permission to change inventory.' }
  }

  // The same shape the validator and migration 0014's CHECK enforce. Checked
  // here so a malformed value cannot become a pointless round trip, and so a
  // crafted request meets the rule the form does.
  const value = barcode.trim()
  if (!/^[0-9]{8,14}$/.test(value)) {
    return { ok: false, message: 'That is not a valid barcode.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('barcode', value)
    .maybeSingle()

  if (error) {
    // PGRST204 here would mean migration 0014 has not been applied. Named
    // rather than surfaced raw, exactly as saveProduct does.
    if (error.code === 'PGRST204') {
      return {
        ok: false,
        message:
          'Barcodes are not set up on this database yet. Run ' +
          'supabase/migrations/0014_product_barcode.sql in the Supabase SQL editor.',
      }
    }
    return { ok: false, message: error.message }
  }

  return { ok: true, product: (data as Product) ?? null }
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

  // Hoisted: the list is the same for every row, and reading it per row would
  // be one round trip per line of the CSV.
  const allowed = await allowedCategorySlugs(supabase, store.id)

  for (const { line, input } of rows) {
    const errors = validateProduct(input, allowed)
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
      let reason: string
      if (error.code === UNIQUE_VIOLATION && payload.barcode) {
        // Same treatment as the form: name the product, not the index. A
        // 200-row import that reports "duplicate key value violates unique
        // constraint" 6 times is a file nobody can fix.
        reason = duplicateBarcodeMessage(
          await barcodeConflict(supabase, store.id, payload.barcode, existingId),
        )
      } else if (error.code === UNIQUE_VIOLATION) {
        reason = 'A product with that SKU already exists.'
      } else if (isMissingBarcodeColumn(error)) {
        reason = MISSING_BARCODE_COLUMN.message
      } else {
        reason = error.message
      }
      failed.push({ line, reason })
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
