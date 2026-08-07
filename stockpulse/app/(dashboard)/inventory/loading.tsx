import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * Inventory carries three stat tiles — total value, low stock, out of stock —
 * above a long product table, so it reserves more rows than the generic
 * workspace fallback.
 */
export default function InventoryLoading() {
  return <PageSkeleton stats={3} rows={8} />
}
