'use client'

import { useMemo, useState } from 'react'
import { canManage } from '@/lib/permissions'
import { Search, Plus, Pencil, Trash2, Wallet, AlertTriangle, PackageX, X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/app/(dashboard)/inventory/actions'
import { CATEGORY_LABELS, type Category, type Product, type Role } from '@/types'
import { formatCurrency } from '@/lib/format'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import ProductModal from './ProductModal'
import ImportProductsModal from './ImportProductsModal'

const CATEGORY_FILTERS: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy & Eggs' },
  { value: 'packaged', label: 'Packaged Goods' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'household', label: 'Household' },
]

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

type SortKey = 'name' | 'sku' | 'unit_price' | 'stock' | 'status'

// Module scope on purpose: this map is a dependency of the sort memo, so a
// literal defined in the component would re-sort on every render.
const SORT_ACCESSORS: SortAccessors<Product, SortKey> = {
  name: (p) => p.name,
  sku: (p) => p.sku,
  unit_price: (p) => p.unit_price,
  stock: (p) => p.stock,
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
const CSV_COLUMNS: CsvColumn<Product>[] = [
  { header: 'Name', value: (p) => p.name },
  { header: 'Brand', value: (p) => p.brand },
  { header: 'SKU', value: (p) => p.sku },
  { header: 'Category', value: (p) => CATEGORY_LABELS[p.category] },
  // Raw numbers, not formatCurrency: "$1,234.00" reaches Excel as text and
  // will not sum. Formatting is the spreadsheet's job.
  { header: 'Unit Price', value: (p) => p.unit_price },
  { header: 'Unit', value: (p) => p.unit },
  { header: 'Stock', value: (p) => p.stock },
  { header: 'Min Stock', value: (p) => p.low_stock_threshold },
  { header: 'Status', value: (p) => statusFor(p).label },
]

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
  initialProducts,
}: {
  // storeId is no longer needed: mutations go through Server Actions that read
  // the store from the session.
  role: Role
  initialProducts: Product[]
}) {
  const router = useRouter()
  const toast = useToast()
  const canWrite = canManage(role)
  // Rows removed in this session. Revalidation can land a beat after the
  // delete resolves, so hide them locally and let the server data confirm.
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const products = useMemo(
    () => initialProducts.filter((p) => !removedIds.includes(p.id)),
    [initialProducts, removedIds]
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [status, setStatus] = useState<StockStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const filtered = useMemo(() => {
    // One lowercase pass instead of one per row per field.
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        // Searching "dairy" or "kg" was a dead end before; both are visible
        // in the row, so both should be findable.
        CATEGORY_LABELS[p.category].toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      const matchesStatus = status === 'all' || stockStatus(p) === status
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, category, status])

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Stock</p>
          <h1 className="sp-title mt-2">Inventory Management</h1>
          <p className="sp-body mt-2">Manage stock levels, categories, and pricing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={CSV_COLUMNS}
            rows={table.allRows}
            filenameBase="products"
            itemLabel="products"
          />
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

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
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
            placeholder="Search name, SKU, brand, category, or unit..."
            className="control-h w-full rounded-xl border border-border bg-surface pl-10 pr-12 text-sm placeholder:text-muted focus:border-border-strong focus:outline-none"
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
            className="control-h rounded-xl border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
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
          {CATEGORY_FILTERS.map((f) => (
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
        <div className="col-span-2 rounded-2xl bg-surface p-4 shadow-sm sm:col-span-1 lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Value</p>
            <Wallet className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-2xl bg-danger-bg p-4 shadow-sm lg:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">Low Stock</p>
            <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-bold text-danger">{lowStockCount} items</p>
        </div>
        <div className="rounded-2xl bg-foreground p-4 shadow-sm lg:p-6">
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
              <SortableTh label="Unit Price" sortKey="unit_price" sort={table.sort} onSort={table.toggleSort} className="px-4" />
              <SortableTh label="Stock" sortKey="stock" sort={table.sort} onSort={table.toggleSort} className="px-4" />
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
                  colSpan={canWrite ? 6 : 5}
                  className="block rounded-2xl bg-surface shadow-sm lg:table-cell lg:rounded-none lg:shadow-none"
                >
                  {/* An empty store and a filter that matched nothing need
                      different words — and different ways out. */}
                  {products.length === 0 ? (
                    <EmptyState
                      icon={PackageX}
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
                  className="block rounded-2xl bg-surface p-4 shadow-sm lg:table-row lg:rounded-none lg:border-b lg:border-border lg:p-0 lg:shadow-none lg:last:border-0 lg:hover:bg-surface-muted"
                >
                  <td className="block lg:table-cell lg:px-6 lg:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-sm font-bold text-muted">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{p.name}</p>
                        {p.brand && <p className="truncate text-xs text-muted">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="mt-3 flex items-center justify-between gap-2 lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <p className="text-muted-strong">SKU: {p.sku || '—'}</p>
                    <span className="inline-block rounded bg-surface-muted px-2 py-0.5 text-xs font-medium uppercase text-muted lg:mt-1">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-2 text-muted-strong lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Unit Price
                    </span>
                    {formatCurrency(p.unit_price)}
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-2 lg:mt-0 lg:table-cell lg:px-4 lg:py-4">
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
        <ImportProductsModal products={products} onClose={() => setImportOpen(false)} />
      )}

      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
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
