import { toCsv, type CsvColumn } from './csv'
import { isImportableHeader } from './importCsv'

/**
 * The inventory CSV format, in one place.
 *
 * WHY THIS FILE EXISTS. The export's header strings used to be inline literals
 * inside `InventoryClient`, and `lib/importCsv.ts` mapped those exact strings
 * back on the way in. That already made them a contract between two files that
 * never referenced each other - CLAUDE.md records the `Barcode` and
 * `Expiry Date` columns each needing a comment explaining that renaming them
 * silently breaks the Excel round trip.
 *
 * Adding a downloadable sample would have made it a contract between THREE
 * places. So the header strings live here, `InventoryClient` builds its export
 * columns from them, and the sample below is generated from the same
 * constants - a renamed column changes the export and the sample together, and
 * cannot change only one.
 *
 * The `Status` column is deliberately absent from the sample. It is in the
 * export because a person reading the file wants it, but `HEADER_MAP` has no
 * entry for it, so re-importing a file containing it produces an "Ignored
 * unrecognised column: status" notice. A sample file that warns on its own
 * re-upload teaches the wrong thing about the format. Rather than
 * hand-maintaining a second, shorter list, the sample is filtered through
 * `isImportableHeader`, which reads the parser's own map - so any column the
 * parser cannot take is dropped automatically, including ones added later.
 */
export const INVENTORY_CSV_HEADERS = {
  name: 'Name',
  brand: 'Brand',
  sku: 'SKU',
  barcode: 'Barcode',
  category: 'Category',
  unitPrice: 'Unit Price',
  unit: 'Unit',
  stock: 'Stock',
  minStock: 'Min Stock',
  expiry: 'Expiry Date',
  status: 'Status',
} as const

interface SampleRow {
  name: string
  brand: string
  sku: string
  barcode: string
  category: string
  unitPrice: number
  unit: string
  stock: number
  minStock: number
  expiry: string
}

/**
 * Rows chosen to answer the questions the format actually raises rather than to
 * look plausible: a 13-digit EAN so the barcode column's shape is obvious, a
 * blank barcode and a blank expiry so both are visibly optional, a decimal
 * price, a unit that is not "pcs", and one row already under its minimum so the
 * file shows what a low-stock product looks like.
 *
 * Category values are the default category NAMES. `normaliseCategory` accepts
 * either a slug or a name and falls back to `packaged`, so these import cleanly
 * against a shop that has renamed nothing.
 */
const SAMPLE_ROWS: SampleRow[] = [
  {
    name: 'Toor Dal',
    brand: 'Tata Sampann',
    sku: 'TD-1KG',
    barcode: '8901058000108',
    category: 'Packaged Goods',
    unitPrice: 185,
    unit: 'kg',
    stock: 24,
    minStock: 10,
    expiry: '2027-03-31',
  },
  {
    name: 'Full Cream Milk 1L',
    brand: 'Amul',
    sku: 'AM-FCM-1L',
    barcode: '8901262010016',
    category: 'Dairy & Eggs',
    unitPrice: 68,
    unit: 'pcs',
    // Under its minimum on purpose: the sample should show what a product the
    // dashboard will flag looks like, not only healthy rows.
    stock: 6,
    minStock: 12,
    expiry: '2026-09-02',
  },
  {
    name: 'Bananas',
    brand: '',
    sku: 'PR-BAN',
    // Loose produce has no barcode. Blank, not zero - the column is optional,
    // and this is what optional looks like.
    barcode: '',
    category: 'Produce',
    unitPrice: 54.5,
    unit: 'kg',
    stock: 18,
    minStock: 5,
    expiry: '2026-08-24',
  },
  {
    name: 'Dishwash Gel 750ml',
    brand: 'Vim',
    sku: 'VM-DW-750',
    barcode: '8901030629914',
    category: 'Household',
    unitPrice: 129,
    unit: 'pcs',
    stock: 40,
    minStock: 8,
    // Cleaning supplies do not expire in any way a shop tracks.
    expiry: '',
  },
  {
    name: 'Basmati Rice 5kg',
    brand: 'India Gate',
    sku: 'IG-BAS-5',
    barcode: '8901022201054',
    category: 'Packaged Goods',
    unitPrice: 640,
    unit: 'bag',
    stock: 12,
    minStock: 4,
    // Dry goods carry a long date rather than none, so the column shows a
    // far-future value as well as the near ones above.
    expiry: '2027-11-30',
  },
  {
    name: 'Whole Wheat Bread',
    brand: 'Britannia',
    sku: 'BR-WW-400',
    barcode: '8901063093157',
    category: 'Packaged Goods',
    unitPrice: 45,
    unit: 'pcs',
    stock: 22,
    minStock: 6,
    expiry: '2026-08-28',
  },
  {
    name: 'Sunflower Cooking Oil 1L',
    brand: 'Fortune',
    sku: 'FT-SFO-1L',
    barcode: '8901725111038',
    category: 'Packaged Goods',
    unitPrice: 155.75,
    unit: 'pcs',
    stock: 30,
    minStock: 10,
    expiry: '2027-01-15',
  },
  {
    name: 'Farm Eggs (12)',
    brand: '',
    sku: 'EG-12',
    // A second blank barcode, so the pattern reads as deliberate rather than
    // as one row somebody forgot to fill in.
    barcode: '',
    category: 'Dairy & Eggs',
    unitPrice: 84,
    unit: 'pack',
    stock: 15,
    minStock: 6,
    expiry: '2026-09-05',
  },
]

const H = INVENTORY_CSV_HEADERS

const SAMPLE_COLUMNS: CsvColumn<SampleRow>[] = [
  { header: H.name, value: (r) => r.name },
  { header: H.brand, value: (r) => r.brand },
  { header: H.sku, value: (r) => r.sku },
  { header: H.barcode, value: (r) => r.barcode },
  { header: H.category, value: (r) => r.category },
  { header: H.unitPrice, value: (r) => r.unitPrice },
  { header: H.unit, value: (r) => r.unit },
  { header: H.stock, value: (r) => r.stock },
  { header: H.minStock, value: (r) => r.minStock },
  { header: H.expiry, value: (r) => r.expiry },
]

/**
 * The sample file's contents. Serialised by the same `toCsv` the export uses,
 * so quoting, formula-injection escaping and CRLF line endings are identical -
 * a sample round-tripped through a different serialiser would not prove the
 * real one works.
 */
export function sampleImportCsv(): string {
  return toCsv(
    SAMPLE_COLUMNS.filter((c) => isImportableHeader(c.header)),
    SAMPLE_ROWS,
  )
}
