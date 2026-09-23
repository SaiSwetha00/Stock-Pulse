import { AlertTriangle, Archive, CalendarClock, CloudOff, Layers, RefreshCw, ScanBarcode, Clock } from 'lucide-react'
import { navItemsFor } from '@/lib/nav'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import {
  BY_CATEGORY,
  EXPIRING,
  LOW_STOCK,
  OFFLINE_UI,
  SNAPSHOT_DATE,
  SNAPSHOT_LABEL,
  TOTALS,
  WARNING_DAYS,
} from '../final/snapshot'

/**
 * Shared product screens for the three "new-*" concepts.
 *
 * Every screen is built from the app's OWN components (StatCard, Card, Badge,
 * ExpiryTag with its real expiry-tone logic, the sidebar's navItemsFor), so
 * all three concepts show one connected product rather than three invented
 * ones. Figures come from two real sources and nowhere else:
 *
 *  - ../final/snapshot.ts — a read-only snapshot of the demo store, 19 Sep 2026.
 *  - The production QA cycle of Sep 2026 — the earliest-expiry-first sale
 *    (Spiced Buttermilk 200ml, 4 units: the 15 Sep lot 2 → 0, the 26 Sep lot
 *    35 → 33) and the offline-sync messages.
 *
 * No revenue or prices: the demo store's seeded sales have aged out and its
 * seeded prices are unrealistic, and inventing replacements is ruled out.
 */

/** The app's light-theme tokens, pinned so reused components stay light under `.dark`. */
export const APP_LIGHT_TOKENS = {
  '--background': '#fbfaf8',
  '--surface': '#ffffff',
  '--surface-muted': '#f4f2ee',
  '--raised': '#ffffff',
  '--overlay': '#ffffff',
  '--foreground': '#14100c',
  '--muted-strong': '#4a4139',
  '--muted': '#6b6157',
  '--border': '#e3d7c1',
  '--border-strong': '#b99f76',
  '--accent': '#8a6206',
  '--accent-fill': '#c9a227',
  '--on-accent': '#14100c',
  '--accent-hover': '#6d4d04',
  '--accent-soft': '#f6e8c8',
  '--accent-ink': '#5a3f03',
  '--success': '#3f6b2b',
  '--success-bg': '#e4edd8',
  '--success-ink': '#2b4a1d',
  '--danger': '#8f2a1c',
  '--danger-bg': '#f7ded8',
  '--warning': '#8a5a06',
  '--warning-bg': '#f7e7c6',
  '--info': '#5c4a38',
  '--info-bg': '#ece0cd',
} as React.CSSProperties

export { SNAPSHOT_LABEL, TOTALS }

/**
 * Nine real demo-store products, as Inventory lists them (same snapshot;
 * rows read individually with their thresholds and lots).
 */
export const INVENTORY_ROWS = [
  { name: 'Agarbatti Pack', category: 'Household', stock: 25, threshold: 7, lots: [{ q: 20, exp: null, rec: '2026-08-20' }, { q: 5, exp: null, rec: '2026-09-08' }] },
  { name: 'Bananas', category: 'Produce', stock: 26, threshold: 9, lots: [{ q: 26, exp: '2026-09-11', rec: '2026-08-25' }] },
  { name: 'Basmati Rice 5kg', category: 'Packaged', stock: 2, threshold: 5, lots: [{ q: 2, exp: null, rec: '2026-09-05' }] },
  { name: 'Brinjal', category: 'Produce', stock: 14, threshold: 6, lots: [{ q: 14, exp: '2026-09-09', rec: '2026-09-02' }] },
  { name: 'Butter 500g', category: 'Dairy', stock: 2, threshold: 5, lots: [{ q: 2, exp: '2026-09-28', rec: '2026-08-21' }] },
  { name: 'Cheese Slices 100g', category: 'Dairy', stock: 18, threshold: 5, lots: [{ q: 18, exp: '2026-09-24', rec: '2026-08-31' }] },
  { name: 'Curd 1kg', category: 'Dairy', stock: 12, threshold: 5, lots: [{ q: 12, exp: '2026-09-24', rec: '2026-08-25' }] },
  { name: 'Curd 200g', category: 'Dairy', stock: 34, threshold: 7, lots: [{ q: 34, exp: '2026-09-24', rec: '2026-09-04' }] },
  { name: 'Filter Coffee 100g', category: 'Beverages', stock: 1, threshold: 5, lots: [{ q: 1, exp: null, rec: '2026-08-30' }] },
] as const

const nextExpiry = (lots: ReadonlyArray<{ q: number; exp: string | null }>) =>
  lots.filter((l) => l.q > 0 && l.exp).map((l) => l.exp as string).sort()[0] ?? null

const fmtShort = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/* ───────────── app chrome ───────────── */

export function AppWindow({
  active = '/dashboard',
  sidebar = true,
  className = '',
  label,
  children,
}: {
  active?: string
  sidebar?: boolean
  className?: string
  /** Text alternative for the whole screen; the visual itself is hidden from assistive tech. */
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`overflow-hidden rounded-[20px] border border-[#E7DDCB] bg-white text-left shadow-[0_1px_2px_rgba(20,16,12,0.05),0_40px_90px_-40px_rgba(20,16,12,0.35)] ${className}`}
    >
      <div aria-hidden="true" className="select-none">
        <div className="flex items-center gap-2 border-b border-[#F1EBE0] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
          <span className="ml-3 truncate text-[12px] font-medium text-[#6b6157]">StockPulse Demo Store</span>
        </div>
        <div className="flex">
          {sidebar && (
            <aside className="hidden w-48 shrink-0 border-r border-[#F1EBE0] bg-[#fbfaf8] p-3 lg:block">
              <ul className="space-y-0.5">
                {navItemsFor('owner')
                  .slice(0, 10)
                  .map(({ href, label: l, icon: Icon }) => (
                    <li
                      key={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] ${
                        href === active ? 'bg-[#f6e8c8] font-semibold text-[#5a3f03]' : 'text-[#6b6157]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {l}
                    </li>
                  ))}
              </ul>
            </aside>
          )}
          <div className="min-w-0 flex-1 bg-[#fbfaf8] p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

function ScreenTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-[#6b6157]">{sub ?? 'Saturday, 19 September'}</p>
      <p className="text-[17px] font-bold tracking-tight text-[#14100c]">{title}</p>
    </div>
  )
}

/** StatCard's own className prop — the shared component itself is untouched. */
const STAT_FIT = 'p-4 sm:p-5 max-sm:[&_span.inline-flex]:hidden'

export const DASHBOARD_LABEL = `The StockPulse dashboard for the demo store on ${SNAPSHOT_LABEL}: ${TOTALS.products} products, ${TOTALS.liveLots} stock lots, ${TOTALS.lowStock} items at or below their reorder level, and ${TOTALS.expiringSoonLots} lots expiring within ${WARNING_DAYS} days with ${TOTALS.expiredLots} already expired.`

export const INVENTORY_LABEL = `The StockPulse inventory screen for the demo store: products with their stock, reorder threshold and next expiry date, including ${INVENTORY_ROWS.filter((r) => r.stock <= r.threshold).length} items marked low.`

/* ───────────── screens ───────────── */

export function StatRow({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${compact ? '' : 'xl:grid-cols-4'}`}>
      <StatCard label="Products" value={TOTALS.products} icon={Archive} className={STAT_FIT} />
      <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={STAT_FIT} />
      <StatCard label="Low Stock Items" value={TOTALS.lowStock} icon={AlertTriangle} className={STAT_FIT} />
      <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={STAT_FIT} />
    </div>
  )
}

export function DashboardScreen() {
  return (
    <>
      <div className="mb-4">
        <ScreenTitle title="Dashboard" />
      </div>
      <StatRow />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <LowStockCard />
        <ExpiringCard />
      </div>
    </>
  )
}

export function LowStockCard({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
      <CardBody>
        <ul className="divide-y divide-[#F1EBE0]">
          {LOW_STOCK.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#14100c]">{p.name}</span>
                <span className="text-[12px] capitalize text-[#6b6157]">{p.category}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-[13px] tabular-nums text-[#4a4139]">
                  {p.stock} <span className="text-[#6b6157]">/ {p.threshold}</span>
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

export function ExpiringCard({ className = '', limit = 4 }: { className?: string; limit?: number }) {
  return (
    <Card className={className}>
      <CardHeader title="Expiring Soon" subtitle={`${TOTALS.expiredLots} lots already expired`} />
      <CardBody>
        <ul className="divide-y divide-[#F1EBE0]">
          {EXPIRING.slice(0, limit).map((e) => {
            const expired = e.expiry < SNAPSHOT_DATE
            return (
              <li key={e.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#14100c]">
                    {e.name} <span className="font-normal text-[#6b6157]">· {e.quantity} units</span>
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

export function InventoryScreen({ rows = INVENTORY_ROWS.length }: { rows?: number }) {
  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <ScreenTitle title="Inventory" sub={`${TOTALS.products} products · ${TOTALS.liveLots} lots`} />
        <span className="hidden items-center gap-1.5 rounded-lg bg-[#14100c] px-3 py-1.5 text-[11.5px] font-semibold text-white sm:inline-flex">
          <ScanBarcode className="h-3.5 w-3.5" /> Scan
        </span>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#F1EBE0] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b6157]">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Stock</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Next expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1EBE0]">
            {INVENTORY_ROWS.slice(0, rows).map((r) => {
              const low = r.stock <= r.threshold
              const live = r.lots.filter((l) => l.q > 0).length
              return (
                <tr key={r.name}>
                  <td className="px-4 py-2.5">
                    <span className="block text-[13px] font-semibold text-[#14100c]">{r.name}</span>
                    <span className="block md:hidden">
                      <ExpiryTag date={nextExpiry(r.lots)} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} lots={live} />
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-[12.5px] text-[#4a4139] sm:table-cell">{r.category}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-[13px] font-semibold tabular-nums text-[#14100c]">{r.stock}</span>
                      <Badge tone={low ? 'warning' : 'success'} className="whitespace-nowrap">
                        {low ? 'Low' : 'OK'}
                      </Badge>
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 md:table-cell">
                    <ExpiryTag date={nextExpiry(r.lots)} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} lots={live} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </>
  )
}

/** One product's delivery lots — the real two-lot demo record. */
export function LotsCard({ className = '' }: { className?: string }) {
  const r = INVENTORY_ROWS[0]
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[#14100c]">{r.name}</p>
          <p className="text-[12px] text-[#6b6157]">
            {r.stock} in stock · {r.lots.length} delivery lots
          </p>
        </div>
        <Badge tone="success">OK</Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {r.lots.map((l, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-xl bg-[#fbfaf8] px-3 py-2.5 text-[12.5px] text-[#4a4139]"
          >
            <span>
              Lot {i + 1} · received {fmtShort(l.rec)}
            </span>
            <span className="font-semibold tabular-nums text-[#14100c]">{l.q} units</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** The earliest-expiry-first sale verified in production QA (step 6b). */
export function FefoCard({ className = '' }: { className?: string }) {
  const lots = [
    { exp: '15 Sep 2026', before: 2, after: 0 },
    { exp: '26 Sep 2026', before: 35, after: 33 },
  ]
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6157]">Sale · 4 units</p>
      <p className="mt-1 text-[14px] font-semibold text-[#14100c]">Spiced Buttermilk 200ml</p>
      <ul className="mt-4 space-y-2.5">
        {lots.map((l, i) => (
          <li key={l.exp} className="rounded-xl border border-[#F1EBE0] bg-white p-3">
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="text-[#4a4139]">
                Lot expiring <span className="font-semibold text-[#14100c]">{l.exp}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[#4a4139]">
                {l.before} → <span className="font-semibold text-[#14100c]">{l.after}</span>
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-[#6b6157]">{i === 0 ? 'Taken first — expires sooner' : 'Remainder taken next'}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** The cashier's offline flow, in the app's own words. */
export function OfflineCard({ className = '' }: { className?: string }) {
  const steps = [
    { icon: CloudOff, state: 'No connection', text: 'Saved on this device', tone: 'neutral' as const },
    { icon: Clock, state: 'Waiting to sync', text: OFFLINE_UI.pending, tone: 'warning' as const },
    { icon: RefreshCw, state: 'Back online', text: OFFLINE_UI.synced, tone: 'success' as const },
  ]
  return (
    <Card className={`p-5 ${className}`}>
      <ol className="space-y-3">
        {steps.map(({ icon: Icon, state, text, tone }) => (
          <li key={state} className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f4f2ee] text-[#4a4139]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b6157]">{state}</span>
              <Badge tone={tone} className="mt-0.5">
                {text}
              </Badge>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** Styled after the app's SalesTrendChart: grey bars, the largest in near-black. */
export function CategoryBars({ className = '' }: { className?: string }) {
  const max = Math.max(...BY_CATEGORY.map((c) => c.value))
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-[#14100c]">Products by category</p>
      <p className="text-[12px] text-[#6b6157]">
        {TOTALS.products} products · {SNAPSHOT_LABEL}
      </p>
      <div className="mt-4 flex h-36 items-end gap-2 sm:gap-4">
        {BY_CATEGORY.map((c) => (
          <div key={c.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11.5px] font-semibold tabular-nums text-[#4a4139]">{c.value}</span>
            <span
              className={`w-full max-w-14 rounded-t-[4px] ${c.value === max ? 'bg-[#18181b]' : 'bg-[#d4d4d8]'}`}
              style={{ height: `${(c.value / max) * 76}%` }}
            />
            {/* 10px below sm: at 375px a column is ~55px and "Household" needs ~54px at 11px. */}
            <span className="max-w-full truncate text-[10px] text-[#6b6157] sm:text-[11px]">{c.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function StockHealthCard({ className = '' }: { className?: string }) {
  const ok = TOTALS.liveLots - TOTALS.expiredLots - TOTALS.expiringSoonLots
  const segs = [
    { label: 'Fine', v: ok, c: 'bg-[#d4d4d8]' },
    { label: 'Expiring soon', v: TOTALS.expiringSoonLots, c: 'bg-[#c9a227]' },
    { label: 'Expired', v: TOTALS.expiredLots, c: 'bg-[#8f2a1c]' },
  ]
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-[#14100c]">Stock health</p>
      <p className="text-[12px] text-[#6b6157]">
        {TOTALS.liveLots} lots in stock · {SNAPSHOT_LABEL}
      </p>
      <div className="mt-4 flex h-3.5 overflow-hidden rounded-full bg-[#f4f2ee]">
        {segs.map((s) => (
          <span key={s.label} className={s.c} style={{ width: `${(s.v / TOTALS.liveLots) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#4a4139]">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.c}`} />
            {s.label} <span className="font-semibold tabular-nums">{s.v}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function SupplierStages({ className = '' }: { className?: string }) {
  const stages = ['Ordered', 'Shipped', 'In transit', 'At dock']
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-[#14100c]">Purchase order stages</p>
      <ol className="mt-5 flex items-start justify-between">
        {stages.map((s, i) => (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className="absolute right-1/2 top-[7px] h-0.5 w-full bg-[#E3D7C1]" />}
            <span className="relative h-4 w-4 rounded-full border-2 border-[#c9a227] bg-white" />
            <span className="mt-2 text-[11.5px] font-medium text-[#4a4139]">{s}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function RolesCard({ className = '' }: { className?: string }) {
  const roles = [
    { role: 'Owner', can: 'Everything, incl. settings and audit log' },
    { role: 'Manager', can: 'Stock, suppliers, customers, reports' },
    { role: 'Staff', can: 'Sales, scanning and shifts' },
  ]
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-[#14100c]">Roles</p>
      <ul className="mt-2 divide-y divide-[#F1EBE0]">
        {roles.map((r) => (
          <li key={r.role} className="flex items-center justify-between gap-4 py-2.5">
            <Badge tone={r.role === 'Owner' ? 'warning' : 'neutral'}>{r.role}</Badge>
            <span className="text-right text-[12.5px] text-[#4a4139]">{r.can}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
