'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import { ArrowDownRight, ArrowUpRight, BarChart3, FileDown } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Category } from '@/types'
import {
  categoryMix,
  dayBounds,
  paymentMix,
  presetRange,
  revenueByDay,
  summarize,
  topProducts,
  withinRange,
  type ReportItem,
  type ReportSale,
} from '@/lib/reports'
import { exportReportPdf } from '@/lib/pdf'
import { csvFilename } from '@/lib/csv'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

/**
 * Percentage change, or null when the comparison would be meaningless.
 *
 * A change from zero is not a percentage: "+100%" off no baseline reads as a
 * real result and is not one. Showing nothing is the honest answer.
 */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * A headline figure and how it moved against the period before it.
 *
 * The comparison arrived here when Analytics was folded in — it was the only
 * thing that page did which this one did not, and it was sitting behind its own
 * sidebar entry showing the same four KPIs over the same four panels.
 *
 * `change === null` covers two different situations and says so plainly rather
 * than printing a misleading number: no takings in the prior period, or a prior
 * period that falls outside the window the server fetched.
 */
function Kpi({
  label,
  value,
  change,
  comparable,
  tone,
}: {
  label: string
  value: string
  change: number | null
  /** False when the previous period predates the fetched window. */
  comparable: boolean
  tone?: 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <div
      className={`sp-rise rounded-2xl border border-border p-4 shadow-sm lg:p-6 ${
        dark ? 'bg-foreground' : 'bg-surface'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold lg:text-3xl ${dark ? 'text-surface' : 'text-foreground'}`}>
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {!comparable ? (
          <span className="text-xs text-muted">Outside compared window</span>
        ) : change === null ? (
          <span className="text-xs text-muted">No prior data</span>
        ) : (
          <>
            {change >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
            )}
            <span className={`text-xs font-semibold ${change >= 0 ? 'text-accent' : 'text-danger'}`}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-xs text-muted">vs previous period</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function ReportsClient({
  sales,
  items,
  productCategories,
  storeName,
  defaultFrom,
  defaultTo,
  windowStartIso,
}: {
  sales: ReportSale[]
  items: ReportItem[]
  /** Product name -> category, for the category mix. Sent as tuples because a
   *  Map does not survive the server/client boundary. */
  productCategories: [string, Category][]
  storeName: string
  // Seeded on the server so the first paint has a range without a hydration
  // mismatch. Preset clicks recompute against the viewer's own clock.
  defaultFrom: string
  defaultTo: string
  /**
   * The earliest day the server actually fetched.
   *
   * Needed because the comparison can silently lie without it: pick a range at
   * the far edge of the window and the "previous period" is half-empty, which
   * summarises as a real-looking collapse in revenue rather than as missing
   * data. The KPI cards say "outside compared window" instead.
   */
  windowStartIso: string
}) {
  const toast = useToast()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [pdfBusy, setPdfBusy] = useState(false)

  const categoryOf = useMemo(() => new Map(productCategories), [productCategories])

  const { rangeSales, rangeItems } = useMemo(() => {
    const { fromTs, toTs } = dayBounds(from, to)
    return {
      rangeSales: sales.filter((s) => withinRange(s.created_at, fromTs, toTs)),
      rangeItems: items.filter((i) => withinRange(i.created_at, fromTs, toTs)),
    }
  }, [sales, items, from, to])

  /**
   * The equally-long period ending the day before `from`.
   *
   * Derived from whatever range is on screen rather than from a fixed 7/30/90
   * choice, which is what the retired Analytics page offered — so a custom
   * range now gets a comparison too, which it could not before.
   */
  const previous = useMemo(() => {
    if (!from || !to) return null
    const fromMs = new Date(`${from}T00:00:00`).getTime()
    const toMs = new Date(`${to}T00:00:00`).getTime()
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) return null

    const DAY = 86_400_000
    const lengthDays = Math.round((toMs - fromMs) / DAY) + 1
    const prevTo = new Date(fromMs - DAY)
    const prevFrom = new Date(fromMs - lengthDays * DAY)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { from: iso(prevFrom), to: iso(prevTo) }
  }, [from, to])

  // A comparison is only honest while the whole previous period sits inside
  // what the server fetched. String compare is safe on YYYY-MM-DD.
  const comparable = previous !== null && previous.from >= windowStartIso

  const prevKpis = useMemo(() => {
    if (!previous) return null
    const { fromTs, toTs } = dayBounds(previous.from, previous.to)
    return summarize(
      sales.filter((s) => withinRange(s.created_at, fromTs, toTs)),
      items.filter((i) => withinRange(i.created_at, fromTs, toTs)),
    )
  }, [sales, items, previous])

  const kpis = useMemo(() => summarize(rangeSales, rangeItems), [rangeSales, rangeItems])
  const daily = useMemo(() => revenueByDay(rangeSales, from, to), [rangeSales, from, to])
  const products = useMemo(() => topProducts(rangeItems), [rangeItems])
  const categories = useMemo(() => categoryMix(rangeItems, categoryOf), [rangeItems, categoryOf])
  const payments = useMemo(() => paymentMix(rangeSales), [rangeSales])

  const rangeLabel = from && to ? `${from} to ${to}` : 'All time'
  const isEmpty = rangeSales.length === 0 && rangeItems.length === 0

  function applyPreset(days: number) {
    const r = presetRange(days)
    setFrom(r.from)
    setTo(r.to)
  }

  async function handlePdf() {
    if (isEmpty) {
      toast.info('Nothing to export', 'No sales fall in the selected date range.')
      return
    }
    setPdfBusy(true)
    try {
      await exportReportPdf({
        title: `${storeName} — Sales Report`,
        subtitle: `${rangeLabel} · generated ${new Date().toLocaleString()}`,
        filename: csvFilename('stockpulse-report').replace(/\.csv$/, '.pdf'),
        kpis: [
          { label: 'Revenue', value: formatCurrency(kpis.revenue) },
          { label: 'Transactions', value: String(kpis.transactions) },
          { label: 'Avg Order', value: formatCurrency(kpis.avgOrder) },
          { label: 'Units Sold', value: String(kpis.unitsSold) },
        ],
        tables: [
          {
            title: 'Revenue by day',
            head: ['Date', 'Revenue'],
            rows: daily.map((d) => [d.iso, formatCurrency(d.value)]),
            numericColumns: [1],
          },
          {
            title: 'Top products',
            head: ['Product', 'Units', 'Revenue'],
            rows: products.map((p) => [p.name, p.units, formatCurrency(p.revenue)]),
            numericColumns: [1, 2],
          },
          {
            title: 'Category mix',
            head: ['Category', 'Revenue', 'Share'],
            rows: categories.map((c) => [
              c.label,
              formatCurrency(c.revenue),
              `${c.pct.toFixed(1)}%`,
            ]),
            numericColumns: [1, 2],
          },
          {
            title: 'Payment methods',
            head: ['Method', 'Transactions', 'Revenue', 'Share'],
            rows: payments.map((p) => [
              p.label,
              p.count,
              formatCurrency(p.revenue),
              `${p.pct.toFixed(1)}%`,
            ]),
            numericColumns: [1, 2, 3],
          },
        ],
      })
      toast.success('Report exported', 'PDF saved to your downloads.')
    } catch {
      // A failed export must not look like a successful one.
      toast.error('Export failed', 'The PDF could not be generated. Please try again.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Reporting</p>
          <h1 className="sp-title mt-2">Reports</h1>
          <p className="sp-body mt-2">
            {comparable && previous
              ? `${rangeLabel}, compared with ${previous.from} to ${previous.to}.`
              : 'Sales performance for a date range you choose.'}
          </p>
        </div>
        {/* The label no longer swaps to "Preparing…" — the spinner says that,
            and a label that changes width mid-click shifts the row beside
            it. */}
        <Button onClick={handlePdf} loading={pdfBusy}>
          {!pdfBusy && <FileDown className="h-4 w-4" aria-hidden="true" />}
          Export PDF
        </Button>
      </div>

      {/* ---- Date range ---- */}
      <div className="mt-6 flex flex-wrap items-center gap-2 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <label htmlFor="report-from" className="text-sm font-medium text-muted-strong">
          From
        </label>
        <input
          id="report-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          className="control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
        />
        <label htmlFor="report-to" className="text-sm font-medium text-muted-strong">
          To
        </label>
        <input
          id="report-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          className="control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-2 sm:ml-2">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => applyPreset(p.days)}
              className="flex control-h items-center whitespace-nowrap rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted-strong transition hover:bg-surface-muted"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- KPIs ---- */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          label="Revenue"
          value={formatCurrency(kpis.revenue)}
          change={prevKpis ? pctChange(kpis.revenue, prevKpis.revenue) : null}
          comparable={comparable}
        />
        <Kpi
          label="Transactions"
          value={String(kpis.transactions)}
          change={prevKpis ? pctChange(kpis.transactions, prevKpis.transactions) : null}
          comparable={comparable}
          tone="dark"
        />
        <Kpi
          label="Avg Order"
          value={formatCurrency(kpis.avgOrder)}
          change={prevKpis ? pctChange(kpis.avgOrder, prevKpis.avgOrder) : null}
          comparable={comparable}
        />
        <Kpi
          label="Units Sold"
          value={String(kpis.unitsSold)}
          change={prevKpis ? pctChange(kpis.unitsSold, prevKpis.unitsSold) : null}
          comparable={comparable}
        />
      </div>

      {isEmpty ? (
        <div className="mt-6 sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={BarChart3}
            title="No sales in this range"
            description="Widen the date range, or log a sale to see it reported here."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Revenue by day */}
          <section className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="sp-heading">Revenue by day</h2>
              <ExportCsvButton
                columns={[
                  { header: 'Date', value: (d: (typeof daily)[number]) => d.iso },
                  { header: 'Revenue', value: (d: (typeof daily)[number]) => d.value },
                ]}
                rows={daily}
                filenameBase="revenue-by-day"
                itemLabel="days"
              />
            </div>
            {/* overflow-x as well as -y. This table does not reflow into
                cards the way the module tables do, so at 390px its only
                escape from a long date column is sideways — without this the
                page itself scrolls horizontally instead. */}
            <div className="mt-4 max-h-80 overflow-auto">
              <table className="sp-table w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="pb-3 pr-4">
                      Date
                    </th>
                    <th scope="col" className="pb-3 text-right">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((d) => (
                    <tr key={d.iso} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 text-muted-strong">{d.label}</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">
                        {formatCurrency(d.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top products */}
          <section className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="sp-heading">Top products</h2>
              <ExportCsvButton
                columns={[
                  { header: 'Product', value: (p: (typeof products)[number]) => p.name },
                  { header: 'Units', value: (p: (typeof products)[number]) => p.units },
                  { header: 'Revenue', value: (p: (typeof products)[number]) => p.revenue },
                ]}
                rows={products}
                filenameBase="top-products"
                itemLabel="products"
              />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="sp-table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="pb-3 pr-4">
                      Product
                    </th>
                    <th scope="col" className="pb-3 pr-4 text-right">
                      Units
                    </th>
                    <th scope="col" className="pb-3 text-right">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.name} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 text-muted-strong">{p.name}</td>
                      <td className="py-2.5 pr-4 text-right text-muted-strong">{p.units}</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Category mix */}
          <section className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="sp-heading">Category mix</h2>
              <ExportCsvButton
                columns={[
                  { header: 'Category', value: (c: (typeof categories)[number]) => c.label },
                  { header: 'Revenue', value: (c: (typeof categories)[number]) => c.revenue },
                  {
                    header: 'Share %',
                    value: (c: (typeof categories)[number]) => Number(c.pct.toFixed(1)),
                  },
                ]}
                rows={categories}
                filenameBase="category-mix"
                itemLabel="categories"
              />
            </div>
            <div className="mt-4 space-y-3">
              {categories.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-strong">{c.label}</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(c.revenue)} · {c.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment methods */}
          <section className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="sp-heading">Payment methods</h2>
              <ExportCsvButton
                columns={[
                  { header: 'Method', value: (p: (typeof payments)[number]) => p.label },
                  { header: 'Transactions', value: (p: (typeof payments)[number]) => p.count },
                  { header: 'Revenue', value: (p: (typeof payments)[number]) => p.revenue },
                  {
                    header: 'Share %',
                    value: (p: (typeof payments)[number]) => Number(p.pct.toFixed(1)),
                  },
                ]}
                rows={payments}
                filenameBase="payment-methods"
                itemLabel="methods"
              />
            </div>
            <div className="mt-4 space-y-3">
              {payments.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-strong">
                      {p.label} <span className="text-muted">({p.count})</span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(p.revenue)} · {p.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
