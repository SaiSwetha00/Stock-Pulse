'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  Users,
  Wallet,
  Repeat,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { RelativeTime } from '@/components/ui/LocalTime'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import CustomerModal from './CustomerModal'
import DeleteCustomerDialog from './DeleteCustomerDialog'
import { LOYALTY_TIER_LABELS, type Customer, type LoyaltyTier } from '@/types'

const TIER_FILTERS: { value: LoyaltyTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
]

const TIER_STYLES: Record<LoyaltyTier, string> = {
  platinum: 'bg-foreground text-surface',
  gold: 'bg-warning-bg text-warning',
  silver: 'bg-surface-muted text-muted-strong',
  bronze: 'bg-warning-bg text-warning',
}

type Activity = 'active' | 'dormant'

const ACTIVITY_FILTERS: { value: Activity | 'all'; label: string }[] = [
  { value: 'all', label: 'Any activity' },
  { value: 'active', label: 'Visited in 30 days' },
  { value: 'dormant', label: 'Dormant 30+ days' },
]

const DORMANT_AFTER_DAYS = 30

function activityOf(c: Customer, now: number): Activity {
  if (!c.last_visit_at) return 'dormant'
  const days = (now - new Date(c.last_visit_at).getTime()) / 86_400_000
  return days <= DORMANT_AFTER_DAYS ? 'active' : 'dormant'
}

type SortKey = 'full_name' | 'email' | 'loyalty_tier' | 'visits' | 'total_spent' | 'last_visit_at'

// Module scope: the map is a sort-memo dependency, so a literal in the
// component would re-sort every render.
const SORT_ACCESSORS: SortAccessors<Customer, SortKey> = {
  full_name: (c) => c.full_name,
  email: (c) => c.email,
  // Rank order, not alphabetical — bronze before platinum is meaningless.
  loyalty_tier: (c) => ({ bronze: 0, silver: 1, gold: 2, platinum: 3 })[c.loyalty_tier],
  visits: (c) => c.visits,
  total_spent: (c) => Number(c.total_spent),
  last_visit_at: (c) => (c.last_visit_at ? new Date(c.last_visit_at).getTime() : null),
}

const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = {
  visits: 'desc',
  total_spent: 'desc',
  last_visit_at: 'desc',
  loyalty_tier: 'desc',
}

const CSV_COLUMNS: CsvColumn<Customer>[] = [
  { header: 'Name', value: (c) => c.full_name },
  { header: 'Email', value: (c) => c.email },
  { header: 'Phone', value: (c) => c.phone },
  { header: 'Tier', value: (c) => LOYALTY_TIER_LABELS[c.loyalty_tier] },
  { header: 'Visits', value: (c) => c.visits },
  // Raw number so the column totals in a spreadsheet.
  { header: 'Total Spent', value: (c) => Number(c.total_spent) },
  {
    header: 'Last Visit',
    // The table shows this as "3d ago". A relative stamp is worthless in a
    // saved file — it decays the moment the export is written — so the
    // absolute local date goes into the CSV instead.
    value: (c) => (c.last_visit_at ? new Date(c.last_visit_at).toLocaleString() : ''),
  },
]

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function CustomersClient({
  initialCustomers,
}: {
  // storeId removed: mutations go through Server Actions that read the store
  // from the session, so the browser never names the target store.
  initialCustomers: Customer[]
}) {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<LoyaltyTier | 'all'>('all')
  const [activity, setActivity] = useState<Activity | 'all'>('all')

  // `'new'` opens a blank form; a Customer opens it prefilled for editing.
  const [editing, setEditing] = useState<Customer | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)

  // Pinned once per mount: recomputing Date.now() during render would make
  // the "dormant" cut-off drift between renders.
  const [now] = useState(() => Date.now())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialCustomers.filter((c) => {
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        // Visible in the row, so it should be findable.
        LOYALTY_TIER_LABELS[c.loyalty_tier].toLowerCase().includes(q)
      const matchesTier = tier === 'all' || c.loyalty_tier === tier
      const matchesActivity = activity === 'all' || activityOf(c, now) === activity
      return matchesSearch && matchesTier && matchesActivity
    })
  }, [initialCustomers, search, tier, activity, now])

  const table = useTable<Customer, SortKey>({
    items: filtered,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'full_name', dir: 'asc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })
  const pageItems = table.rows

  const totalRevenue = initialCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0)
  const repeatCustomers = initialCustomers.filter((c) => c.visits > 1).length

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Relationships</p>
          <h1 className="sp-title mt-2">Customers</h1>
          <p className="sp-body mt-2">
            Customer profiles, purchase history, and loyalty tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={CSV_COLUMNS}
            rows={table.allRows}
            filenameBase="customers"
            itemLabel="customers"
          />
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              table.setPage(1)
            }}
            type="search"
            aria-label="Search customers"
            placeholder="Search by name, email, phone, or tier..."
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
          <label htmlFor="customer-activity" className="sr-only">
            Filter by activity
          </label>
          <select
            id="customer-activity"
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value as Activity | 'all')
              table.setPage(1)
            }}
            className="control-h rounded-xl border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
          >
            {ACTIVITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIER_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setTier(f.value)
                table.setPage(1)
              }}
              className={`flex control-h items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
                tier === f.value
                  ? 'bg-foreground text-surface'
                  : 'bg-surface text-muted-strong hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sp-rise rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total Customers
            </p>
            <Users className="h-5 w-5 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{initialCustomers.length}</p>
        </div>
        <div className="sp-rise rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Lifetime Revenue
            </p>
            <Wallet className="h-5 w-5 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-foreground p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Repeat Customers
            </p>
            <Repeat className="h-5 w-5 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-surface">{repeatCustomers}</p>
        </div>
      </div>

      {/* Rows become cards below `lg`; above it the same markup is a table,
          so the two shapes cannot drift apart. */}
      <div className="mt-6 lg:overflow-hidden lg:rounded-2xl lg:bg-surface lg:shadow-sm">
        <div className="lg:overflow-x-auto">
          <table className="sp-table block w-full text-left text-sm lg:table">
            <thead className="hidden lg:table-header-group">
              <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-muted">
                <SortableTh label="Customer" sortKey="full_name" sort={table.sort} onSort={table.toggleSort} className="px-6" />
                <SortableTh label="Contact" sortKey="email" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Tier" sortKey="loyalty_tier" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Visits" sortKey="visits" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Total Spent" sortKey="total_spent" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Last Visit" sortKey="last_visit_at" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <th scope="col" className="px-4 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
              {pageItems.length === 0 && (
                <tr className="block lg:table-row">
                  <td
                    colSpan={7}
                    className="block sp-rise rounded-2xl border border-border bg-surface shadow-sm lg:table-cell lg:rounded-none lg:shadow-none"
                  >
                    {initialCustomers.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="No customers yet"
                        description="Add a customer to start tracking purchase history and loyalty tiers."
                        action={
                          <Button onClick={() => setEditing('new')}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add Customer
                          </Button>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={Search}
                        title="No customers match these filters"
                        description="Try a different search term or tier."
                      />
                    )}
                  </td>
                </tr>
              )}
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  className="block sp-rise rounded-2xl border border-border bg-surface p-4 shadow-sm lg:table-row lg:rounded-none lg:border-b lg:border-border lg:p-0 lg:shadow-none lg:last:border-0"
                >
                  <td className="block lg:table-cell lg:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-muted">
                        {initials(c.full_name)}
                      </div>
                      <p className="font-semibold text-foreground">{c.full_name}</p>
                    </div>
                  </td>
                  {/* Below `lg` each cell becomes a labelled row inside the
                      card — the column header is gone, so the value needs to
                      say what it is. */}
                  <td className="mt-3 flex items-baseline justify-between gap-3 lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Contact
                    </span>
                    <span className="text-right lg:text-left">
                      <span className="block text-muted-strong">{c.email || '—'}</span>
                      {c.phone && <span className="block text-xs text-muted">{c.phone}</span>}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Tier
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[c.loyalty_tier]}`}
                    >
                      {LOYALTY_TIER_LABELS[c.loyalty_tier]}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Visits
                    </span>
                    {c.visits}
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 font-semibold text-foreground lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Total Spent
                    </span>
                    {formatCurrency(Number(c.total_spent))}
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 text-muted lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Last Visit
                    </span>
                    {c.last_visit_at ? <RelativeTime iso={c.last_visit_at} /> : '—'}
                  </td>
                  <td className="sp-row-actions mt-2 block border-t border-border pt-2 lg:mt-0 lg:table-cell lg:border-0 lg:px-4 lg:pt-0">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${c.full_name}`}
                        className="tap-target rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        aria-label={`Delete ${c.full_name}`}
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

        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          pageSize={table.pageSize}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          total={table.total}
          itemLabel="customers"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"
        />
      </div>

      {editing && (
        <CustomerModal
          // Form state is seeded from props on mount, so a different target
          // must remount rather than reuse the previous record's values.
          key={editing === 'new' ? 'new' : editing.id}
          customer={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteCustomerDialog customer={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}
