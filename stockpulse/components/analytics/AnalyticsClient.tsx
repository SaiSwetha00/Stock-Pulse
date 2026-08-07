'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Category } from '@/types'
import {
  categoryMix,
  dayBounds,
  paymentMix,
  revenueByDay,
  summarize,
  topProducts,
  withinRange,
  type ReportItem,
  type ReportSale,
} from '@/lib/reports'
import SalesTrendChart from '@/components/dashboard/SalesTrendChartLazy'
import EmptyState from '@/components/ui/EmptyState'

const PERIODS = [7, 30, 90]

/**
 * Pure date maths on a YYYY-MM-DD string. Everything on this page derives from
 * the `todayIso` prop rather than `new Date()`, so the server and client render
 * identical markup and the period buttons stay deterministic.
 */
function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function pctChange(current: number, previous: number): number | null {
  // A change from zero is not a percentage — showing "+100%" off no baseline
  // is worse than showing nothing.
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

function KpiCard({
  label,
  value,
  change,
  tone,
}: {
  label: string
  value: string
  change: number | null
  tone?: 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <div className={`rounded-2xl p-4 shadow-sm lg:p-6 ${dark ? 'bg-foreground' : 'bg-surface'}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          dark ? 'text-muted' : 'text-muted'
        }`}
      >
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold lg:text-3xl ${dark ? 'text-surface' : 'text-foreground'}`}>
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {change === null ? (
          <span className={`text-xs ${dark ? 'text-muted' : 'text-muted'}`}>
            No prior data
          </span>
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
            <span className={`text-xs ${dark ? 'text-muted' : 'text-muted'}`}>
              vs previous period
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function BarList({
  rows,
  barClass,
}: {
  rows: { label: string; detail: string; pct: number }[]
  barClass: string
}) {
  return (
    <div className="mt-4 space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-muted-strong">{r.label}</span>
            <span className="shrink-0 font-semibold text-foreground">{r.detail}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsClient({
  sales,
  items,
  productCategories,
  todayIso,
}: {
  sales: ReportSale[]
  items: ReportItem[]
  productCategories: [string, Category][]
  todayIso: string
}) {
  const [days, setDays] = useState(30)

  const categoryOf = useMemo(() => new Map(productCategories), [productCategories])

  const range = useMemo(() => {
    const to = todayIso
    const from = shiftIso(to, -(days - 1))
    const prevTo = shiftIso(from, -1)
    const prevFrom = shiftIso(prevTo, -(days - 1))
    return { from, to, prevFrom, prevTo }
  }, [todayIso, days])

  const current = useMemo(() => {
    const { fromTs, toTs } = dayBounds(range.from, range.to)
    return {
      sales: sales.filter((s) => withinRange(s.created_at, fromTs, toTs)),
      items: items.filter((i) => withinRange(i.created_at, fromTs, toTs)),
    }
  }, [sales, items, range])

  const previous = useMemo(() => {
    const { fromTs, toTs } = dayBounds(range.prevFrom, range.prevTo)
    return {
      sales: sales.filter((s) => withinRange(s.created_at, fromTs, toTs)),
      items: items.filter((i) => withinRange(i.created_at, fromTs, toTs)),
    }
  }, [sales, items, range])

  const kpis = useMemo(() => summarize(current.sales, current.items), [current])
  const prevKpis = useMemo(() => summarize(previous.sales, previous.items), [previous])

  const trend = useMemo(
    () => revenueByDay(current.sales, range.from, range.to),
    [current.sales, range]
  )
  const categories = useMemo(
    () => categoryMix(current.items, categoryOf),
    [current.items, categoryOf]
  )
  const products = useMemo(() => topProducts(current.items, 6), [current.items])
  const payments = useMemo(() => paymentMix(current.sales), [current.sales])

  const topProductUnits = products[0]?.units ?? 0
  const isEmpty = current.sales.length === 0 && current.items.length === 0

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            {range.from} to {range.to}, compared with the {days} days before it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`flex control-h items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition ${
                days === d
                  ? 'bg-foreground text-surface'
                  : 'border border-border bg-surface text-muted-strong hover:bg-surface-muted'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatCurrency(kpis.revenue)}
          change={pctChange(kpis.revenue, prevKpis.revenue)}
        />
        <KpiCard
          label="Transactions"
          value={String(kpis.transactions)}
          change={pctChange(kpis.transactions, prevKpis.transactions)}
          tone="dark"
        />
        <KpiCard
          label="Avg Order"
          value={formatCurrency(kpis.avgOrder)}
          change={pctChange(kpis.avgOrder, prevKpis.avgOrder)}
        />
        <KpiCard
          label="Units Sold"
          value={String(kpis.unitsSold)}
          change={pctChange(kpis.unitsSold, prevKpis.unitsSold)}
        />
      </div>

      {isEmpty ? (
        <div className="mt-6 rounded-2xl bg-surface shadow-sm">
          <EmptyState
            icon={BarChart3}
            title="No sales in this period"
            description="Pick a longer period, or log a sale to start building the picture."
          />
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-foreground">Revenue trend</h2>
            <div className="mt-4">
              <SalesTrendChart data={trend.map((d) => ({ label: d.label, value: d.value }))} />
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <section className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-foreground">Category mix</h2>
              <BarList
                barClass="bg-accent"
                rows={categories.map((c) => ({
                  label: c.label,
                  detail: `${c.pct.toFixed(1)}%`,
                  pct: c.pct,
                }))}
              />
            </section>

            <section className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-foreground">Top products</h2>
              <BarList
                barClass="bg-foreground"
                rows={products.map((p) => ({
                  label: p.name,
                  detail: `${p.units} units`,
                  // Relative to the best seller, so the leader fills the bar.
                  pct: topProductUnits ? (p.units / topProductUnits) * 100 : 0,
                }))}
              />
            </section>

            <section className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-foreground">Payment methods</h2>
              <BarList
                barClass="bg-info"
                rows={payments.map((p) => ({
                  label: `${p.label} (${p.count})`,
                  detail: `${p.pct.toFixed(1)}%`,
                  pct: p.pct,
                }))}
              />
            </section>
          </div>
        </>
      )}
    </div>
  )
}
