import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * A list of category rows beside a single add-form card — no stat tiles.
 * Route-specific rather than the group fallback so the page reserves its own
 * geometry, which is what keeps CLS at 0 while the categories query resolves.
 */
export default function CategoriesLoading() {
  return <PageSkeleton stats={0} rows={5} />
}
