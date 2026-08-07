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
}: {
  data: { label: string; value: number }[]
}) {
  return <SalesTrendChart data={data} />
}
