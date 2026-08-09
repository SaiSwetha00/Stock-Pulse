import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export default function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  /**
   * A line-art drawing from `components/ui/LineArt`, for the "you have none of
   * these yet" states — the ones a person meets once, where the screen is
   * otherwise blank and has room to say something.
   *
   * Deliberately NOT used for "nothing matches your filters". That state is a
   * correction, it recurs, and an illustration there would put a picture in
   * the way of the Clear filters button every time somebody mistypes. Those
   * keep the small `icon` tile.
   *
   * Takes precedence over `icon` when both are passed, so a call site cannot
   * accidentally render two marks stacked.
   */
  illustration?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {illustration ? (
        // Fixed height so the block reserves its geometry whether or not the
        // drawing has painted — an illustration that sizes itself from its own
        // intrinsic ratio is a layout shift waiting for a slow frame.
        <div className="mb-4 h-24 w-32 sm:h-28 sm:w-40" aria-hidden="true">
          {illustration}
        </div>
      ) : Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted">
          <Icon className="h-6 w-6 text-muted" aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
