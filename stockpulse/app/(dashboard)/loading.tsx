import PageSkeleton from '@/components/ui/PageSkeleton'

/**
 * Covers every workspace route that does not define its own. Each of these
 * pages awaits Supabase before rendering anything, so without a fallback the
 * viewer sat on the previous screen with no sign the navigation had happened.
 */
export default function WorkspaceLoading() {
  return <PageSkeleton />
}
