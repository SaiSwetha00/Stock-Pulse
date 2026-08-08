import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * The roster is a single table with no stat band and no side rail — the
 * schedule's own loading shape (which reserves an availability column) would
 * jump when this page landed.
 */
export default function TeamLoading() {
  return <PageSkeleton stats={0} rows={6} />
}
