import { AlertTriangle, Archive, CalendarClock, Layers } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EXPIRING, LOW_STOCK, SNAPSHOT_DATE, TOTALS, WARNING_DAYS } from '@/components/landing/snapshot'

/**
 * Shared by the three explorations: the StockPulse mark, the copy that must
 * not vary between them, and the real dashboard panels broken out one by one
 * so a direction can compose them its own way (Exploration 2 does).
 *
 * Every panel is the app's own component — StatCard, Card, Badge, ExpiryTag
 * with its real expiry-tone logic — filled with the demo store's real
 * snapshot. No invented figures, no revenue (see snapshot.ts for why).
 */

export const LINKS = {
  signup: '/signup',
  demo: '/login?demo=1',
  login: '/login',
}

/**
 * Real capabilities, named as the product names them. Used instead of
 * statistics or testimonials, which this project does not have and will not
 * invent.
 */
export const CAPABILITIES = [
  { title: 'Stock by lot and expiry', body: 'Every delivery is its own lot with its own date, so the nearest expiry date is always the one you see.' },
  { title: 'A till that keeps selling offline', body: 'Sales queue on the device when the internet drops and sync when it comes back.' },
  { title: 'Owner, manager and staff roles', body: 'Staff work the till. Prices, stock and reports stay with the people who run the shop.' },
]

export function Mark({
  className = 'h-8 w-8',
  fill,
  stroke = '#FFFFFF',
}: {
  className?: string
  fill: string
  stroke?: string
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill={fill} />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─────────── Real dashboard panels, one at a time ─────────── */

export function ProductsTile({ className = '' }: { className?: string }) {
  return <StatCard label="Products" value={TOTALS.products} icon={Archive} className={className} />
}

export function LotsTile({ className = '' }: { className?: string }) {
  return <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={className} />
}

export function LowStockTile({ className = '' }: { className?: string }) {
  return <StatCard label="Low Stock" value={TOTALS.lowStock} icon={AlertTriangle} className={className} />
}

export function ExpiringTile({ className = '' }: { className?: string }) {
  return <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={className} />
}

export function LowStockPanel({ line, className = '' }: { line: string; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
      <CardBody>
        <ul className="divide-y" style={{ borderColor: line }}>
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
  )
}

export function ExpiringPanel({ line, rows = 3, className = '' }: { line: string; rows?: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Expiring Soon" subtitle={`${TOTALS.expiredLots} lots already expired`} />
      <CardBody>
        <ul className="divide-y" style={{ borderColor: line }}>
          {EXPIRING.slice(0, rows).map((e) => {
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
}
