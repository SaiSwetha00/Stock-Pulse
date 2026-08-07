import { cn } from '@/lib/cn'

/**
 * Placeholder block for loading states.
 *
 * `sp-shimmer` (globals.css) paints a travelling highlight rather than pulsing
 * opacity. It animates background-position only, so a page full of these costs
 * no layout work, and it falls back to a flat block under prefers-reduced-motion
 * — still visible, just still.
 */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('sp-shimmer rounded-lg', className)} />
}

/** A few stacked lines, for text-shaped loading regions. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
