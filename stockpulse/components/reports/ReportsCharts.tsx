'use client'

import { useReducedMotion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency, formatCurrencyWhole } from '@/lib/format'

/**
 * The three charts /reports should always have had.
 *
 * recharts was already a dependency and already drawing the dashboard's sales
 * trend; /reports had 30 days of data and rendered none of it, so the page
 * asked its reader to compare numbers down a column. Nothing here computes
 * anything — `daily`, `categories` and `products` are the same memoised series
 * the tables below already render, so a chart and the table under it can never
 * disagree.
 *
 * COLOUR. Straight from the theme tokens, never hex. `--chart-1..3` are the
 * gold family, `--info` is this palette's coffee-brown (there is no blue in
 * this product) and `--danger` is the deep red. Using the variables rather
 * than literals is what makes these correct in dark mode for free — the
 * dashboard's SalesTrendChart hard-codes zinc hex values and is the one chart
 * that does not respond to the theme, which is worth fixing separately.
 *
 * LAYOUT STABILITY. Every chart sits in a wrapper with an explicit pixel
 * height, and ResponsiveContainer fills it. This is the whole CLS story:
 * ResponsiveContainer renders nothing until it has measured its parent, so a
 * parent sized by its content is zero-height on first paint and jumps to full
 * height a frame later — which is exactly the classic chart CLS regression.
 * A fixed height means the space is reserved before recharts knows anything.
 */

const AXIS_TICK = { fill: 'var(--muted)', fontSize: 11 }

/** Hairline, per the design language: no heavy gridlines, no axis lines. */
const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: AXIS_TICK,
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  fontSize: 12,
}

/** Category series. Gold leads; coffee and deep red carry the rest. */
const CATEGORY_COLOURS = [
  'var(--chart-1)',
  'var(--info)',
  'var(--danger)',
  'var(--chart-2)',
  'var(--chart-3)',
]

export default function ReportsCharts({
  daily,
  categories,
  products,
  topProductsExtra,
}: {
  daily: { label: string; value: number; iso: string }[]
  categories: { label: string; revenue: number; pct: number }[]
  products: { name: string; units: number; revenue: number }[]
  /**
   * The full ranked list and its CSV export, rendered inside this card.
   *
   * A slot rather than a second section, because the page previously carried
   * two cards both headed "Top products" — a chart of the best five and a
   * table of all ten — and a reader comparing them had no way to tell which
   * was authoritative or why the numbers stopped at different places. One
   * card, chart first, the full list behind a disclosure.
   *
   * Passed in from ReportsClient rather than built here so every CSV export
   * on the page stays defined next to its siblings.
   */
  topProductsExtra?: React.ReactNode
}) {
  const prefersReduced = useReducedMotion()
  const animate = !prefersReduced

  // Ten bars of product names is unreadable at 390 whichever way they are
  // turned, and the table below already carries the full ten.
  const topFive = products.slice(0, 5)

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      {/* ---- Revenue over time ---- */}
      <section className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:col-span-2">
        <h2 className="sp-heading">Revenue over time</h2>
        <p className="sp-body mt-1 text-sm">
          {daily.length} day{daily.length === 1 ? '' : 's'} in the selected range
        </p>
        <div className="mt-4 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                {/* A wash under the line rather than a solid fill: at 30 days
                    the line is the information and the area is context. */}
                <linearGradient id="sp-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                {...axisProps}
                // 30 labels do not fit in 358px of usable width. Recharts
                // drops what it cannot fit rather than overlapping, and
                // `preserveStartEnd` guarantees the range's first and last day
                // survive that cull — which are the two a reader looks for.
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis {...axisProps} width={72} tickFormatter={(v) => formatCurrencyWhole(Number(v))} />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--muted-strong)' }}
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#sp-revenue-fill)"
                isAnimationActive={animate}
                animationDuration={600}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ---- Sales by category ---- */}
      <section className="sp-rise sp-delay-1 sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="sp-heading">Sales by category</h2>
        <p className="sp-body mt-1 text-sm">Revenue share across the store&apos;s categories</p>
        <div className="mt-4 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <XAxis type="number" {...axisProps} tickFormatter={(v) => formatCurrencyWhole(Number(v))} />
              {/* Horizontal bars, because "Packaged Goods" and "Dairy & Eggs"
                  cannot be read on a vertical axis at 390 without turning the
                  labels sideways. */}
              <YAxis type="category" dataKey="label" {...axisProps} width={96} />
              <Tooltip
                cursor={{ fill: 'var(--surface-muted)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--muted-strong)' }}
                formatter={(value, _n, item) => [
                  `${formatCurrency(Number(value))} · ${Number(item?.payload?.pct ?? 0).toFixed(1)}%`,
                  'Revenue',
                ]}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} isAnimationActive={animate} animationDuration={600}>
                {categories.map((c, i) => (
                  <Cell key={c.label} fill={CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ---- Top products ---- */}
      <section className="sp-rise sp-delay-2 sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="sp-heading">Top products</h2>
        <p className="sp-body mt-1 text-sm">
          Highest revenue, best five of {products.length}
        </p>
        <div className="mt-4 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFive} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <XAxis type="number" {...axisProps} tickFormatter={(v) => formatCurrencyWhole(Number(v))} />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                width={96}
                // Product names run long ("Masala Chai Leaves 250g"); truncate
                // rather than let recharts widen the axis and squeeze the bars
                // to nothing. The full name is in the tooltip and the table.
                tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-muted)' }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--muted-strong)' }}
                formatter={(value, _n, item) => [
                  `${formatCurrency(Number(value))} · ${item?.payload?.units ?? 0} units`,
                  'Revenue',
                ]}
              />
              <Bar
                dataKey="revenue"
                fill="var(--chart-1)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={animate}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {topProductsExtra}
      </section>
    </div>
  )
}
