import PageSkeleton from '@/components/ui/PageSkeleton'

/** The same shape as Analytics, plus the export row. */
export default function ReportsLoading() {
  return <PageSkeleton stats={4} chart rows={0} />
}
