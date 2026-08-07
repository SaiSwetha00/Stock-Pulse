'use client'

import { useReducedMotion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

export default function SalesTrendChart({
  data,
}: {
  data: { label: string; value: number }[]
}) {
  const prefersReduced = useReducedMotion()

  const maxIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          tickFormatter={(v) => (v === 0 ? '0' : `$${v >= 1000 ? `${v / 1000}k` : v}`)}
        />
        <Tooltip
          cursor={{ fill: '#f4f4f5' }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
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
