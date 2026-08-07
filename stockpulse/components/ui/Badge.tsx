import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

/**
 * The status pill system. One tone per meaning, each a tinted background with
 * its own ink — never a saturated fill, which at this size reads as a button
 * rather than a label.
 *
 * `info` was the odd one out on raw `blue-*` utilities while every other tone
 * used a token, so it alone ignored dark mode.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-muted-strong',
  success: 'bg-accent-soft text-accent-ink',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
}

export default function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
