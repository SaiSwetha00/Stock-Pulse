import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * Suppliers is a two-thirds table with the incoming-shipments rail beside it,
 * which is the `sidePanel` shape.
 */
export default function SuppliersLoading() {
  return <PageSkeleton stats={0} rows={6} sidePanel />
}
