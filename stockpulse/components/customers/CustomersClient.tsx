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
import { LineArtPeople } from '@/components/ui/LineArt'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import CustomerModal from './CustomerModal'
import DeleteCustomerDialog from './DeleteCustomerDialog'
import { type Customer, type LoyaltyTier } from '@/types'
import { useAppCopy } from '@/lib/i18n/client'
import type { CustomersCopy } from '@/lib/i18n/app'

// Functions rather than constants: a module-scope literal cannot read a
// hook. Both stay module-private and are memoised at the call site, so the
// sort and filter memos keep their stable dependencies.
function tierFilters(t: CustomersCopy): { value: LoyaltyTier | 'all'; label: string }[] {
  return [
    { value: 'all', label: t.allTiers },
    { value: 'platinum', label: t.tierLabels.platinum },
    { value: 'gold', label: t.tierLabels.gold },
    { value: 'silver', label: t.tierLabels.silver },
    { value: 'bronze', label: t.tierLabels.bronze },
  ]
}

const TIER_STYLES: Record<LoyaltyTier, string> = {
  platinum: 'bg-foreground text-surface',
  gold: 'bg-warning-bg text-warning',
  silver: 'bg-surface-muted text-muted-strong',
  bronze: 'bg-warning-bg text-warning',
}

type Activity = 'active' | 'dormant'

function activityFilters(t: CustomersCopy): { value: Activity | 'all'; label: string }[] {
  return [
    { value: 'all', label: t.activityAny },
    { value: 'active', label: t.activityRecent },
    { value: 'dormant', label: t.activityDormant },
  ]
}

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

// Nothing parses a customers export, so its headers say what the table above
// them says. The inventory export is the opposite case - see lib/importCsv.
function csvColumns(t: CustomersCopy): CsvColumn<Customer>[] {
  return [
  { header: t.csvName, value: (c) => c.full_name },
  { header: t.csvEmail, value: (c) => c.email },
  { header: t.csvPhone, value: (c) => c.phone },
  { header: t.colTier, value: (c) => t.tierLabels[c.loyalty_tier] },
  { header: t.colVisits, value: (c) => c.visits },
  // Raw number so the column totals in a spreadsheet.
  { header: t.colTotalSpent, value: (c) => Number(c.total_spent) },
  {
    header: t.colLastVisit,
    // The table shows this as "3d ago". A relative stamp is worthless in a
    // saved file — it decays the moment the export is written — so the
    // absolute local date goes into the CSV instead.
    value: (c) => (c.last_visit_at ? new Date(c.last_visit_at).toLocaleString() : ''),
  },
  ]
}

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
  const t = useAppCopy()
  const tc = t.customers
  const tcm = t.common
  const tierOptions = useMemo(() => tierFilters(tc), [tc])
  const activityOptions = useMemo(() => activityFilters(tc), [tc])
  const csvCols = useMemo(() => csvColumns(tc), [tc])
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
        tc.tierLabels[c.loyalty_tier].toLowerCase().includes(q)
      const matchesTier = tier === 'all' || c.loyalty_tier === tier
      const matchesActivity = activity === 'all' || activityOf(c, now) === activity
      return matchesSearch && matchesTier && matchesActivity
    })
  }, [initialCustomers, search, tier, activity, now, tc])

  const table = useTable<Customer, SortKey>({
    items: filtered,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'full_name', dir: 'asc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })
  const pageItems = table.rows

  // The other three lists offer a way out of a filtered dead end; this one
  // left you staring at "no matches" with three filters to undo by hand.
  function clearFilters() {
    setSearch('')
    setTier('all')
    setActivity('all')
    table.setPage(1)
  }

  const totalRevenue = initialCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0)
  const repeatCustomers = initialCustomers.filter((c) => c.visits > 1).length

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">{tc.eyebrow}</p>
          <h1 className="sp-title mt-2">{tc.title}</h1>
          <p className="sp-body mt-2">{tc.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={csvCols}
            rows={table.allRows}
            filenameBase="customers"
            itemLabel={tc.itemLabel}
          />
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {tc.addCustomer}
          </Button>
        </div>
      </div>

      <div className="sp-rise sp-e1 mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              table.setPage(1)
            }}
            type="search"
            aria-label={tc.searchAria}
            placeholder={tc.searchPlaceholder}
            className="control-h w-full rounded-lg border border-border bg-surface-muted pl-10 pr-12 text-sm placeholder:text-muted transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                table.setPage(1)
              }}
              aria-label={tcm.clearSearch}
              className="tap-target absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-muted transition hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="customer-activity" className="sr-only">
            {tc.filterByActivity}
          </label>
          <select
            id="customer-activity"
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value as Activity | 'all')
              table.setPage(1)
            }}
            className="control-h rounded-lg border border-border bg-surface-muted px-3 text-sm text-muted-strong transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          >
            {activityOptions.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {tierOptions.map((f) => (
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
        <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {tc.statTotal}
            </p>
            <Users className="h-5 w-5 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{initialCustomers.length}</p>
        </div>
        <div className="sp-rise sp-e1 sp-delay-2 sp-delay-1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {tc.statRevenue}
            </p>
            <Wallet className="h-5 w-5 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-foreground p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {tc.statRepeat}
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
                <SortableTh label={tc.colCustomer} sortKey="full_name" sort={table.sort} onSort={table.toggleSort} className="px-6" />
                <SortableTh label={tc.colContact} sortKey="email" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={tc.colTier} sortKey="loyalty_tier" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={tc.colVisits} sortKey="visits" sort={table.sort} onSort={table.toggleSort} align="right" className="px-4" />
                <SortableTh label={tc.colTotalSpent} sortKey="total_spent" sort={table.sort} onSort={table.toggleSort} align="right" className="px-4" />
                <SortableTh label={tc.colLastVisit} sortKey="last_visit_at" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <th scope="col" className="px-4 py-3.5 text-right">
                  {tc.colActions}
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
              {pageItems.length === 0 && (
                <tr className="block lg:table-row">
                  <td
                    colSpan={7}
                    className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm lg:table-cell lg:rounded-none lg:shadow-none"
                  >
                    {initialCustomers.length === 0 ? (
                      <EmptyState
                        illustration={<LineArtPeople className="h-full w-full" />}
                        title={tc.emptyTitle}
                        description={tc.emptyBody}
                        action={
                          <Button onClick={() => setEditing('new')}>
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {tc.addCustomer}
                          </Button>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={Search}
                        title={tc.noMatchTitle}
                        description={tc.noMatchBody}
                        action={
                          <Button variant="secondary" onClick={clearFilters}>
                            {tcm.clearFilters}
                          </Button>
                        }
                      />
                    )}
                  </td>
                </tr>
              )}
              {pageItems.map((c) => (
                <tr
                  key={c.id}
                  className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:table-row lg:rounded-none lg:border-b lg:border-border lg:p-0 lg:shadow-none lg:last:border-0"
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
                      {tc.colContact}
                    </span>
                    <span className="text-right lg:text-left">
                      <span className="block text-muted-strong">{c.email || '—'}</span>
                      {c.phone && <span className="block text-xs text-muted">{c.phone}</span>}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      {tc.colTier}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[c.loyalty_tier]}`}
                    >
                      {tc.tierLabels[c.loyalty_tier]}
                    </span>
                  </td>
                  <td className="sp-num mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      {tc.colVisits}
                    </span>
                    {c.visits}
                  </td>
                  <td className="sp-num mt-2 flex items-center justify-between gap-3 font-semibold text-foreground lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      {tc.colTotalSpent}
                    </span>
                    {formatCurrency(Number(c.total_spent))}
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 text-muted lg:mt-0 lg:table-cell lg:px-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      {tc.colLastVisit}
                    </span>
                    {c.last_visit_at ? <RelativeTime iso={c.last_visit_at} /> : '—'}
                  </td>
                  <td className="sp-row-actions mt-2 block border-t border-border pt-2 lg:mt-0 lg:table-cell lg:border-0 lg:px-4 lg:pt-0">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label={tc.editRow.replace('{name}', c.full_name)}
                        className="tap-target rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
                        aria-label={tc.deleteRow.replace('{name}', c.full_name)}
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
          itemLabel={tc.itemLabel}
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
