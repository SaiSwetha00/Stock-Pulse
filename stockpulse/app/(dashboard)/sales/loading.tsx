import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * Sales opens with the weekly-performance chart and the popular-categories
 * panel beside it, then the transactions table — the same band the dashboard
 * reserves, without the stat row above it.
 */
export default function SalesLoading() {
  return <PageSkeleton stats={0} chart rows={6} />
}
