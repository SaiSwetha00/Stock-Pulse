import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Headline metric tile. `trend` is a signed percentage; whether up is good is
 * caller-specific (rising waste is bad), hence `invertTrend`.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  invertTrend = false,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  trend?: number
  trendLabel?: string
  invertTrend?: boolean
  className?: string
}) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend)
  const rising = hasTrend && trend > 0
  const flat = hasTrend && trend === 0
  const good = invertTrend ? !rising : rising
  const TrendIcon = rising ? ArrowUpRight : ArrowDownRight

  return (
    <div className={cn('sp-e1 rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
        {/* The icon sits in a tinted tile rather than floating as a bare
            glyph, matching the quick-action tiles so the two rows read as one
            system. It stays muted: the number is the focus, and an icon that
            competes with it is the thing this pass is correcting. */}
        {Icon && (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted">
            <Icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* 28px, up from 24. The brief asks that the number stay the primary
          focus; the label above it shrank a step at the same time, so the
          ratio between them widens from 2.0x to 2.5x without the card
          growing. */}
      <p className="mt-3 text-[28px] font-bold leading-none tracking-[-0.01em] tabular-nums text-foreground">
        {value}
      </p>

      {hasTrend && (
        <div className="mt-2 flex items-center gap-1.5">
          {!flat && (
            <TrendIcon
              className={cn('h-3.5 w-3.5 shrink-0', good ? 'text-accent' : 'text-danger')}
              aria-hidden="true"
            />
          )}
          <span className={cn('text-xs font-semibold', flat ? 'text-muted' : good ? 'text-accent' : 'text-danger')}>
            {rising ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && <span className="text-xs text-muted">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
