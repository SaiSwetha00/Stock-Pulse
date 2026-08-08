import PageSkeleton from '@/components/ui/PageSkeleton'

/** No stat band — the log is one long table. */
export default function AuditLoading() {
  return <PageSkeleton stats={0} rows={10} />
}
