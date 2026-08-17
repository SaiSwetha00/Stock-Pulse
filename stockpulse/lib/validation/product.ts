import type { Category } from '@/types'

// The `CATEGORIES` constant was here — a second copy of the same five slugs
// ProductModal also carried, and the CHECK constraint carried a third time.
// Since migration 0013 the allowed set is per-store data, so it arrives as an
// argument instead. Deleted rather than defaulted: a default would let a call
// site validate against yesterday's list and still compile.

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type ProductInput = {
  name: string
  brand: string
  sku: string
  /** Optional. Typed by hand today; a later phase fills it from a camera.
   *  Kept as a raw string like every other field here so the form, the CSV
   *  import and the Server Action all validate the same value. */
  barcode: string
  category: string
  unitPrice: string
  unit: string
  stock: string
  lowStockThreshold: string
  expiryDate: string
  /** Public Storage URL, or '' for no photo. Not user-typed — it is set by
   *  ProductImageUpload after a successful upload, so there is nothing to
   *  validate beyond empty-means-null. */
  imageUrl: string
}

export type ProductErrors = Partial<Record<keyof ProductInput, string>>

/** What actually goes to the database once validation passes. */
export type ProductPayload = {
  name: string
  brand: string | null
  sku: string | null
  barcode: string | null
  category: Category
  unit_price: number
  unit: string
  stock: number
  low_stock_threshold: number
  expiry_date: string | null
  image_url: string | null
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
const BARCODE = /^[0-9]{8,14}$/

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

  const stock = Number(values.stock.trim() || '0')
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Must be a whole number, zero or more.'

  const threshold = Number(values.lowStockThreshold.trim() || '0')
  if (!Number.isInteger(threshold) || threshold < 0) {
    errors.lowStockThreshold = 'Must be a whole number, zero or more.'
  }

  if (!values.unit.trim()) errors.unit = 'Unit is required.'

  const expiry = values.expiryDate.trim()
  if (expiry && !ISO_DATE.test(expiry)) errors.expiryDate = 'Use the date picker.'

  return errors
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
    stock: Number(values.stock.trim() || '0'),
    low_stock_threshold: Number(values.lowStockThreshold.trim() || '0'),
    expiry_date: values.expiryDate.trim() || null,
    image_url: values.imageUrl.trim() || null,
  }
}
