import PageSkeleton from '@/components/ui/PageSkeleton'

/** Four station cards, no table. */
export default function MonitoringLoading() {
  return <PageSkeleton stats={4} rows={0} />
}
