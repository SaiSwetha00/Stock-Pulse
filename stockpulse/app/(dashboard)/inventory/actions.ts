'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isDemoAccount } from '@/lib/demo'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { getStoreCategories } from '@/lib/categories'
import { notify } from '@/app/(dashboard)/notifications/actions'
import type { Product } from '@/types'
import {
  validateProduct,
  toProductPayload,
  toLotPayloads,
  totalLotQuantity,
  describeProductErrors,
  isValidBarcode,
  type LotPayload,
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
 * PostgREST's answer when 0016 has not been applied: PGRST205, "Could not find
 * the table 'public.product_batches' in the schema cache".
 *
 * Same reasoning as isMissingBarcodeColumn above and D21's 42P01 handling on
 * /staff: a branch has to stay deployable ahead of its migration, and every
 * product save on this branch writes a batch. Without this, "Add Product"
 * fails with a schema-cache string on an unmigrated database.
 *
 * Narrow on purpose — this code and this table only.
 */
function isMissingBatchesTable(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST205' && /product_batches/i.test(error.message ?? '')
}

const MISSING_BATCHES_TABLE = {
  ok: false as const,
  message:
    'Expiry tracking is not set up on this database yet. Run ' +
    'supabase/migrations/0016_product_batches.sql in the Supabase SQL editor.',
}

/**
 * Zero rows back from a lot UPDATE or DELETE. Names BOTH causes, for the
 * reason D24's follow-up gives: the first version of that message picked one,
 * and told a shopkeeper who had double-clicked to go and run SQL.
 */
const LOT_WRITE_REFUSED = {
  ok: false as const,
  message:
    'That stock lot could not be changed - it may have just been removed, or ' +
    'your account may not have permission. Refresh and try again.',
}

/**
 * Bring a product's lots to exactly what the form submitted.
 *
 * THIS IS THE CHANGE PHASE 2 EXISTS FOR. saveProduct used to write
 * `products.stock` directly from the Quantity field — an absolute overwrite
 * that, since 0016 made that column a trigger-maintained mirror of
 * sum(product_batches.quantity), set it to a number the batches did not
 * support. 0016's header names that gap and says not to ship a batches UI
 * without closing it. Nothing in this file writes `products.stock` any more;
 * the trigger does, and it is right by construction.
 *
 * Three rules the shape depends on:
 *
 * 1. **A lot id is matched, never trusted.** A submitted id that is not
 *    already a lot of THIS product in THIS store is treated as a new lot, so a
 *    crafted request cannot repoint another product's batch. The composite FK
 *    from 0016 would catch a cross-store attempt anyway; this catches the
 *    same-store one it would not.
 *
 * 2. **Unchanged lots are not rewritten.** A no-op UPDATE still fires 0016's
 *    trigger, which recomputes stock as the sum of the batches — and the
 *    batches have never been decremented by a sale, because log_sale still
 *    touches `products.stock` alone until the FEFO phase. So rewriting an
 *    untouched lot would quietly restore stock the shop has already sold.
 *    Skipping the write means editing a product's NAME cannot resurrect stock.
 *
 * 3. **Rows affected are checked, not assumed (D24).** An RLS refusal is a
 *    successful statement matching no rows, indistinguishable from success
 *    unless the affected rows are asked for. saveProduct is already behind
 *    canManage so this should be unreachable; "should be unreachable" is
 *    exactly the reasoning D24 was written about.
 *
 * NOT ATOMIC, and that is stated rather than hidden. These are separate
 * PostgREST calls, so a failure part-way leaves some lots written and returns
 * an error naming what happened. Making it atomic means a SECURITY DEFINER
 * function, which means a migration, which Phase 2 does not need for any other
 * reason. A retry is safe: surviving lots keep their ids and are matched, not
 * duplicated.
 */
async function syncProductLots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  productId: string,
  lots: LotPayload[],
): Promise<ActionResult> {
  const { data: existing, error: readError } = await supabase
    .from('product_batches')
    .select('id, quantity, expiry_date')
    .eq('store_id', storeId)
    .eq('product_id', productId)

  if (readError) {
    if (isMissingBatchesTable(readError)) return MISSING_BATCHES_TABLE
    return { ok: false, message: readError.message }
  }

  const current = new Map((existing ?? []).map((b) => [b.id as string, b]))
  const kept = new Set<string>()

  for (const lot of lots) {
    const row = lot.id ? current.get(lot.id) : undefined

    if (!row) {
      const { data, error } = await supabase
        .from('product_batches')
        .insert({
          store_id: storeId,
          product_id: productId,
          quantity: lot.quantity,
          expiry_date: lot.expiry_date,
        })
        .select('id')
      if (error) {
        if (isMissingBatchesTable(error)) return MISSING_BATCHES_TABLE
        return { ok: false, message: error.message }
      }
      // An insert refused by RLS fails loudly with 42501, so unlike the
      // update and delete below this needs no rows-affected check — it is
      // covered by `error`. Kept in the returned id only so the shape reads
      // the same as the other two branches.
      if (data?.[0]?.id) kept.add(data[0].id as string)
      continue
    }

    kept.add(row.id as string)

    // Rule 2: identical means leave it alone.
    if (row.quantity === lot.quantity && (row.expiry_date ?? null) === lot.expiry_date) continue

    const { data, error } = await supabase
      .from('product_batches')
      .update({
        quantity: lot.quantity,
        expiry_date: lot.expiry_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('store_id', storeId)
      .select('id')

    if (error) {
      if (isMissingBatchesTable(error)) return MISSING_BATCHES_TABLE
      return { ok: false, message: error.message }
    }
    if ((data ?? []).length === 0) return LOT_WRITE_REFUSED
  }

  const removed = (existing ?? []).filter((b) => !kept.has(b.id as string)).map((b) => b.id as string)
  if (removed.length > 0) {
    const { data, error } = await supabase
      .from('product_batches')
      .delete()
      .in('id', removed)
      .eq('store_id', storeId)
      .select('id')

    if (error) {
      if (isMissingBatchesTable(error)) return MISSING_BATCHES_TABLE
      return { ok: false, message: error.message }
    }
    if ((data ?? []).length !== removed.length) return LOT_WRITE_REFUSED
  }

  return { ok: true }
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

  // `.select('id')` on both branches. The insert needs the new id to hang lots
  // off; the update needs to know the row was actually there, because an id
  // that is not in this store is a 200 matching no rows rather than an error
  // (D24) and would otherwise be reported to the shopkeeper as a saved change.
  const { data: saved, error } = productId
    ? await supabase
        .from('products')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('store_id', store.id)
        .select('id')
    : await supabase
        .from('products')
        .insert({ ...payload, store_id: store.id })
        .select('id')

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

  const savedId = saved?.[0]?.id as string | undefined
  if (!savedId) {
    // Zero rows from the UPDATE. Both causes named, per D24's follow-up: the
    // product was deleted from another tab, or the caller cannot write it.
    return {
      ok: false,
      message:
        'That product could not be saved - it may have just been removed. Refresh and try again.',
    }
  }

  // The stock write, which is now a batch write. Everything above concerns
  // the product row; `products.stock` is set by 0016's trigger off the back
  // of this and is never assigned by this file.
  const lots = await syncProductLots(supabase, store.id, savedId, toLotPayloads(input))
  if (!lots.ok) return lots

  // Raised from the values just saved rather than by re-reading the row: the
  // threshold is per product, so "low" is only meaningful against the number
  // written alongside it. The quantity is now the sum of the lots, which is
  // exactly what the trigger will have put in products.stock.
  const onHand = totalLotQuantity(input)
  if (onHand <= payload.low_stock_threshold) {
    await notify({
      title: onHand === 0 ? 'Out of stock' : 'Low stock',
      body: `${payload.name} is down to ${onHand} (reorder at ${payload.low_stock_threshold}).`,
      kind: 'low_stock',
      entity: 'products',
      entityId: savedId,
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
 * NOT guarded by canManage(), and that CHANGED IN PHASE 4. Phase 3 guarded it,
 * reasoning that a scan could only lead to create or edit — both of which
 * saveProduct refuses for staff — so an unguarded read would be a path to a
 * dead end. **That reasoning stopped being true the moment Sales was wired
 * up.** `/sales` has no role guard at all: NAV_ITEMS lists all three roles,
 * the page does not redirect, and Log Sale is ungated, because staff work the
 * till. Keeping the guard would have stopped a cashier scanning anything.
 *
 * Removing it exposes nothing new. RLS already lets any store member SELECT
 * products ("store members can view products"), so a staff session could
 * always read this row — the guard only ever blocked the convenient path to
 * it. Inventory's own Scan button stays behind canWrite, so nothing there
 * changes.
 *
 * `product: null` is a SUCCESSFUL result, not a failure — "no product has this
 * barcode" is a real answer, and the two callers act on it differently:
 * Inventory opens the create form, Sales reports an unknown item and adds
 * nothing. Distinguishing that from "the lookup failed" is why this returns a
 * discriminated result rather than `Product | null` (D17).
 */
export async function findProductByBarcode(
  barcode: string,
): Promise<{ ok: false; message: string } | { ok: true; product: Product | null }> {
  const { store } = await getCurrentUser()

  // The same shape the validator and migration 0014's CHECK enforce. Checked
  // here so a malformed value cannot become a pointless round trip, and so a
  // crafted request meets the rule the form does.
  const value = barcode.trim()
  // The shared test, not a fourth inline copy. Offline Phase 2 added a matcher
  // that reads the cached product list, and a private regex here would let
  // "valid barcode" mean one thing with signal and another without.
  if (!isValidBarcode(value)) {
    return { ok: false, message: 'That is not a valid barcode.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    // The lots come back with the product, in the same round trip, resolved
    // through 0016's composite FK so a lot cannot arrive from another store.
    // Phase 4 needs them: both scan flows show the nearest expiry, and a
    // second query per scan would put a round trip between the beep and the
    // answer on exactly the two screens where someone is standing holding
    // something. Adding them here rather than at each call site also means the
    // till and the shelf cannot disagree about which lots a product has.
    .select('*, product_batches(*)')
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
  rows: { line: number; input: ProductInput }[],
  /**
   * Whether this file speaks about stock at all.
   *
   * A CSV row carries at most ONE quantity and ONE date, so when it does speak
   * about stock the only faithful reading is "these lots are now the product's
   * lots" - which replaces whatever was there. That is destructive for a
   * product with several dated lots, so it must not happen by accident, and a
   * file with neither a Stock nor an Expiry column is exactly that accident:
   * it is a price list, and it should leave the shelf alone.
   *
   * The old code had no such distinction and could not have had one - a
   * missing Stock column became `Number('' || '0')` and silently wrote stock 0
   * over every matched product. Same bug, quieter, and it predates batches.
   *
   * Defaults to false so a crafted request that omits it cannot clear a
   * store's lots.
   */
  options: { replaceLots?: boolean } = {},
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

  const replaceLots = options.replaceLots === true

  const failed: ImportResult['failed'] = []
  let created = 0
  let updated = 0

  // Hoisted: the list is the same for every row, and reading it per row would
  // be one round trip per line of the CSV.
  const allowed = await allowedCategorySlugs(supabase, store.id)

  for (const { line, input } of rows) {
    const errors = validateProduct(input, allowed)
    if (Object.keys(errors).length > 0) {
      failed.push({ line, reason: describeProductErrors(errors).join(' ') })
      continue
    }

    const payload = toProductPayload(input)
    const sku = payload.sku?.trim().toLowerCase()
    const existingId = sku ? idBySku.get(sku) : undefined

    const { data: saved, error } = existingId
      ? await supabase
          .from('products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existingId)
          .eq('store_id', store.id)
          .select('id')
      : await supabase
          .from('products')
          .insert({ ...payload, store_id: store.id })
          .select('id')

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

    const rowId = saved?.[0]?.id as string | undefined
    if (!rowId) {
      // Zero rows from the UPDATE: the product was removed between the read
      // that built idBySku and this write (D24 - a refusal and a vanished row
      // look identical, so the message names both).
      failed.push({
        line,
        reason: 'That product could not be found when the write ran. Re-run the import.',
      })
      continue
    }

    // Same write path the form uses, so a CSV and a hand-typed product cannot
    // end up meaning different things by "40, expiring on the 24th".
    if (replaceLots) {
      const lots = await syncProductLots(supabase, store.id, rowId, toLotPayloads(input))
      if (!lots.ok) {
        failed.push({ line, reason: lots.message ?? 'The stock lots could not be written.' })
        continue
      }
    }

    if (existingId) {
      updated++
    } else {
      created++
      // Keep the map current so a later row repeating this new SKU updates
      // rather than colliding on the unique index. The id comes back from the
      // insert now, so this no longer costs a second round trip per new row.
      if (sku) idBySku.set(sku, rowId)
    }
  }

  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { ok: failed.length === 0, created, updated, failed }
}

/**
 * Text search over the current store's products, for the global command
 * palette.
 *
 * WHY THIS EXISTS. The palette's index held navigation entries and three
 * actions and nothing else, so a query like "Basmati" could only ever match a
 * nav label through the subsequence scorer - which is exactly what a reviewer
 * reported: a search box labelled "Search products, sales, customers..."
 * returning sidebar links. Products were never in the index to be found.
 *
 * A Server Action rather than filtering a client-side array, for the reason
 * `findProductByBarcode` already documents: the palette is mounted in the
 * dashboard layout, which has no product list, and shipping one to every page
 * to power a search box would be worse than a query per keystroke-burst.
 *
 * `store_id` is never taken from the caller - RLS scopes the query to the
 * viewer's own store, so this cannot read another shop's catalogue.
 */
export async function searchProducts(
  query: string,
): Promise<{ id: string; name: string; sku: string | null; barcode: string | null }[]> {
  const q = query.trim()
  // Two characters is the floor at which a prefix search is worth a round
  // trip; below it almost every product matches and the list is noise.
  if (q.length < 2) return []

  const supabase = await createClient()
  // PostgREST `or` with ilike. `%` and `,` are escaped because an unescaped
  // comma would be read as a filter separator and change the query's shape.
  const safe = q.replace(/[%,()]/g, ' ').trim()
  if (!safe) return []

  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode')
    .or(`name.ilike.%${safe}%,sku.ilike.%${safe}%,barcode.ilike.%${safe}%`)
    .order('name')
    .limit(8)

  if (error) return []
  return data ?? []
}

/**
 * Remove seeded sample products from the CURRENT store, so a shop can start
 * from its own CSV instead of clearing a demo catalogue by hand.
 *
 * THE SAFETY RULE, AND WHY IT IS THIS ONE. The demo is a SINGLE SHARED STORE
 * behind a SINGLE SHARED LOGIN - every visitor who clicks "Explore the demo
 * store" signs in as the same `demo@stockpulse.test` and lands in the same
 * store row. There is no per-visitor copy. So a demo visitor running this
 * would not be clearing "their" sample data, they would be deleting the
 * catalogue for every future visitor, permanently, from a shared database.
 *
 * The action therefore REFUSES for the demo account. That is not a placeholder
 * for a better mechanism - given one shared store, refusing is the correct
 * behaviour, and the alternative (silently doing nothing) would be worse
 * because the user would think it had worked.
 *
 * For a real account it does the real thing, scoped by RLS to that account's
 * own store.
 *
 * WHAT COUNTS AS SAMPLE DATA: products whose SKU carries the `ACC-` prefix the
 * seed stamps on every row it writes. That prefix is the seed's own contract -
 * it exists so seeded stock is identifiable "in the UI, in an export, and in a
 * database query, forever". Nothing else is touched: categories, suppliers,
 * staff, settings and store configuration all remain, because a shop that has
 * just cleared a sample catalogue still needs the app to work.
 *
 * Products referenced by a sale are SKIPPED, not force-deleted. `sale_items`
 * declares `references products(id)` with no ON DELETE, so Postgres would
 * refuse anyway; skipping them explicitly means the caller gets a count rather
 * than a foreign-key error, and sales history survives either way.
 */
export async function removeSampleData(): Promise<
  { ok: false; message: string } | { ok: true; removed: number; keptWithSales: number }
> {
  const { profile, store } = await getCurrentUser()

  if (isDemoAccount(profile)) {
    return {
      ok: false,
      message:
        'The demo store is shared by everyone who tries StockPulse, so its sample data cannot be removed here — doing so would empty it for the next visitor. Create your own free store to import your catalogue.',
    }
  }

  if (!canManage(profile.role)) {
    return { ok: false, message: 'Only an owner or manager can remove sample data.' }
  }

  const supabase = await createClient()
  const { data: sample, error } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', store.id)
    .like('sku', 'ACC-%')

  if (error) return { ok: false, message: 'Could not read the sample products.' }
  if (!sample || sample.length === 0) {
    return { ok: true, removed: 0, keptWithSales: 0 }
  }

  const ids = sample.map((p) => p.id)
  const { data: sold } = await supabase
    .from('sale_items')
    .select('product_id')
    .in('product_id', ids)
  const soldIds = new Set((sold ?? []).map((r) => r.product_id))
  const deletable = ids.filter((id) => !soldIds.has(id))

  if (deletable.length > 0) {
    // Lots first: they hang off the product and would otherwise block it.
    await supabase.from('product_batches').delete().in('product_id', deletable)
    const { error: delError } = await supabase.from('products').delete().in('id', deletable)
    if (delError) return { ok: false, message: 'Could not remove the sample products.' }
  }

  revalidatePath('/inventory')
  revalidatePath('/dashboard')
  return { ok: true, removed: deletable.length, keptWithSales: soldIds.size }
}
