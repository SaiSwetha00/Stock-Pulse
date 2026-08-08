import PageSkeleton from '@/components/ui/PageSkeleton'

/** Four KPI tiles over the chart band. */
export default function AnalyticsLoading() {
  return <PageSkeleton stats={4} chart rows={0} />
}
