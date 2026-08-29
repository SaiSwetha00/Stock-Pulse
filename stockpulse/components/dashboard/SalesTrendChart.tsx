'use client'

import { useReducedMotion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { formatCurrency, formatCurrencyWhole } from '@/lib/format'

export default function SalesTrendChart({
  data,
  height = 280,
}: {
  data: { label: string; value: number }[]
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
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#71717a', fontSize: 12 }}
          // These two built their own currency strings, which is why the
          // dashboard kept showing dollars on the axis and in the tooltip
          // after lib/format.ts had already been switched to rupees. A
          // formatter nothing calls cannot fix the places that reimplemented
          // it — hence formatCurrencyWhole existing at all.
          tickFormatter={(v) => (v === 0 ? '0' : formatCurrencyWhole(Number(v)))}
        />
        <Tooltip
          cursor={{ fill: '#f4f4f5' }}
          formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', fontSize: 12 }}
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
          {data.map((_, i) => (
            <Cell key={i} fill={i === maxIndex ? '#18181b' : '#d4d4d8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
