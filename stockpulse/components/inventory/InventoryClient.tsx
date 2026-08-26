'use client'

import { useMemo, useState } from 'react'
import { canManage } from '@/lib/permissions'
import { Search, Plus, Pencil, Trash2, Wallet, AlertTriangle, PackageX, X, Upload, ScanLine } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteProduct } from '@/app/(dashboard)/inventory/actions'
import type { Product, Role } from '@/types'
import { categoryLabel, labelMap, type CategoryOption } from '@/lib/categories'
import { formatCurrency } from '@/lib/format'
import { expiryRelative, expiryTone, formatExpiry, nextExpiry } from '@/lib/expiry'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import { LineArtShelf } from '@/components/ui/LineArt'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
// The header strings are shared with the downloadable sample so the two
// cannot drift - see lib/inventoryCsv.ts.
import { INVENTORY_CSV_HEADERS as H } from '@/lib/inventoryCsv'
import ProductModal from './ProductModal'
import ProductThumb from '@/components/ui/ProductThumb'
import ImportProductsModal from './ImportProductsModal'
import ScannerPrototype from '@/components/scan/ScannerPrototype'
import OfflineStatus from '@/components/offline/OfflineStatus'
import { lookupBarcode } from '@/lib/offline/barcodeLookup'

// `CATEGORY_FILTERS` was a fourth hardcoded copy of the list — and the labels
// were re-typed by hand here, so it could disagree with the product form's
// spelling without anything failing. Built from the store's own categories
// now; "All Categories" is the only entry this file still owns.
function categoryFilters(categories: CategoryOption[]): { value: string; label: string }[] {
  return [{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]
}

type StockStatus = 'in' | 'low' | 'out'

const STATUS_FILTERS: { value: StockStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return 'out'
  if (p.stock <= p.low_stock_threshold) return 'low'
  return 'in'
}

function statusFor(p: Product): { label: string; tone: BadgeTone } {
  const status = stockStatus(p)
  if (status === 'out') return { label: 'Out of Stock', tone: 'danger' }
  if (status === 'low') return { label: 'Low Stock', tone: 'warning' }
  return { label: 'In Stock', tone: 'success' }
}

type SortKey = 'name' | 'sku' | 'unit_price' | 'stock' | 'expiry' | 'status'

// Module scope on purpose: this map is a dependency of the sort memo, so a
// literal defined in the component would re-sort on every render.
const SORT_ACCESSORS: SortAccessors<Product, SortKey> = {
  name: (p) => p.name,
  sku: (p) => p.sku,
  unit_price: (p) => p.unit_price,
  stock: (p) => p.stock,
  // The earliest date among lots that still hold something. Returning null for
  // a product with no dated stock is deliberate: useTable sinks blanks in both
  // directions, so clicking Expiry never fills the top of the screen with the
  // rows that have nothing to say.
  expiry: (p) => nextExpiry(p.product_batches),
  // Sort by urgency rather than alphabetically — "Out of Stock" before
  // "In Stock" is the useful order, and A-Z would invert it.
  status: (p) => ({ out: 0, low: 1, in: 2 })[stockStatus(p)],
}

/** Money and counts read best biggest-first on the first click. */
const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = {
  unit_price: 'desc',
  stock: 'desc',
}

// Mirrors the table's columns, with the two values the row shows as secondary
// text (brand, min stock) promoted to columns of their own.
// Takes the label map rather than closing over a constant: the export must
// carry the shop's own category names, and those are only known at render.
const csvColumns = (labels: Record<string, string>): CsvColumn<Product>[] => [
  { header: H.name, value: (p) => p.name },
  { header: H.brand, value: (p) => p.brand },
  { header: H.sku, value: (p) => p.sku },
  // Next to SKU because it is the other identifier, and because
  // lib/importCsv.ts maps the header "barcode" straight back onto this field —
  // an export that round-trips through Excel must not silently lose it.
  { header: H.barcode, value: (p) => p.barcode },
  { header: H.category, value: (p) => categoryLabel(p.category, labels) },
  // Raw numbers, not formatCurrency: "$1,234.00" reaches Excel as text and
  // will not sum. Formatting is the spreadsheet's job.
  { header: H.unitPrice, value: (p) => p.unit_price },
  { header: H.unit, value: (p) => p.unit },
  { header: H.stock, value: (p) => p.stock },
  { header: H.minStock, value: (p) => p.low_stock_threshold },
  // Column index 9, after the Stock/Min Stock pair and before Status —
  // expiry is a fact about the stock on hand, and splitting a value from its
  // threshold to make room would read worse.
  //
  // The header is "Expiry Date" and not "Expires" because lib/importCsv.ts
  // maps that exact string back onto a lot: an export that round-trips
  // through Excel must not silently lose the column, which is the same reason
  // Barcode sits next to SKU.
  //
  // One date, not the lots, because a CSV cell is one value. It is the same
  // date the list column shows: the earliest among lots that still hold
  // something. A product whose lots are all undated exports blank.
  { header: H.expiry, value: (p) => nextExpiry(p.product_batches) },
  { header: H.status, value: (p) => statusFor(p).label },
]

/**
 * The expiry cell. A date alone does not say whether to act on it, and a
 * shopkeeper scanning forty rows should not be doing the subtraction.
 *
 * `today` is a prop all the way from the server so this renders identically
 * before and after hydration — see the header of lib/expiry.ts.
 */
function ExpiryValue({
  date,
  today,
  warningDays,
}: {
  date: string | null
  today: string
  warningDays: number
}) {
  if (!date) return <span className="text-muted">—</span>
  const tone = expiryTone(date, today, warningDays)
  return (
    <span
      className={
        tone === 'expired'
          ? 'font-semibold text-danger'
          : tone === 'soon'
            ? 'font-semibold text-warning'
            : 'text-muted-strong'
      }
    >
      {formatExpiry(date)}
      {tone !== 'ok' && (
        <span className="block text-xs font-medium">
          {tone === 'expired' ? 'Expired' : 'Expiring soon'}
        </span>
      )}
    </span>
  )
}

/**
 * One inventory screen for every width. This replaces the previous pair — a
 * `MobileInventory` under `lg:hidden` next to a desktop tree under
 * `hidden lg:block` — which gave phones a read-only card list while the stock
 * totals, pricing, pagination and every mutation lived in a table no phone
 * could reach.
 *
 * The table is the single source of the row markup: it collapses into cards
 * below `lg` instead of being duplicated, so nothing can drift between the
 * two shapes again.
 */
export default function InventoryClient({
  role,
  storeId,
  initialProducts,
  categories,
  today,
  expiryWarningDays,
  userId,
}: {
  // storeId is no longer needed: mutations go through Server Actions that read
  // the store from the session.
  role: Role
  storeId: string
  initialProducts: Product[]
  /** This store's categories, ordered — the filter row, the CSV export and
   *  the product form all read their labels from here. */
  categories: CategoryOption[]
  /** The shop's calendar date, YYYY-MM-DD, from the server. Never computed
   *  here: `new Date()` in a client component can disagree with the server
   *  render across midnight, and React would swap an "Expired" label under
   *  the reader between the two passes. */
  today: string
  /** This store's warning window (0017). Phase 4: the list column and the
   *  scan both tone against the shop's own number rather than a constant. */
  expiryWarningDays: number
  /** Recorded on the offline snapshot so a shared handset cannot silently
   *  reuse one person's cached list under another's session. */
  userId: string
}) {
  const router = useRouter()
  const toast = useToast()
  const canWrite = canManage(role)
  const labels = useMemo(() => labelMap(categories), [categories])
  const filters = useMemo(() => categoryFilters(categories), [categories])
  const csvCols = useMemo(() => csvColumns(labels), [labels])
  // Rows removed in this session. Revalidation can land a beat after the
  // delete resolves, so hide them locally and let the server data confirm.
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const products = useMemo(
    () => initialProducts.filter((p) => !removedIds.includes(p.id)),
    [initialProducts, removedIds]
  )
  /**
   * Seeded from `?q=`, so a product chosen in the global command palette lands
   * on Inventory already filtered to it. This app has no per-product page, so
   * a filtered list is the closest thing to "go to that product".
   *
   * Initial state only, deliberately - it is not kept in sync with the URL
   * afterwards. Typing in the box must not rewrite history on every keystroke,
   * and a back navigation should return to the list the user was on rather
   * than replaying their typing.
   */
  const initialQuery = useSearchParams().get('q') ?? ''
  const [search, setSearch] = useState(initialQuery)
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<StockStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // --- barcode scanning (Phase 3) -----------------------------------------
  const [scanOpen, setScanOpen] = useState(false)
  /** Carries the scanned digits into ProductModal when nothing matched. */
  const [scanBarcode, setScanBarcode] = useState('')
  const [scanBusy, setScanBusy] = useState(false)
  /** A failed lookup. Shown inside the scanner dialog so the camera stays up
   *  and the user can simply try again. */
  const [scanError, setScanError] = useState('')

  /**
   * A decoded barcode arrives here. One lookup, then one of two existing
   * flows — no third path is introduced.
   *
   *   found    -> exactly what the Edit button does: ProductModal in edit
   *               mode, which is where stock is changed. There is no separate
   *               stock-adjust screen in Inventory to reuse instead.
   *   no match -> exactly what Add Product does, plus the scanned digits
   *               pre-filled into the Barcode field.
   *
   * The lookup is a Server Action, not a filter over the `products` already in
   * memory. The in-memory list is a snapshot from page load: a product added
   * on the till thirty seconds ago would not be in it, and the scan would
   * offer to create a duplicate — which the unique index would then refuse
   * with a message about a product the user cannot see on screen.
   */
  async function handleScanned(value: string) {
    if (scanBusy) return
    setScanBusy(true)
    setScanError('')
    try {
      // The unified lookup, not the Server Action directly: online it IS the
      // Server Action, and offline it answers from this store's cached list
      // using the same validation and the same store scoping.
      const result = await lookupBarcode(value, storeId)
      if (!result.ok) {
        setScanError(result.message)
        return
      }
      if (result.source === 'cache') {
        // Found, but only in the cache. Inventory's whole purpose here is to
        // EDIT the product, and a save cannot reach the server offline - so
        // this refuses clearly rather than opening a form whose Save button
        // would fail. Scope item 5: fail clearly, never silently.
        setScanError(
          result.product
            ? `${result.product.name} is in your saved list, but editing stock needs a connection.`
            : `No saved product has the barcode ${value}. Reconnect to search the full list.`,
        )
        return
      }
      setScanOpen(false)
      if (result.product) {
        setScanBarcode('')
        setEditing(result.product)
        // Phase 4: the scan says what state the stock is in, not just that a
        // row was found. `findProductByBarcode` now returns the lots with the
        // product, so this needs no extra round trip between the beep and the
        // answer. Display only — a scan still opens the same edit form it
        // always did, whatever the date says.
        const scannedExpiry = nextExpiry(result.product.product_batches)
        const tone = scannedExpiry ? expiryTone(scannedExpiry, today, expiryWarningDays) : null
        toast.info(
          'Product found',
          scannedExpiry
            ? `${result.product.name} — ${
                tone === 'expired' ? 'EXPIRED' : 'expires'
              } ${formatExpiry(scannedExpiry)}, ${expiryRelative(scannedExpiry, today)}.`
            : `${result.product.name} — no expiry date. Update the stock and save.`,
        )
      } else {
        setEditing(null)
        setScanBarcode(value)
        toast.info('No product with that barcode', 'Add it now — the barcode is filled in.')
      }
      setModalOpen(true)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'The lookup failed. Try again.')
    } finally {
      setScanBusy(false)
    }
  }

  const filtered = useMemo(() => {
    // One lowercase pass instead of one per row per field.
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        // Typing a barcode into the search box is what a shopkeeper does
        // before there is a scanner — and after there is one, when it will not
        // read a crumpled label. It is visible in the row, so it is findable.
        p.barcode?.includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        // Searching "dairy" or "kg" was a dead end before; both are visible
        // in the row, so both should be findable.
        categoryLabel(p.category, labels).toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      const matchesStatus = status === 'all' || stockStatus(p) === status
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, category, status, labels])

  const table = useTable<Product, SortKey>({
    items: filtered,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'name', dir: 'asc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })
  const pageItems = table.rows

  const filtersActive = search !== '' || category !== 'all' || status !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setStatus('all')
    table.setPage(1)
  }

  const totalValue = products.reduce((sum, p) => sum + p.unit_price * p.stock, 0)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold).length
  const outOfStockCount = products.filter((p) => p.stock <= 0).length

  // No router.refresh() here any more. The Server Action calls
  // revalidatePath('/inventory'), and Next streams the updated RSC payload back
  // as part of the action's response — by the time this runs, the new rows are
  // already in flight. Calling refresh() as well would fire a second, redundant
  // round-trip to the same route.
  function refresh() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete() {
    // Without this guard a second click fires a second DELETE while the first
    // is still in flight.
    if (!deleting || deletingBusy) return
    setDeletingBusy(true)
    setDeleteError('')

    // Server Action: revalidates /inventory and /dashboard, and re-checks the
    // owner role and store ownership rather than trusting the browser.
    const result = await deleteProduct(deleting.id)

    if (!result.ok) {
      setDeletingBusy(false)
      setDeleteError(result.message ?? 'Could not delete the product.')
      toast.error('Could not delete product', result.message)
      return
    }

    toast.success('Product deleted', deleting.name)
    setRemovedIds((prev) => [...prev, deleting.id])
    setDeletingBusy(false)
    setDeleting(null)
    // revalidatePath clears the server cache; this is what makes the client
    // refetch so the row disappears without a manual reload.
    router.refresh()
  }

  return (
    <div className="sp-page">
      <OfflineStatus storeId={storeId} userId={userId} products={products} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Stock</p>
          <h1 className="sp-title mt-2">Inventory Management</h1>
          <p className="sp-body mt-2">Manage stock levels, categories, and pricing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={csvCols}
            rows={table.allRows}
            filenameBase="products"
            itemLabel="products"
          />
          {/* Same gate as Add/Edit/Import: a scan can only end in creating or
              editing a product, and saveProduct refuses both for staff — so
              offering the button to staff would be offering a dead end. */}
          {canWrite && (
            <Button
              variant="secondary"
              onClick={() => {
                setScanError('')
                setScanOpen(true)
              }}
            >
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Scan
            </Button>
          )}
          {canWrite && (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </Button>
          )}
          {canWrite && (
            <Button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="sp-rise sp-e1 mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              table.setPage(1)
            }}
            type="search"
            aria-label="Search inventory"
            placeholder="Search name, SKU, barcode, brand, category, or unit..."
            className="control-h w-full rounded-lg border border-border bg-surface-muted pl-10 pr-12 text-sm placeholder:text-muted transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                table.setPage(1)
              }}
              aria-label="Clear search"
              className="tap-target absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-muted transition hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="inventory-status" className="sr-only">
            Filter by stock status
          </label>
          <select
            id="inventory-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StockStatus | 'all')
              table.setPage(1)
            }}
            className="control-h rounded-lg border border-border bg-surface-muted px-3 text-sm text-muted-strong transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex control-h shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-muted-strong underline-offset-4 transition hover:bg-surface-muted hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        {/* Scrolls sideways where the row cannot fit, wraps once it can. */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setCategory(f.value)
                table.setPage(1)
              }}
              aria-pressed={category === f.value}
              className={`flex control-h shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
                category === f.value
                  ? 'bg-foreground text-surface'
                  : 'border border-border bg-surface text-muted-strong hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:col-span-1 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Value</p>
            <Wallet className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>
        {/* Entrance and stagger only — deliberately NOT sp-e1. That class
            sets `background: var(--surface)` and lives outside Tailwind's
            layers, so it would beat `bg-danger-bg` and quietly repaint this
            card as a plain white one. Same trap D19 recorded. */}
        <div className="sp-rise sp-delay-1 rounded-2xl bg-danger-bg p-4 shadow-sm lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">Low Stock</p>
            <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-danger">{lowStockCount} items</p>
        </div>
        <div className="sp-rise sp-delay-2 rounded-2xl bg-foreground p-4 shadow-sm lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Out of Stock</p>
            <PackageX className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-surface">{outOfStockCount} items</p>
        </div>
      </div>

      <div className="mt-6 lg:overflow-hidden lg:rounded-2xl lg:bg-surface lg:shadow-sm">
        {/* Rows become cards below `lg`; above it the same markup is a table. */}
        <table className="sp-table block w-full text-left text-sm lg:table">
          <thead className="hidden lg:table-header-group">
            <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-muted">
              <SortableTh label="Product" sortKey="name" sort={table.sort} onSort={table.toggleSort} className="px-6" />
              <SortableTh label="SKU / Category" sortKey="sku" sort={table.sort} onSort={table.toggleSort} className="px-4" />
              <SortableTh label="Unit Price" sortKey="unit_price" sort={table.sort} onSort={table.toggleSort} align="right" className="px-4" />
              <SortableTh label="Stock" sortKey="stock" sort={table.sort} onSort={table.toggleSort} align="right" className="px-4" />
              <SortableTh label="Expiry" sortKey="expiry" sort={table.sort} onSort={table.toggleSort} className="px-4" />
              <SortableTh label="Status" sortKey="status" sort={table.sort} onSort={table.toggleSort} className="px-4" />
              {canWrite && (
                <th scope="col" className="px-4 py-3.5">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
            {pageItems.length === 0 && (
              <tr className="block lg:table-row">
                <td
                  colSpan={canWrite ? 7 : 6}
                  className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm lg:table-cell lg:rounded-none lg:shadow-none"
                >
                  {/* An empty store and a filter that matched nothing need
                      different words — and different ways out. */}
                  {products.length === 0 ? (
                    <EmptyState
                      illustration={<LineArtShelf className="h-full w-full" />}
                      title="No products yet"
                      description="Add your first product to start tracking stock levels, pricing, and low-stock alerts."
                      action={
                        canWrite ? (
                          <Button
                            onClick={() => {
                              setEditing(null)
                              setModalOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add Product
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Search}
                      title="No products match your filters"
                      description="Try a different search term, or clear the category and status filters."
                      action={
                        <Button variant="secondary" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      }
                    />
                  )}
                </td>
              </tr>
            )}
            {pageItems.map((p) => {
              // Not `status`: that name is the stock-status filter in this scope.
              const badge = statusFor(p)
              return (
                <tr
                  key={p.id}
                  className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:table-row lg:rounded-none lg:border-b lg:border-border lg:p-0 lg:shadow-none lg:last:border-0 lg:hover:bg-surface-muted"
                >
                  <td className="block lg:table-cell lg:px-6 lg:py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumb name={p.name} imageUrl={p.image_url} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{p.name}</p>
                        {p.brand && <p className="truncate text-xs text-muted">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="mt-3 flex items-center justify-between gap-2 lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <div className="min-w-0">
                      <p className="text-muted-strong">SKU: {p.sku || '—'}</p>
                      {/* Rendered only when set. A row of "Barcode: —" on 41
                          products would be 41 lines saying nothing, and this
                          cell already carries the category chip. */}
                      {p.barcode && (
                        <p className="sp-num truncate text-xs text-muted">Barcode: {p.barcode}</p>
                      )}
                    </div>
                    <span className="inline-block shrink-0 rounded bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase text-muted lg:mt-1">
                      {categoryLabel(p.category, labels)}
                    </span>
                  </td>
                  <td className="sp-num mt-2 flex items-center justify-between gap-2 text-muted-strong lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Unit Price
                    </span>
                    {formatCurrency(p.unit_price)}
                  </td>
                  <td className="sp-num mt-2 flex items-center justify-between gap-2 lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Stock
                    </span>
                    <span>
                      <span
                        className={
                          p.stock <= p.low_stock_threshold
                            ? 'font-semibold text-danger'
                            : 'text-muted-strong'
                        }
                      >
                        {p.stock}
                      </span>
                      {p.stock <= p.low_stock_threshold && p.stock > 0 && (
                        <span className="ml-2 text-xs text-muted lg:ml-0 lg:block">
                          Min: {p.low_stock_threshold}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-2 lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Expiry
                    </span>
                    <ExpiryValue
                      date={nextExpiry(p.product_batches)}
                      today={today}
                      warningDays={expiryWarningDays}
                    />
                  </td>
                  <td className="mt-3 block lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  {canWrite && (
                    <td className="sp-row-actions mt-2 flex items-center gap-1 border-t border-border pt-2 lg:mt-0 lg:table-cell lg:border-0 lg:px-4 lg:py-4 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(p)
                          setModalOpen(true)
                        }}
                        aria-label={`Edit ${p.name}`}
                        className="tap-target rounded-lg text-muted hover:bg-surface-muted"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        aria-label={`Delete ${p.name}`}
                        className="tap-target rounded-lg text-muted hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>

        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          pageSize={table.pageSize}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          total={table.total}
          itemLabel="products"
        />
      </div>

      {importOpen && (
        <ImportProductsModal
          products={products}
          categories={categories}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* The scanner itself is Phase 2's component, mounted unchanged apart
          from the onDetected callback. Every camera fault, the QR/wrong-
          symbology message and the "still looking" state come from there —
          none of it is reimplemented here. */}
      {scanOpen && (
        <Modal
          title="Scan a barcode"
          width="sm"
          onClose={() => {
            setScanOpen(false)
            setScanError('')
          }}
        >
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-muted-strong">
              Point the camera at a product barcode. If it is already in your inventory you can
              update its stock; if not, you can add it.
            </p>

            <ScannerPrototype onDetected={handleScanned} />

            {scanBusy && <p className="text-sm text-muted">Looking that barcode up…</p>}

            {scanError && (
              <div role="alert" className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                {scanError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {modalOpen && (
        <ProductModal
          product={editing}
          storeId={storeId}
          categories={categories}
          initialBarcode={scanBarcode}
          today={today}
          expiryWarningDays={expiryWarningDays}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
            // Cleared on close so the next manual Add Product does not open
            // carrying digits from an earlier scan.
            setScanBarcode('')
          }}
          onSaved={refresh}
        />
      )}

      {deleting && (
        <Modal
          title="Delete product?"
          width="sm"
          onClose={() => {
            setDeleting(null)
            setDeleteError('')
          }}
        >
          <div className="space-y-4 px-6 py-5">
            {deleteError && (
              <div role="alert" className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                {deleteError}
              </div>
            )}

            <p className="text-sm text-muted-strong">
              This will permanently remove{' '}
              <span className="font-semibold text-foreground">{deleting.name}</span> from inventory.
            </p>

            <div className="flex gap-3 pt-1">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setDeleting(null)
                  setDeleteError('')
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" fullWidth loading={deletingBusy} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
