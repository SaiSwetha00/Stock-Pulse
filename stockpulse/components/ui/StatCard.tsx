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
    <div className={cn('rounded-2xl border border-border bg-surface p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
      </div>

      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>

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
