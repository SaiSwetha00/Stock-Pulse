import Skeleton from '@/components/ui/Skeleton'

/**
 * The loading shape shared by every workspace route. It deliberately mirrors
 * the real page's geometry — same header block, same stat-card grid, same row
 * rhythm — so the layout does not jump when the data lands.
 *
 * Rows collapse to cards below `lg`, matching the responsive tables they stand
 * in for.
 */
export default function PageSkeleton({
  stats = 3,
  chart = false,
  rows = 6,
  sidePanel = false,
}: {
  /** Number of stat cards above the content. 0 hides the grid. */
  stats?: number
  /** Reserve the chart + side-list band (the dashboard's shape). */
  chart?: boolean
  /** Number of table/list rows to stand in for. */
  rows?: number
  /** Reserve a right-hand rail (the staff schedule's shape). */
  sidePanel?: boolean
}) {
  return (
    <div
      // The whole region is decorative: a screen reader should hear the busy
      // state once, not read out two dozen empty boxes.
      role="status"
      aria-label="Loading"
      // Same wrapper as a real page, so the skeleton occupies the exact box
      // its content will — otherwise the layout jumps when data lands.
      className="sp-page"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>

      {stats > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <div key={i} className="sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-4 h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-32" />
            </div>
          ))}
        </div>
      )}

      {chart && (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:col-span-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
          <div className="sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={sidePanel ? 'mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]' : 'mt-7'}>
        <div className="sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <Skeleton className="h-5 w-44" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border p-3 lg:border-0 lg:p-0"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                </div>
                <Skeleton className="hidden h-4 w-20 shrink-0 sm:block" />
                <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {sidePanel && (
          <div className="sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
            <Skeleton className="h-5 w-36" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="mt-1.5 h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <span className="sr-only">Loading page content…</span>
    </div>
  )
}
