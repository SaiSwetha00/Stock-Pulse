'use client'

import { useMemo, useState } from 'react'
import { canViewReports } from '@/lib/permissions'
import Link from 'next/link'
import { Plus, Search, Star, ArrowRight, Receipt, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import { formatCurrency, toLocalISODate } from '@/lib/format'
import type { Product, Role, Sale } from '@/types'
import { LocalDateTime } from '@/components/ui/LocalTime'
import LogSaleModal from './LogSaleModal'
import SalesTrendChart from '@/components/dashboard/SalesTrendChartLazy'

const PAYMENT_LABELS: Record<string, string> = { cash: 'Cash', card: 'CC', nfc: 'NFC' }

const PAYMENT_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Any method' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'nfc', label: 'NFC' },
]

type SortKey = 'created_at' | 'id' | 'total' | 'payment_method' | 'sold_by'

// Module scope: the map is a sort-memo dependency, so a literal inside the
// component would re-sort on every render.
const SORT_ACCESSORS: SortAccessors<Sale, SortKey> = {
  created_at: (s) => new Date(s.created_at).getTime(),
  id: (s) => s.id,
  total: (s) => Number(s.total),
  payment_method: (s) => s.payment_method,
  sold_by: (s) => s.profiles?.full_name ?? null,
}

const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = {
  created_at: 'desc',
  total: 'desc',
}

const CSV_COLUMNS: CsvColumn<Sale>[] = [
  // Matches the LocalDateTime cell: the viewer's local calendar, not the
  // server's, and absolute so the file still means something next month.
  { header: 'Date / Time', value: (s) => new Date(s.created_at).toLocaleString() },
  { header: 'Order ID', value: (s) => `#${s.id.slice(0, 6).toUpperCase()}` },
  // Raw number so the column totals in a spreadsheet.
  { header: 'Amount', value: (s) => Number(s.total) },
  { header: 'Method', value: (s) => PAYMENT_LABELS[s.payment_method] ?? s.payment_method },
  { header: 'Sold By', value: (s) => s.profiles?.full_name ?? '' },
]

/**
 * Everything a row can be matched on, lowercased. The old filter compared only
 * against "Aug 2", so a full date, a year, an order ID or a staff name all
 * returned nothing.
 */
function searchIndex(s: Sale): string {
  const d = new Date(s.created_at)
  return [
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    toLocalISODate(d),
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    s.id.slice(0, 6),
    s.profiles?.full_name ?? '',
    // Both the label and the stored value: the column holds 'card' but the
    // table renders 'CC', and either is a reasonable thing to type.
    PAYMENT_LABELS[s.payment_method] ?? '',
    s.payment_method,
  ]
    .join(' ')
    .toLowerCase()
}

export default function SalesClient({
  role,
  products,
  sales,
  trendData,
  categoryBreakdown,
  topSelling,
  weekTotal,
  avgOrder,
}: {
  role: Role
  products: Product[]
  sales: Sale[]
  trendData: { label: string; value: number }[]
  categoryBreakdown: { label: string; pct: number }[]
  topSelling: { name: string; units: number }[]
  weekTotal: number
  avgOrder: number
}) {
  const canSeeRevenue = canViewReports(role)
  const [modalOpen, setModalOpen] = useState(false)
  const [dateSearch, setDateSearch] = useState('')
  const [method, setMethod] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filteredSales = useMemo(() => {
    const q = dateSearch.trim().toLowerCase()
    // Local calendar days, inclusive at both ends. `to` is pushed to the end
    // of its day so a same-day from/to still matches that day's sales.
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null
    const toTs = to ? new Date(to + 'T23:59:59.999').getTime() : null

    return sales.filter((s) => {
      if (q && !searchIndex(s).includes(q)) return false
      if (method !== 'all' && s.payment_method !== method) return false
      if (fromTs !== null || toTs !== null) {
        const ts = new Date(s.created_at).getTime()
        if (fromTs !== null && ts < fromTs) return false
        if (toTs !== null && ts > toTs) return false
      }
      return true
    })
  }, [sales, dateSearch, method, from, to])

  const table = useTable<Sale, SortKey>({
    items: filteredSales,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'created_at', dir: 'desc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })
  const pageItems = table.rows

  const filtersActive = dateSearch !== '' || method !== 'all' || from !== '' || to !== ''

  function clearFilters() {
    setDateSearch('')
    setMethod('all')
    setFrom('')
    setTo('')
    table.setPage(1)
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Transactions</p>
          <h1 className="sp-title mt-2">Sales</h1>
          <p className="sp-body mt-2">
            {canSeeRevenue
              ? `This week: ${formatCurrency(weekTotal)} · Avg order ${formatCurrency(avgOrder)}`
              : 'Log new sales and browse recent transactions.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvButton
            columns={CSV_COLUMNS}
            rows={table.allRows}
            filenameBase="sales"
            itemLabel="transactions"
          />
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Log Sale
          </Button>
        </div>
      </div>

      {canSeeRevenue && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-surface p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="sp-heading">Weekly Performance</h2>
              <p className="text-sm text-muted">Revenue, last 7 days</p>
            </div>
            <SalesTrendChart data={trendData} />
          </div>

          <div className="rounded-2xl bg-foreground p-6 shadow-sm">
            <h2 className="sp-heading-invert">Popular Categories</h2>
            <div className="mt-5 space-y-4">
              {categoryBreakdown.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{c.label}</span>
                    <span className="font-semibold text-surface">{c.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface/10">
                    <div className="h-full rounded-full bg-success" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
              {categoryBreakdown.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No sales data yet"
                  description="Category breakdown appears once sales are logged."
                  className="py-8"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="sp-heading">
              {canSeeRevenue ? 'Recent Transactions' : 'Sales History'}
            </h2>
            <div className="relative w-48">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={dateSearch}
                onChange={(e) => {
                  setDateSearch(e.target.value)
                  table.setPage(1)
                }}
                type="search"
                placeholder="Search date, ID, or staff..."
                aria-label="Search transactions"
                className="control-h w-full rounded-lg border border-border bg-surface-muted pl-8 pr-10 text-xs focus:border-border-strong focus:bg-surface focus:outline-none"
              />
              {dateSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setDateSearch('')
                    table.setPage(1)
                  }}
                  aria-label="Clear search"
                  className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded-lg text-muted transition hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters: payment method and an inclusive date range. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="sales-method" className="sr-only">
              Filter by payment method
            </label>
            <select
              id="sales-method"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value)
                table.setPage(1)
              }}
              className="control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
            >
              {PAYMENT_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <label htmlFor="sales-from" className="text-sm text-muted">
              From
            </label>
            <input
              id="sales-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value)
                table.setPage(1)
              }}
              className="control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
            />
            <label htmlFor="sales-to" className="text-sm text-muted">
              To
            </label>
            <input
              id="sales-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value)
                table.setPage(1)
              }}
              className="control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
            />

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex control-h items-center rounded-lg px-3 text-sm font-semibold text-muted-strong underline-offset-4 transition hover:bg-surface-muted hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Rows become a card list below `lg`; this table already sits in a
              panel, so they are divided blocks rather than floating cards. */}
          <div className="mt-4 lg:overflow-x-auto">
            <table className="sp-table block w-full text-left text-sm lg:table">
              <thead className="hidden lg:table-header-group">
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                  <SortableTh label="Date / Time" sortKey="created_at" sort={table.sort} onSort={table.toggleSort} className="pr-4" />
                  <SortableTh label="Order ID" sortKey="id" sort={table.sort} onSort={table.toggleSort} className="pr-4" />
                  <SortableTh label="Amount" sortKey="total" sort={table.sort} onSort={table.toggleSort} className="pr-4" />
                  <SortableTh label="Method" sortKey="payment_method" sort={table.sort} onSort={table.toggleSort} className="pr-4" />
                  <SortableTh label="Sold By" sortKey="sold_by" sort={table.sort} onSort={table.toggleSort} />
                </tr>
              </thead>
              <tbody className="block lg:table-row-group">
                {filteredSales.length === 0 && (
                  <tr className="block lg:table-row">
                    <td colSpan={5} className="block lg:table-cell">
                      {sales.length === 0 ? (
                        <EmptyState
                          icon={Receipt}
                          title="No sales logged yet"
                          description="Log your first sale to start building transaction history and trends."
                          action={<Button onClick={() => setModalOpen(true)}>Log Sale</Button>}
                        />
                      ) : (
                        <EmptyState
                          icon={Search}
                          title="No transactions match your filters"
                          description="Try a different search term or date range."
                        />
                      )}
                    </td>
                  </tr>
                )}
                {pageItems.map((s) => (
                  <tr
                    key={s.id}
                    className="block border-b border-border py-3 last:border-0 lg:table-row lg:py-0"
                  >
                    {/* The order id leads the card — it is what identifies the
                        row once the columns are gone. */}
                    <td className="flex items-center justify-between gap-3 font-semibold text-foreground lg:table-cell lg:pr-4 lg:font-normal lg:text-muted-strong">
                      <span className="lg:hidden">#{s.id.slice(0, 6).toUpperCase()}</span>
                      <span className="text-xs font-normal text-muted lg:text-sm lg:text-inherit">
                        <LocalDateTime iso={s.created_at} />
                      </span>
                    </td>
                    <td className="hidden font-semibold text-foreground lg:table-cell lg:pr-4">
                      #{s.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="mt-2 flex items-center justify-between gap-3 font-semibold text-foreground lg:mt-0 lg:table-cell lg:pr-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                        Amount
                      </span>
                      {formatCurrency(Number(s.total))}
                    </td>
                    <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:pr-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                        Method
                      </span>
                      <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-strong">
                        {PAYMENT_LABELS[s.payment_method] ?? s.payment_method}
                      </span>
                    </td>
                    <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                        Sold By
                      </span>
                      {s.profiles?.full_name ?? '—'}
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
            itemLabel="transactions"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
          />
        </div>

        {canSeeRevenue && (
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <h2 className="sp-heading">Top Selling Items</h2>
            </div>
            <div className="mt-4 space-y-4">
              {topSelling.length === 0 && (
                <EmptyState
                  icon={Star}
                  title="No sales in the last 30 days"
                  description="Your best sellers will be ranked here."
                  className="py-8"
                />
              )}
              {topSelling.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-xs font-bold text-muted">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted">{item.units} units sold</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Link, not <a> — a bare anchor forces a full document reload and
                discards the client router's cache. */}
            <Link
              href="/inventory"
              className="mt-5 flex control-h items-center justify-center gap-1.5 rounded-lg bg-surface-muted text-sm font-semibold text-muted-strong hover:bg-surface-muted"
            >
              View Inventory
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {modalOpen && <LogSaleModal products={products} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
