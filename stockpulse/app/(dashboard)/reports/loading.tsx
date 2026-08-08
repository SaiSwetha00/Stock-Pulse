import PageSkeleton from '@/components/ui/PageSkeleton'

/** Four KPI tiles over the chart band, plus the export row. */
export default function ReportsLoading() {
  return <PageSkeleton stats={4} chart rows={0} />
}
