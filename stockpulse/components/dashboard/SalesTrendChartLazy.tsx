'use client'

import dynamic from 'next/dynamic'
import Skeleton from '@/components/ui/Skeleton'

/**
 * Defers recharts — easily the heaviest dependency here — out of the dashboard's
 * initial bundle. The chart is below the stat row and useless before hydration
 * anyway, so nothing is lost by loading it after paint.
 *
 * `ssr: false` only works inside a Client Component, which is why this wrapper
 * exists rather than calling dynamic() straight from the page.
 */
const SalesTrendChart = dynamic(() => import('./SalesTrendChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />,
})

export default function SalesTrendChartLazy({
  data,
  height,
}: {
  data: { label: string; value: number }[]
  /**
   * Forwarded straight through; see SalesTrendChart for what the values mean.
   *
   * Arrives as `undefined` when a caller omits it, so the chart's own `= 280`
   * default applies. That is what keeps /sales — which passes only `data` —
   * rendering at exactly the height it always has.
   */
  height?: number | `${number}%`
}) {
  return <SalesTrendChart data={data} height={height} />
}
