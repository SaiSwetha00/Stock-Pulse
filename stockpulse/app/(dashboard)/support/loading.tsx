import PageSkeleton from '@/components/ui/PageSkeleton'

/** No stat band; the queue is a list. */
export default function SupportLoading() {
  return <PageSkeleton stats={0} rows={6} />
}
