import type { Category } from '@/types'

// The `CATEGORIES` constant was here — a second copy of the same five slugs
// ProductModal also carried, and the CHECK constraint carried a third time.
// Since migration 0013 the allowed set is per-store data, so it arrives as an
// argument instead. Deleted rather than defaulted: a default would let a call
// site validate against yesterday's list and still compile.

/**
 * One lot, as the form holds it: strings, possibly blank.
 *
 * This replaced the flat `stock` + `expiryDate` pair. That pair could only
 * ever describe ONE date per product, which is the thing migration 0016
 * created `product_batches` to stop being true — two deliveries of the same
 * paneer that go off on different days are two lots, not one row with the
 * later date silently winning.
 */
export type LotInput = {
  /** `product_batches.id` when editing a lot that already exists; absent for
   *  a lot being entered now. The Server Action uses it to decide update vs
   *  insert, and never trusts it beyond store-scoped matching. */
  id?: string
  quantity: string
  expiryDate: string
}

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type ProductInput = {
  name: string
  brand: string
  sku: string
  /** Optional. Typed by hand or filled from a camera (barcode phases 3-4).
   *  Kept as a raw string like every other field here so the form, the CSV
   *  import and the Server Action all validate the same value. */
  barcode: string
  category: string
  unitPrice: string
  unit: string
  lowStockThreshold: string
  /** Public Storage URL, or '' for no photo. Not user-typed — it is set by
   *  ProductImageUpload after a successful upload, so there is nothing to
   *  validate beyond empty-means-null. */
  imageUrl: string
  /** May be empty: a product with nothing on hand has no lots at all, which
   *  is the same state 0016's backfill left for a zero-stock product. */
  lots: LotInput[]
}

export type LotErrors = { quantity?: string; expiryDate?: string }

/**
 * Field-keyed messages. `lotRows` is index-aligned with `input.lots` and is
 * only ever present when at least one row is bad — callers test
 * `Object.keys(errors).length > 0`, so an always-present empty array would
 * make every clean form look invalid.
 */
export type ProductErrors = Partial<
  Record<Exclude<keyof ProductInput, 'lots'>, string>
> & {
  /** A problem with the set of lots rather than with one row. */
  lots?: string
  lotRows?: LotErrors[]
}

/**
 * What actually goes to the `products` row once validation passes.
 *
 * `stock` and `expiry_date` are DELIBERATELY ABSENT.
 *
 * Since 0016 `products.stock` is a trigger-maintained mirror of
 * sum(product_batches.quantity). Writing it here — which is exactly what this
 * module used to do, an absolute overwrite from the Quantity field — sets the
 * mirror to a number the batches do not support, and it stays wrong until the
 * next batch change happens to re-sync it. 0016's own header names that as the
 * gap Phase 2 exists to close.
 *
 * `products.expiry_date` is absent for the reason `lots` exists: one column
 * cannot hold two deliveries with two different dates. 0016 copied it into the
 * backfilled lot, and nothing reads it now.
 */
export type ProductPayload = {
  name: string
  brand: string | null
  sku: string | null
  barcode: string | null
  category: Category
  unit_price: number
  unit: string
  low_stock_threshold: number
  image_url: string | null
}

export type LotPayload = {
  id?: string
  quantity: number
  expiry_date: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 8..14 digits. Covers every symbology a grocery meets — EAN-8 (8), UPC-E
 * expanded (8), UPC-A (12), EAN-13 (13), ITF-14/GTIN-14 (14) — and rejects the
 * things that make a later scan silently fail to match: spaces, hyphens, the
 * apostrophe Excel adds to long numerics, and a value that has been through a
 * spreadsheet as a float ("8.90123e+12").
 *
 * Kept identical to migration 0014's products_barcode_format_check. CLAUDE.md
 * records a past bug where the app-layer rule and the database rule drifted;
 * these two must be changed together.
 */
export const BARCODE = /^[0-9]{8,14}$/

/**
 * The single barcode-shape test in this codebase.
 *
 * Exported in Offline Phase 2 because there are now THREE places a barcode is
 * checked before it is looked up — the form, `findProductByBarcode` on the
 * server, and the offline matcher that reads the cached product list. The
 * server action previously carried its own inline copy of this regex; a
 * fourth copy in the offline path would have made "valid barcode" mean
 * something slightly different depending on whether the till had signal,
 * which is the drift CLAUDE.md already records for the app-layer and
 * database-layer rules.
 */
export function isValidBarcode(value: string): boolean {
  return BARCODE.test(value.trim())
}

/**
 * The plausible-year window for an expiry date.
 *
 * A PAST date is valid and always will be — a shopkeeper needs to record the
 * crate that went off last week, and refusing it would mean the one lot the
 * feature exists to surface is the one lot it will not accept.
 *
 * A FAR-FUTURE date is valid too. Nothing in a grocery lasts to 2090, but
 * "sensible" here means stored correctly and shown without inventing urgency,
 * not second-guessed.
 *
 * What is rejected is only the IMPOSSIBLE, and the reason is the control: a
 * year is typed into a four-digit spinner, so `0202` and `20262` are one
 * keystroke from `2026` and BOTH are accepted by `<input type="date">` and by
 * a Postgres `date`. An absolute window catches those without reading a clock,
 * which keeps this function pure and its verdict identical on client and
 * server — a relative "20 years from now" bound would put a boundary date on
 * different sides of validation depending on which machine ran it, and the
 * client would then submit a value the action rejects.
 */
const MIN_EXPIRY_YEAR = 2000
const MAX_EXPIRY_YEAR = 2100

/**
 * Enough lots for any real product, few enough that a crafted request cannot
 * push an unbounded write. The form's own Add button stops here too.
 */
export const MAX_LOTS = 20

/** True when this lot row carries nothing worth storing. */
function isBlankLot(lot: LotInput): boolean {
  const q = lot.quantity.trim()
  return (q === '' || q === '0') && lot.expiryDate.trim() === '' && !lot.id
}

/**
 * The lots that will actually be written, blank rows dropped.
 *
 * A row with quantity 0 AND a date survives: 0016 calls that a legitimate
 * state — a lot that has sold out but is kept for its expiry history. A row
 * with neither is the empty row the form always shows, and storing it would
 * put a meaningless zero against every product that has no stock, which is
 * precisely what 0016's backfill went out of its way not to do.
 */
export function meaningfulLots(values: ProductInput): LotInput[] {
  return values.lots.filter((l) => !isBlankLot(l))
}

/** Total on hand — what `products.stock` will hold once the trigger runs. */
export function totalLotQuantity(values: ProductInput): number {
  return meaningfulLots(values).reduce(
    (sum, l) => sum + (Number(l.quantity.trim() || '0') || 0),
    0,
  )
}

/**
 * Pure so it can run in three places without duplication: the browser (instant
 * feedback), the Server Action (the authoritative check — a client can be
 * bypassed entirely with a crafted request), and unit tests.
 *
 * Blank numeric inputs are normalised to '0' rather than becoming NaN, matching
 * the convention validateCustomerForm already uses.
 */
export function validateProduct(
  values: ProductInput,
  /**
   * The slugs this store actually has, from `lib/categories.ts`. Required, not
   * optional: an optional list would silently skip the membership check at any
   * call site that forgot it, and "the category was never validated" is
   * exactly the kind of hole that compiles.
   */
  allowedCategories: readonly string[],
): ProductErrors {
  const errors: ProductErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = 'Name is required.'
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer.'

  if (values.sku.trim().length > 40) errors.sku = 'SKU must be 40 characters or fewer.'

  // Optional: blank is a valid answer and must not be an error, since most
  // products will have no barcode on the day this ships.
  const barcode = values.barcode.trim()
  if (barcode && !BARCODE.test(barcode)) {
    errors.barcode = 'Use 8 to 14 digits, numbers only.'
  }

  if (values.brand.trim().length > 80) errors.brand = 'Brand must be 80 characters or fewer.'

  if (!allowedCategories.includes(values.category)) {
    errors.category = 'Choose a valid category.'
  }

  const price = Number(values.unitPrice.trim() || '0')
  if (!Number.isFinite(price) || price < 0) errors.unitPrice = 'Must be zero or more.'
  else if (price > 1_000_000) errors.unitPrice = 'That price looks too large.'

  const threshold = Number(values.lowStockThreshold.trim() || '0')
  if (!Number.isInteger(threshold) || threshold < 0) {
    errors.lowStockThreshold = 'Must be a whole number, zero or more.'
  }

  if (!values.unit.trim()) errors.unit = 'Unit is required.'

  // --- lots ---------------------------------------------------------------
  if (values.lots.length > MAX_LOTS) {
    errors.lots = `At most ${MAX_LOTS} lots per product.`
  }

  // Index-aligned with values.lots, INCLUDING blank rows, so the form can put
  // a message on the row the reader is looking at. Attached to `errors` only
  // if something is actually wrong.
  const lotRows: LotErrors[] = values.lots.map((lot) => {
    const row: LotErrors = {}

    // A blank row is the empty one the form always offers. Complaining about
    // it would make "Add Product" fail for a product that simply has no stock.
    if (isBlankLot(lot)) return row

    const quantity = Number(lot.quantity.trim() || '0')
    if (!Number.isInteger(quantity) || quantity < 0) {
      row.quantity = 'Must be a whole number, zero or more.'
    }

    const expiry = lot.expiryDate.trim()
    if (expiry) {
      if (!ISO_DATE.test(expiry)) {
        row.expiryDate = 'Use the date picker.'
      } else {
        const year = expiry.slice(0, 4)
        if (Number(year) < MIN_EXPIRY_YEAR || Number(year) > MAX_EXPIRY_YEAR) {
          // Names the year back, because the typo is invisible in a date
          // control that renders "02/02/0202" in a 90px box.
          row.expiryDate = `Check the year — nothing expires in ${year}.`
        }
      }
    }

    return row
  })

  if (lotRows.some((r) => r.quantity || r.expiryDate)) errors.lotRows = lotRows

  return errors
}

/**
 * Every message in a `ProductErrors`, flattened, for the callers that show one
 * line per row rather than one message per field — the CSV import preview and
 * the import Server Action's `failed[].reason`.
 *
 * Exists because `Object.values(errors)` used to be enough and no longer is:
 * `lotRows` is an array of objects, so the old expression would have joined
 * "[object Object]" into a shopkeeper's import report.
 */
export function describeProductErrors(errors: ProductErrors): string[] {
  const out: string[] = []
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'lotRows') continue
    if (typeof value === 'string' && value) out.push(value)
  }
  for (const [i, row] of (errors.lotRows ?? []).entries()) {
    for (const message of [row.quantity, row.expiryDate]) {
      // Numbered, because "Use the date picker." on its own does not say
      // which of four lots the file got wrong.
      if (message) out.push(`Lot ${i + 1}: ${message}`)
    }
  }
  return out
}

/** Call only after validateProduct returns no errors. */
export function toProductPayload(values: ProductInput): ProductPayload {
  return {
    name: values.name.trim(),
    brand: values.brand.trim() || null,
    sku: values.sku.trim() || null,
    // Empty means NULL, never ''. The unique index is partial on
    // `barcode is not null`, so a stored '' would be a real value competing
    // for uniqueness — the second product saved without a barcode would then
    // collide with the first.
    barcode: values.barcode.trim() || null,
    category: values.category as Category,
    unit_price: Number(values.unitPrice.trim() || '0'),
    unit: values.unit.trim(),
    low_stock_threshold: Number(values.lowStockThreshold.trim() || '0'),
    image_url: values.imageUrl.trim() || null,
  }
}

/** Call only after validateProduct returns no errors. */
export function toLotPayloads(values: ProductInput): LotPayload[] {
  return meaningfulLots(values).map((l) => ({
    id: l.id,
    quantity: Number(l.quantity.trim() || '0'),
    // Blank means NULL, not ''. A `date` column would refuse '' outright, but
    // the reason it stays null is the product one: "no expiry" is a real
    // answer for soap and matches, and null is how that is stored.
    expiry_date: l.expiryDate.trim() || null,
  }))
}

/** A single-lot input, for the caller that only ever has one: the CSV import,
 *  whose row carries exactly one stock/expiry pair. */
export function singleLot(quantity: string, expiryDate: string): LotInput[] {
  return [{ quantity, expiryDate }]
}
