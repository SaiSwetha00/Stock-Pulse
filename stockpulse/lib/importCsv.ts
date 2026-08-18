import {
  describeProductErrors,
  singleLot,
  validateProduct,
  type ProductInput,
} from '@/lib/validation/product'
import type { CategoryOption } from '@/lib/categories'

/**
 * RFC 4180 parser. Deliberately hand-written rather than pulled from a
 * dependency: the grammar is small, and the failure modes that matter here
 * (quoted commas, embedded newlines, doubled quotes, a BOM from Excel) are
 * exactly the ones a naive `split(',')` gets wrong.
 */
export function parseCsv(text: string): string[][] {
  // Excel writes a BOM; left in place it becomes part of the first header.
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const c = src[i]

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r') {
      // Swallow; the \n that follows ends the record.
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }

  // A final line with no trailing newline still counts.
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Drop entirely blank records.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Everything on a product row that is a plain string cell. */
type ScalarField = Exclude<keyof ProductInput, 'lots'>

/**
 * The two cells that become the row's ONE lot.
 *
 * They are not fields of ProductInput any more, because a lot is not a
 * product-level value: a product has many, a CSV row can only say one. They
 * are collected separately and folded into `input.lots` at the end of the row.
 */
type LotField = 'lotQuantity' | 'lotExpiry'

/** Header aliases, lowercased. Mirrors the export headers so a file exported
 *  from StockPulse, edited in Excel, re-imports without renaming anything. */
const HEADER_MAP: Record<string, ScalarField | LotField> = {
  name: 'name',
  'product name': 'name',
  product: 'name',
  brand: 'brand',
  sku: 'sku',
  // Without these the inventory export's new "Barcode" column comes back as an
  // unknown header and every barcode in the file is dropped — silently, since
  // an unmapped column is simply never read. EAN/UPC/GTIN are the names a
  // supplier's own price list is most likely to use.
  barcode: 'barcode',
  'bar code': 'barcode',
  ean: 'barcode',
  upc: 'barcode',
  gtin: 'barcode',
  category: 'category',
  'unit price': 'unitPrice',
  price: 'unitPrice',
  unit: 'unit',
  stock: 'lotQuantity',
  quantity: 'lotQuantity',
  qty: 'lotQuantity',
  'min stock': 'lowStockThreshold',
  'low stock threshold': 'lowStockThreshold',
  minimum: 'lowStockThreshold',
  // "Expiry Date" is what the inventory export writes, and it has to keep
  // mapping here for the same reason "Barcode" does: an export that
  // round-trips through Excel must not silently lose a column.
  expiry: 'lotExpiry',
  'expiry date': 'lotExpiry',
  expires: 'lotExpiry',
  'best before': 'lotExpiry',
}

function isLotField(key: ScalarField | LotField): key is LotField {
  return key === 'lotQuantity' || key === 'lotExpiry'
}

/** Accepts either the stored key ("dairy") or the displayed label
 *  ("Dairy & Eggs"), since the export writes labels. */
function normaliseCategory(raw: string, categories: CategoryOption[]): string {
  const v = raw.trim()
  if (!v) return ''
  const lower = v.toLowerCase()
  if (categories.some((c) => c.slug === lower)) return lower
  const match = categories.find((c) => c.name.toLowerCase() === lower)
  // Unmatched values are passed through untouched so validateProduct reports
  // "Choose a valid category" against what the file actually said, rather
  // than against something this function invented.
  return match?.slug ?? v
}

export type RowAction = 'create' | 'update' | 'error'

export interface ParsedRow {
  /** 1-based line number in the source file, header included, for messages. */
  line: number
  input: ProductInput
  action: RowAction
  /** Populated only when action === 'error'. */
  problems: string[]
}

export interface ImportPreview {
  rows: ParsedRow[]
  createCount: number
  updateCount: number
  errorCount: number
  /** Headers present in the file that we do not recognise — surfaced so a
   *  mis-mapped column is visible rather than silently dropped. */
  unknownHeaders: string[]
  missingRequired: string[]
  /**
   * True when the file has a Stock/Quantity or Expiry column, i.e. when it is
   * saying something about what is on the shelf.
   *
   * A row can describe only one lot, so importing stock REPLACES a product's
   * lots. A price list with neither column must therefore leave them alone
   * rather than clear them — which is what the old code did, silently, by
   * turning a missing Stock column into `0`.
   */
  replacesLots: boolean
}

const EMPTY: ProductInput = {
  name: '',
  brand: '',
  sku: '',
  barcode: '',
  category: '',
  unitPrice: '',
  unit: '',
  lowStockThreshold: '',
  // CSV has no image column; a bulk import leaves the photo unset rather
  // than inventing one.
  imageUrl: '',
  lots: [],
}

/**
 * Turns raw CSV into a classified, previewable plan. Nothing is written here —
 * the caller shows this to the user and only then submits the good rows.
 *
 * `existingSkus` decides create-vs-update, so the preview can state honestly
 * which rows will overwrite something.
 */
export function buildImportPreview(
  text: string,
  existingSkus: Set<string>,
  /** The store's categories. A CSV may name one by slug or by label, and both
   *  have to resolve against this shop's list rather than a built-in five. */
  categories: CategoryOption[],
): ImportPreview {
  const table = parseCsv(text)
  if (table.length === 0) {
    return {
      rows: [],
      createCount: 0,
      updateCount: 0,
      errorCount: 0,
      unknownHeaders: [],
      missingRequired: ['Name'],
      replacesLots: false,
    }
  }

  const header = table[0].map((h) => h.trim().toLowerCase())
  const mapped = header.map((h) => HEADER_MAP[h] ?? null)
  const unknownHeaders = header.filter((h, i) => mapped[i] === null && h !== '')

  const missingRequired: string[] = []
  if (!mapped.includes('name')) missingRequired.push('Name')

  const replacesLots = mapped.some((k) => k !== null && isLotField(k))

  const rows: ParsedRow[] = []
  // Track SKUs seen within this file so a duplicate inside one upload is
  // reported rather than silently applied twice.
  const seenInFile = new Set<string>()
  // Same guard, for the other unique column. Without it a file carrying one
  // barcode twice previews as two clean rows and then fails at the database
  // on whichever happens to be written second — a success screen with a
  // failure buried in it, which is the shape this file already avoids for SKU.
  const seenBarcodes = new Set<string>()

  for (let r = 1; r < table.length; r++) {
    const cells = table[r]
    const input: ProductInput = { ...EMPTY, lots: [] }
    let lotQuantity = ''
    let lotExpiry = ''

    mapped.forEach((key, i) => {
      if (!key) return
      const cell = (cells[i] ?? '').trim()
      if (key === 'lotQuantity') lotQuantity = cell
      else if (key === 'lotExpiry') lotExpiry = cell
      else input[key] = cell
    })

    // One lot per row, and only when the file said anything about stock.
    if (replacesLots) input.lots = singleLot(lotQuantity, lotExpiry)

    input.category = normaliseCategory(input.category, categories)
    // A file that omits these columns entirely should still import: fall back
    // to the same defaults the form uses rather than failing validation.
    if (!input.unit) input.unit = 'ea'
    if (!input.category) input.category = 'packaged'

    const errors = validateProduct(input, categories.map((c) => c.slug))
    // Not Object.values: `lotRows` is an array of objects, which would reach a
    // shopkeeper's import report as "[object Object]".
    const problems = describeProductErrors(errors)

    const sku = input.sku.trim().toLowerCase()
    if (sku && seenInFile.has(sku)) {
      problems.push(`Duplicate SKU "${input.sku.trim()}" appears earlier in this file.`)
    }
    if (sku) seenInFile.add(sku)

    const barcode = input.barcode.trim()
    if (barcode && seenBarcodes.has(barcode)) {
      problems.push(`Duplicate barcode "${barcode}" appears earlier in this file.`)
    }
    if (barcode) seenBarcodes.add(barcode)

    let action: RowAction
    if (problems.length > 0) action = 'error'
    else if (sku && existingSkus.has(sku)) action = 'update'
    else action = 'create'

    rows.push({ line: r + 1, input, action, problems })
  }

  return {
    rows,
    createCount: rows.filter((x) => x.action === 'create').length,
    updateCount: rows.filter((x) => x.action === 'update').length,
    errorCount: rows.filter((x) => x.action === 'error').length,
    unknownHeaders,
    missingRequired,
    replacesLots,
  }
}
