'use client'

import { useReducedMotion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { formatCurrency, formatCurrencyWhole } from '@/lib/format'

export default function SalesTrendChart({
  data,
  height = 280,
  seriesLabel = 'Sales',
}: {
  data: { label: string; value: number }[]
  /** The tooltip's series name. English by default, so a caller that passes
   *  nothing behaves exactly as before. */
  seriesLabel?: string
  /**
   * Plot height. A number is pixels; `"100%"` makes the chart fill the box it
   * is given — which requires that box to have a definite height of its own,
   * because recharts measures the parent and a percentage inside an
   * auto-height container resolves to zero, leaving no chart at all.
   *
   * DEFAULTS TO 280, and the default is the compatibility guarantee: /sales
   * renders this same component through the same lazy wrapper and passes
   * nothing, so it keeps the height it has always had. Only the dashboard
   * opts into filling.
   *
   * Typed as recharts types it — a number or a percentage STRING LITERAL, not
   * a loose `string`. Its `ResponsiveContainer` accepts `number | ${number}%`,
   * so a plain `string` is rejected at the call site rather than here, which
   * would have pushed the error one file away from the prop that caused it.
   */
  height?: number | `${number}%`
}) {
  const prefersReduced = useReducedMotion()

  const maxIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
        {/*
          COLOURS COME FROM THE THEME, NOT FROM LITERALS.

          This chart used to hard-code #71717a for the axes, #f4f4f5 for the
          hover cursor, #e4e4e7 for the tooltip border and #18181b / #d4d4d8
          for the bars — five warm-grey values from a palette the app no longer
          uses. It was the only component in the authenticated app still doing
          that, which is also why it was the only one that never followed dark
          mode: a literal cannot change when `.dark` is toggled.

          Every value below now resolves to a design token. The Tailwind
          `fill-*` utilities emit `fill: var(--color-…)`, and `@theme inline`
          maps those onto the runtime variables, so the chart follows light,
          dark and any future palette with no further work here. The class form
          is what makes this work at all: a CSS declaration outranks an SVG
          presentation attribute, whereas `fill="var(…)"` as an attribute is
          not resolved by browsers.

          Behaviour, data, sizing and the animation are untouched.
        */}
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ className: 'fill-muted', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ className: 'fill-muted', fontSize: 12 }}
          // These two built their own currency strings, which is why the
          // dashboard kept showing dollars on the axis and in the tooltip
          // after lib/format.ts had already been switched to rupees. A
          // formatter nothing calls cannot fix the places that reimplemented
          // it — hence formatCurrencyWhole existing at all.
          tickFormatter={(v) => (v === 0 ? '0' : formatCurrencyWhole(Number(v)))}
        />
        <Tooltip
          cursor={{ className: 'fill-surface-muted' }}
          formatter={(value) => [formatCurrency(Number(value)), seriesLabel]}
          // contentStyle is applied as an inline style rather than an
          // attribute, and `var()` IS resolved there — so these can stay as
          // declarations. Background and colour are named explicitly because
          // recharts defaults the tooltip to white with near-black text, which
          // is unreadable on a dark surface.
          contentStyle={{
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--overlay)',
            color: 'var(--foreground)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--muted)' }}
          itemStyle={{ color: 'var(--foreground)' }}
        />
        {/* Bars grow from the axis on mount. Recharts animates by default;
            this was switched off, so the chart simply appeared. Reduced
            motion switches it back off rather than shortening it — a
            300ms grow is the whole effect, and a 1ms one is just a pop. */}
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          isAnimationActive={!prefersReduced}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {/* The best day takes the leading chart colour; the rest take the
              palest step of the same family, so the emphasis reads without a
              second hue. Both are tokens, so the pair stays coherent in dark
              mode instead of leaving a near-black bar on a dark card. */}
          {data.map((_, i) => (
            <Cell key={i} className={i === maxIndex ? 'fill-chart-1' : 'fill-chart-3'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
