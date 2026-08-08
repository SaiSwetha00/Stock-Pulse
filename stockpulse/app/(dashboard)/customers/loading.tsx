import PageSkeleton from '@/components/ui/PageSkeleton'

/** A stat band over the customer table. */
export default function CustomersLoading() {
  return <PageSkeleton stats={3} rows={8} />
}
