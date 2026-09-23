import { AlertTriangle, Archive, CalendarClock, Layers } from 'lucide-react'
import { navItemsFor } from '@/lib/nav'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EXPIRING, LOW_STOCK, SNAPSHOT_DATE, SNAPSHOT_LABEL, TOTALS, WARNING_DAYS } from '@/components/landing/snapshot'

/**
 * The one product visual the three design directions share.
 *
 * It is the real dashboard: the app's own StatCard, Card, Badge and ExpiryTag
 * (with its real expiry-tone logic) and the sidebar's navItemsFor, filled with
 * the demo store's real data. No screenshot, no invented figures — so the
 * three directions differ only in design language, never in product.
 *
 * `palette` re-points the app's theme tokens for this subtree only, which is
 * how each direction tints the product to match its own surface without any
 * shared component being edited.
 */

export type Palette = {
  /** Page surface behind the window's content area. */
  tint: string
  /** Hairlines inside the product. */
  line: string
  /** The one accent, used for the active sidebar row. */
  accent: string
  accentSoft: string
  /** Window corner radius and shadow — part of each direction's card style. */
  radius: string
  shadow: string
}

export function productTokens(p: Palette): React.CSSProperties {
  return {
    '--background': p.tint,
    '--surface': '#FFFFFF',
    '--surface-muted': p.tint,
    '--raised': '#FFFFFF',
    '--overlay': '#FFFFFF',
    '--foreground': '#111827',
    '--muted-strong': '#4B5563',
    '--muted': '#6B7280',
    '--border': p.line,
    '--border-strong': '#D1D5DB',
    '--accent': p.accent,
    '--accent-fill': p.accent,
    '--on-accent': '#FFFFFF',
    '--accent-hover': p.accent,
    '--accent-soft': p.accentSoft,
    '--accent-ink': p.accent,
    '--success': '#15803D',
    '--success-bg': '#DCFCE7',
    '--success-ink': '#166534',
    '--danger': '#B91C1C',
    '--danger-bg': '#FEE2E2',
    '--warning': '#B45309',
    '--warning-bg': '#FEF3C7',
    '--info': '#4B5563',
    '--info-bg': '#F4F4F5',
  } as React.CSSProperties
}

export const PRODUCT_LABEL = `The StockPulse dashboard for the demo store on ${SNAPSHOT_LABEL}: ${TOTALS.products} products, ${TOTALS.liveLots} stock lots, ${TOTALS.lowStock} items at or below their reorder level, and ${TOTALS.expiringSoonLots} lots expiring within ${WARNING_DAYS} days with ${TOTALS.expiredLots} already expired.`

const STAT_FIT = 'p-4 max-sm:[&_span.inline-flex]:hidden'

export default function ProductShot({
  palette,
  sidebar = true,
  /** `tiles` trims the alert cards to one — for compositions where the window is narrow. */
  tiles = false,
  className = '',
}: {
  palette: Palette
  sidebar?: boolean
  tiles?: boolean
  className?: string
}) {
  const alertRows = (
    <Card>
      <CardHeader title="Expiring Soon" subtitle={`${TOTALS.expiredLots} lots already expired`} />
      <CardBody>
        <ul className="divide-y" style={{ borderColor: palette.line }}>
          {EXPIRING.slice(0, tiles ? 2 : 3).map((e) => {
            const expired = e.expiry < SNAPSHOT_DATE
            return (
              <li key={e.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#111827]">
                    {e.name} <span className="font-normal text-[#6B7280]">· {e.quantity} units</span>
                  </span>
                  <ExpiryTag date={e.expiry} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} />
                </span>
                <Badge tone={expired ? 'danger' : 'neutral'} className="shrink-0 whitespace-nowrap">
                  {expired ? 'Write off' : 'Discount'}
                </Badge>
              </li>
            )
          })}
        </ul>
      </CardBody>
    </Card>
  )

  return (
    <div
      role="img"
      aria-label={PRODUCT_LABEL}
      className={`overflow-hidden border bg-white text-left ${className}`}
      style={{ ...productTokens(palette), borderColor: palette.line, borderRadius: palette.radius, boxShadow: palette.shadow }}
    >
      <div aria-hidden="true" className="select-none">
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: palette.line }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.line }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.line }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.line }} />
          <span className="ml-3 truncate text-[12px] font-medium text-[#6B7280]">StockPulse Demo Store</span>
        </div>
        <div className="flex">
          {sidebar && (
            <aside
              className="hidden w-44 shrink-0 border-r p-3 lg:block"
              style={{ borderColor: palette.line, background: palette.tint }}
            >
              <ul className="space-y-0.5">
                {navItemsFor('owner')
                  .slice(0, 9)
                  .map(({ href, label, icon: Icon }) => (
                    <li
                      key={href}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px]"
                      style={
                        href === '/dashboard'
                          ? { background: palette.accentSoft, color: palette.accent, fontWeight: 600 }
                          : { color: '#6B7280' }
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </li>
                  ))}
              </ul>
            </aside>
          )}
          <div className="min-w-0 flex-1 p-4 sm:p-5" style={{ background: palette.tint }}>
            <p className="text-[11.5px] font-medium text-[#6B7280]">Saturday, 19 September</p>
            <p className="mb-4 text-[17px] font-bold tracking-tight text-[#111827]">Dashboard</p>
            <div className={`grid gap-2.5 sm:gap-3 ${tiles ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-4'}`}>
              <StatCard label="Products" value={TOTALS.products} icon={Archive} className={STAT_FIT} />
              <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={STAT_FIT} />
              <StatCard label="Low Stock" value={TOTALS.lowStock} icon={AlertTriangle} className={STAT_FIT} />
              <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={STAT_FIT} />
            </div>

            <div className={`mt-3 grid gap-3 ${tiles ? '' : 'md:grid-cols-2'}`}>
              {!tiles && (
                <Card>
                  <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
                  <CardBody>
                    <ul className="divide-y" style={{ borderColor: palette.line }}>
                      {LOW_STOCK.map((p) => (
                        <li key={p.name} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[#111827]">{p.name}</span>
                            <span className="text-[12px] text-[#6B7280]">{p.category}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="text-[13px] tabular-nums text-[#4B5563]">
                              {p.stock} <span className="text-[#6B7280]">/ {p.threshold}</span>
                            </span>
                            <Badge tone="warning" className="whitespace-nowrap">
                              Reorder
                            </Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}
              {alertRows}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
