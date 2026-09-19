import { AlertTriangle, Archive, CalendarClock, Layers } from 'lucide-react'
import { navItemsFor } from '@/lib/nav'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EXPIRING, LOW_STOCK, SNAPSHOT_DATE, SNAPSHOT_LABEL, TOTALS, WARNING_DAYS } from './snapshot'

/**
 * The landing page's product preview: the real dashboard, built from the app's
 * OWN components (StatCard, Card, Badge, ExpiryTag with its real expiry-tone
 * logic, and the sidebar's navItemsFor) and the demo-store snapshot. Nothing
 * here is a screenshot and no figure is invented.
 *
 * Colour comes from CSS variables set on the landing wrapper (themeStyle), so
 * the shared components render in the page's palette without being edited,
 * and stay light under the app's `.dark` class.
 */

export type LandingTheme = 'mono' | 'green'

const PALETTES: Record<LandingTheme, { accent: string; hover: string; soft: string; ink: string; tint: string }> = {
  // Black and white — one ink colour, no accent hue at all.
  mono: { accent: '#111111', hover: '#333333', soft: '#F4F4F5', ink: '#111111', tint: '#FAFAFA' },
  // White with a single deep green. White on #166534 is 7.1:1.
  green: { accent: '#166534', hover: '#14532D', soft: '#EDF7F0', ink: '#14532D', tint: '#F7FAF8' },
}

export function themeStyle(theme: LandingTheme): React.CSSProperties {
  const p = PALETTES[theme]
  return {
    // The page's own variables.
    '--lp-accent': p.accent,
    '--lp-accent-hover': p.hover,
    '--lp-accent-soft': p.soft,
    '--lp-accent-ink': p.ink,
    '--lp-tint': p.tint,
    // The app's theme tokens, pinned light for the reused components.
    '--background': p.tint,
    '--surface': '#FFFFFF',
    '--surface-muted': '#F4F4F5',
    '--raised': '#FFFFFF',
    '--overlay': '#FFFFFF',
    '--foreground': '#111827',
    '--muted-strong': '#4B5563',
    '--muted': '#6B7280',
    '--border': '#E5E7EB',
    '--border-strong': '#D1D5DB',
    '--accent': p.ink,
    '--accent-fill': p.accent,
    '--on-accent': '#FFFFFF',
    '--accent-hover': p.hover,
    '--accent-soft': p.soft,
    '--accent-ink': p.ink,
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

export { SNAPSHOT_LABEL }

export const DASHBOARD_LABEL = `The StockPulse dashboard for the demo store on ${SNAPSHOT_LABEL}: ${TOTALS.products} products, ${TOTALS.liveLots} stock lots, ${TOTALS.lowStock} items at or below their reorder level, and ${TOTALS.expiringSoonLots} lots expiring within ${WARNING_DAYS} days with ${TOTALS.expiredLots} already expired.`

/** StatCard's own className prop — the shared component is not edited. */
const STAT_FIT = 'p-4 sm:p-5 max-sm:[&_span.inline-flex]:hidden'

/** The app window: title bar, the real sidebar (optional), the dashboard. */
export function DashboardPreview({ sidebar = true, compact = false }: { sidebar?: boolean; compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label={DASHBOARD_LABEL}
      className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white text-left shadow-[0_1px_2px_rgba(17,24,39,0.04),0_24px_60px_-32px_rgba(17,24,39,0.30)]"
    >
      <div aria-hidden="true" className="select-none">
        <div className="flex items-center gap-2 border-b border-[#F0F0F2] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
          <span className="ml-3 truncate text-[12px] font-medium text-[#6B7280]">StockPulse Demo Store</span>
        </div>
        <div className="flex">
          {sidebar && (
            <aside className="hidden w-44 shrink-0 border-r border-[#F0F0F2] bg-[var(--lp-tint)] p-3 lg:block">
              <ul className="space-y-0.5">
                {navItemsFor('owner')
                  .slice(0, 9)
                  .map(({ href, label, icon: Icon }) => (
                    <li
                      key={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] ${
                        href === '/dashboard'
                          ? 'bg-[var(--lp-accent-soft)] font-semibold text-[var(--lp-accent-ink)]'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </li>
                  ))}
              </ul>
            </aside>
          )}
          <div className="min-w-0 flex-1 bg-[var(--lp-tint)] p-4 sm:p-5">
            <p className="text-[11.5px] font-medium text-[#6B7280]">Saturday, 19 September</p>
            <p className="mb-4 text-[17px] font-bold tracking-tight text-[#111827]">Dashboard</p>
            {/* compact: beside the hero text the window is ~55% wide, and four tiles in a row wrapped their labels. */}
            <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${compact ? '' : 'xl:grid-cols-4'}`}>
              <StatCard label="Products" value={TOTALS.products} icon={Archive} className={STAT_FIT} />
              <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={STAT_FIT} />
              <StatCard label="Low Stock" value={TOTALS.lowStock} icon={AlertTriangle} className={STAT_FIT} />
              <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={STAT_FIT} />
            </div>
            {/* compact: side by side, the two alert cards truncated product names. */}
            <div className={`mt-3 grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
              {/* compact: the Low Stock tile above already gives the count; dropping this card keeps
                  the side-by-side hero inside one screen (it measured 849px in a 900px window). */}
              {!compact && (
              <Card>
                <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
                <CardBody>
                  <ul className="divide-y divide-[#F0F0F2]">
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
              <Card>
                <CardHeader title="Expiring Soon" subtitle={`${TOTALS.expiredLots} lots already expired`} />
                <CardBody>
                  <ul className="divide-y divide-[#F0F0F2]">
                    {EXPIRING.map((e) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
