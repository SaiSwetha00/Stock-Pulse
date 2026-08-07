import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * The dashboard is the slowest route in the app — five Supabase queries plus a
 * chart — so it gets a fallback matched to its own shape rather than the
 * generic workspace one.
 */
export default function DashboardLoading() {
  return <PageSkeleton stats={4} chart rows={4} />
}
