import PageSkeleton from '@/components/ui/PageSkeleton'

/** Two columns of configuration panels, no table. */
export default function SettingsLoading() {
  return <PageSkeleton stats={0} rows={4} />
}
