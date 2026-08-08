'use client'

import { useMemo, useState } from 'react'
import { Search, Plus, Truck, Pencil, Trash2, X } from 'lucide-react'
import { RelativeTime, useLocalToday } from '@/components/ui/LocalTime'
import {
  SUPPLIER_CATEGORY_LABELS,
  SHIPMENT_STATUS_LABELS,
  type Shipment,
  type Supplier,
  type SupplierActivity,
  type SupplierCategory,
  type SupplierStatus,
  type ShipmentStatus,
} from '@/types'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import SupplierModal from './SupplierModal'
import DeleteSupplierDialog from './DeleteSupplierDialog'
import AddShipmentModal from './AddShipmentModal'

// Must cover every value the suppliers.category check constraint allows —
// 'beverages' and 'bakery' were missing, so those suppliers could not be
// filtered to at all.
const CATEGORY_FILTERS: { value: SupplierCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'dry_goods', label: 'Dry Goods' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'bakery', label: 'Bakery' },
]

const STATUS_TONE: Record<Supplier['status'], BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
  issue: 'danger',
}

const TRACKER_STAGES: ShipmentStatus[] = ['ordered', 'shipped', 'transit', 'dock']

// `today` is null until hydrated — the server's calendar day may not be the
// viewer's, and "Arriving Today" is exactly the kind of claim that must not
// differ between the server HTML and the client.
function shipmentBadge(shipment: Shipment, today: string | null) {
  if (today !== null && shipment.eta === today && shipment.status !== 'dock') {
    return { label: 'Arriving Today', className: 'bg-success-bg text-success' }
  }
  if (shipment.status === 'transit') {
    return { label: 'In Transit', className: 'bg-surface-muted text-muted-strong' }
  }
  return { label: SHIPMENT_STATUS_LABELS[shipment.status], className: 'bg-surface-muted text-muted-strong' }
}

const STATUS_FILTERS: { value: SupplierStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'issue', label: 'Issue' },
  { value: 'inactive', label: 'Inactive' },
]

type SortKey = 'name' | 'primary_contact' | 'category' | 'active_orders' | 'status'

// Module scope: the map is a sort-memo dependency, so a literal inside the
// component would re-sort on every render.
const SORT_ACCESSORS: SortAccessors<Supplier, SortKey> = {
  name: (s) => s.name,
  primary_contact: (s) => s.primary_contact,
  category: (s) => SUPPLIER_CATEGORY_LABELS[s.category],
  active_orders: (s) => s.active_orders ?? 0,
  // Needing-attention first rather than alphabetical.
  status: (s) => ({ issue: 0, active: 1, inactive: 2 })[s.status],
}

const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = {
  active_orders: 'desc',
}

const STATUS_LABELS: Record<SupplierStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  issue: 'Issue',
}

const CSV_COLUMNS: CsvColumn<Supplier>[] = [
  { header: 'Supplier Name', value: (s) => s.name },
  { header: 'Primary Contact', value: (s) => s.primary_contact },
  { header: 'Category', value: (s) => SUPPLIER_CATEGORY_LABELS[s.category] },
  { header: 'Active Orders', value: (s) => s.active_orders ?? 0 },
  { header: 'Status', value: (s) => STATUS_LABELS[s.status] },
]

export default function SuppliersClient({
  suppliers,
  shipments,
  activity,
  totalPallets,
  receivedPallets,
}: {
  // storeId removed: supplier and shipment mutations go through Server Actions
  // that read the store from the session.
  suppliers: Supplier[]
  shipments: Shipment[]
  activity: SupplierActivity[]
  totalPallets: number
  receivedPallets: number
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<SupplierCategory | 'all'>('all')
  const [status, setStatus] = useState<SupplierStatus | 'all'>('all')
  // `'new'` opens a blank form; a Supplier opens it prefilled for editing.
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [shipmentOpen, setShipmentOpen] = useState(false)
  const today = useLocalToday()

  const filtered = useMemo(() => {
    // Hoisted out of the loop: this was being recomputed for every row.
    const q = search.trim().toLowerCase()
    return suppliers.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.primary_contact?.toLowerCase().includes(q) ?? false) ||
        SUPPLIER_CATEGORY_LABELS[s.category].toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || s.category === category
      const matchesStatus = status === 'all' || s.status === status
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [suppliers, search, category, status])

  const table = useTable<Supplier, SortKey>({
    items: filtered,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'name', dir: 'asc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })

  const filtersActive = search !== '' || category !== 'all' || status !== 'all'

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setStatus('all')
    table.setPage(1)
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Supply chain</p>
          <h1 className="sp-title mt-2">Supplier Management</h1>
          <p className="sp-body mt-2">Manage vendor relationships and track inbound freight.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={CSV_COLUMNS}
            rows={table.allRows}
            filenameBase="suppliers"
            itemLabel="suppliers"
          />
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    table.setPage(1)
                  }}
                  type="search"
                  aria-label="Search suppliers"
                  placeholder="Search name, contact, category, or status..."
                  className="control-h w-full rounded-xl border border-border bg-surface-muted pl-10 pr-12 text-sm placeholder:text-muted focus:border-border-strong focus:bg-surface focus:outline-none"
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
                <label htmlFor="supplier-status" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="supplier-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as SupplierStatus | 'all')
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
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setCategory(f.value)
                      table.setPage(1)
                    }}
                    className={`flex control-h items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
                      category === f.value
                        ? 'bg-foreground text-surface'
                        : 'bg-surface-muted text-muted-strong hover:bg-surface-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows become a card list below `lg`. Unlike inventory these sit
                inside an existing panel, so they are padded blocks divided by
                a rule rather than floating cards — a card inside a card reads
                as a mistake. */}
            <div className="border-t border-border lg:overflow-x-auto">
              <table className="sp-table block w-full text-left text-sm lg:table">
                <thead className="hidden lg:table-header-group">
                  <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-muted">
                    <SortableTh label="Supplier Name" sortKey="name" sort={table.sort} onSort={table.toggleSort} className="px-6" />
                    <SortableTh label="Primary Contact" sortKey="primary_contact" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                    <SortableTh label="Category" sortKey="category" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                    <SortableTh label="Active Orders" sortKey="active_orders" sort={table.sort} onSort={table.toggleSort} align="right" className="px-4" />
                    <SortableTh label="Status" sortKey="status" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="block lg:table-row-group">
                  {filtered.length === 0 && (
                    <tr className="block lg:table-row">
                      <td colSpan={6} className="block lg:table-cell">
                        {suppliers.length === 0 ? (
                          <EmptyState
                            icon={Truck}
                            title="No suppliers yet"
                            description="Add a supplier to track incoming shipments and delivery performance."
                            action={
                              <Button onClick={() => setEditing('new')}>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Add Supplier
                              </Button>
                            }
                          />
                        ) : (
                          <EmptyState
                            icon={Search}
                            title="No suppliers match your filters"
                            description="Try a different search term or category."
                          />
                        )}
                      </td>
                    </tr>
                  )}
                  {table.rows.map((s) => (
                    <tr
                      key={s.id}
                      className="block border-b border-border p-4 last:border-0 lg:table-row lg:p-0"
                    >
                      <td className="block lg:table-cell lg:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="font-semibold text-foreground">{s.name}</p>
                        </div>
                      </td>
                      {/* Below `lg` the column header is gone, so each value
                          carries its own label. */}
                      <td className="mt-3 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          Contact
                        </span>
                        {s.primary_contact || '—'}
                      </td>
                      <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:px-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          Category
                        </span>
                        <span className="rounded bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase text-muted-strong">
                          {SUPPLIER_CATEGORY_LABELS[s.category]}
                        </span>
                      </td>
                      <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4 lg:text-right">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          Active Orders
                        </span>
                        {s.active_orders ?? 0}
                      </td>
                      <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:px-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          Status
                        </span>
                        <Badge tone={STATUS_TONE[s.status]} dot>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="sp-row-actions mt-2 block border-t border-border pt-2 lg:mt-0 lg:table-cell lg:border-0 lg:px-4 lg:pt-0">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(s)}
                            aria-label={`Edit ${s.name}`}
                            className="tap-target rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(s)}
                            aria-label={`Delete ${s.name}`}
                            className="tap-target rounded-lg text-muted transition hover:bg-danger-bg hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* A "View All Suppliers" button sat here with no handler. This
                table now paginates like the others, so there is nowhere else
                to go and nothing to link to. */}
            <Pagination
              page={table.page}
              totalPages={table.totalPages}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              rangeStart={table.rangeStart}
              rangeEnd={table.rangeEnd}
              total={table.total}
              itemLabel="suppliers"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-foreground p-6 shadow-sm">
            <p className="text-sm font-semibold text-surface">Today&apos;s Inbound</p>
            <p className="mt-2 text-4xl font-bold text-surface">{totalPallets}</p>
            <p className="text-sm text-muted">Pallets Expected</p>
            <div className="mt-4 flex gap-6 border-t border-border pt-4 text-sm">
              <div>
                <p className="text-muted">Received</p>
                <p className="font-semibold text-surface">{receivedPallets}</p>
              </div>
              <div>
                <p className="text-muted">Pending</p>
                <p className="font-semibold text-surface">{totalPallets - receivedPallets}</p>
              </div>
            </div>
          </div>

          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="sp-heading">Incoming Shipments</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShipmentOpen(true)}
                  className="tap-target rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
                  aria-label="Add shipment"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
                <Truck className="h-5 w-5 text-muted" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 space-y-5">
              {shipments.length === 0 && (
                <EmptyState
                  icon={Truck}
                  title="No incoming shipments"
                  description="Log a shipment to track it from dock to shelf."
                  className="py-10"
                />
              )}
              {shipments.map((s) => {
                const badge = shipmentBadge(s, today)
                const stageIndex = TRACKER_STAGES.indexOf(s.status)
                return (
                  <div key={s.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{s.po_number}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{s.suppliers?.name}</p>

                    <div className="mt-3 flex items-center">
                      {TRACKER_STAGES.map((stage, i) => (
                        <div key={stage} className="flex flex-1 items-center last:flex-none">
                          <div
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              i <= stageIndex ? 'bg-foreground' : 'bg-surface-muted'
                            }`}
                          />
                          {i < TRACKER_STAGES.length - 1 && (
                            <div className={`h-0.5 flex-1 ${i < stageIndex ? 'bg-foreground' : 'bg-surface-muted'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted">
                      <span>Ordered</span>
                      <span>Shipped</span>
                      <span>Transit</span>
                      <span>Dock</span>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="sp-heading">Recent Supplier Activity</h2>
            <div className="mt-4 space-y-4">
              {activity.length === 0 && (
                <p className="text-sm text-muted">No recent activity.</p>
              )}
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-muted">
                    {a.supplier_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{a.message}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">
                      <RelativeTime iso={a.created_at} />
                    </p>
                  </div>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <SupplierModal
          // Form state seeds from props on mount, so a different target must
          // remount rather than reuse the previous record's values.
          key={editing === 'new' ? 'new' : editing.id}
          supplier={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteSupplierDialog supplier={deleting} onClose={() => setDeleting(null)} />
      )}
      {shipmentOpen && (
        <AddShipmentModal suppliers={suppliers} onClose={() => setShipmentOpen(false)} />
      )}
    </div>
  )
}
