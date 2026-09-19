import { AlertTriangle, Archive, CalendarClock, Clock, CloudOff, Layers, RefreshCw, ScanBarcode } from 'lucide-react'
import { navItemsFor } from '@/lib/nav'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import {
  BY_CATEGORY,
  EXPIRING,
  FEFO_SALE,
  INVENTORY,
  LOW_STOCK,
  OFFLINE_UI,
  SNAPSHOT_DATE,
  SNAPSHOT_LABEL,
  TOTALS,
  WARNING_DAYS,
} from './snapshot'

/**
 * Product screens for the landing page.
 *
 * Built from the app's OWN components — StatCard, Card, Badge, ExpiryTag (with
 * the app's real expiry-tone logic) and the sidebar's navItemsFor() — filled
 * with the real demo-store snapshot in ./snapshot.ts. Nothing here is a
 * screenshot and no figure is invented.
 *
 * Colour: those components read the app's theme tokens. LANDING_TOKENS sets
 * them on the landing page's wrapper only, so the product renders in the
 * page's blue / purple / white palette (and stays light even when the
 * visitor's system is dark — the app puts `.dark` on <html>). The dashboard
 * itself, and every shared component, is untouched.
 */

export const LANDING_TOKENS = {
  '--background': '#F8FAFC',
  '--surface': '#FFFFFF',
  '--surface-muted': '#F1F5F9',
  '--raised': '#FFFFFF',
  '--overlay': '#FFFFFF',
  '--foreground': '#0F172A',
  '--muted-strong': '#475569',
  '--muted': '#64748B',
  '--border': '#E2E8F0',
  '--border-strong': '#CBD5E1',
  '--accent': '#4F46E5',
  '--accent-fill': '#2563EB',
  '--on-accent': '#FFFFFF',
  '--accent-hover': '#1D4ED8',
  '--accent-soft': '#EEF2FF',
  '--accent-ink': '#3730A3',
  '--success': '#15803D',
  '--success-bg': '#DCFCE7',
  '--success-ink': '#166534',
  '--danger': '#B91C1C',
  '--danger-bg': '#FEE2E2',
  '--warning': '#B45309',
  '--warning-bg': '#FEF3C7',
  '--info': '#475569',
  '--info-bg': '#F1F5F9',
} as React.CSSProperties

export { SNAPSHOT_LABEL, TOTALS }

const nextExpiry = (lots: ReadonlyArray<{ q: number; exp: string | null }>) =>
  lots.filter((l) => l.q > 0 && l.exp).map((l) => l.exp as string).sort()[0] ?? null

const fmtShort = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const DASHBOARD_LABEL = `The StockPulse dashboard for the demo store on ${SNAPSHOT_LABEL}: ${TOTALS.products} products, ${TOTALS.liveLots} stock lots, ${TOTALS.lowStock} items at or below their reorder level, and ${TOTALS.expiringSoonLots} lots expiring within ${WARNING_DAYS} days with ${TOTALS.expiredLots} already expired.`

export const INVENTORY_LABEL =
  'The StockPulse inventory screen for the demo store: products with their category, stock, and next expiry date, with low-stock items flagged.'

/* ───────────── app chrome ───────────── */

export function AppWindow({
  active = '/dashboard',
  sidebar = true,
  label,
  className = '',
  children,
}: {
  active?: string
  sidebar?: boolean
  /** Text alternative for the whole screen; the visual itself is hidden from assistive tech. */
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_30px_80px_-30px_rgba(37,99,235,0.28)] ${className}`}
    >
      <div aria-hidden="true" className="select-none">
        <div className="flex items-center gap-2 border-b border-[#EEF2F7] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
          <span className="ml-3 truncate text-[12px] font-medium text-[#64748B]">StockPulse Demo Store</span>
        </div>
        <div className="flex">
          {sidebar && (
            <aside className="hidden w-44 shrink-0 border-r border-[#EEF2F7] bg-[#FAFBFE] p-3 xl:block">
              <ul className="space-y-0.5">
                {navItemsFor('owner')
                  .slice(0, 9)
                  .map(({ href, label: l, icon: Icon }) => (
                    <li
                      key={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] ${
                        href === active ? 'bg-[#EEF2FF] font-semibold text-[#3730A3]' : 'text-[#64748B]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {l}
                    </li>
                  ))}
              </ul>
            </aside>
          )}
          <div className="min-w-0 flex-1 bg-[#F8FAFC] p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

function ScreenTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-[#64748B]">{sub ?? 'Saturday, 19 September'}</p>
      <p className="text-[17px] font-bold tracking-tight text-[#0F172A]">{title}</p>
    </div>
  )
}

/** StatCard's own className prop — the shared component is not edited. */
const STAT_FIT = 'p-4 sm:p-5 max-sm:[&_span.inline-flex]:hidden'

/* ───────────── screens ───────────── */

export function DashboardScreen() {
  return (
    <>
      <div className="mb-4">
        <ScreenTitle title="Dashboard" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 2xl:grid-cols-4">
        <StatCard label="Products" value={TOTALS.products} icon={Archive} className={STAT_FIT} />
        <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={STAT_FIT} />
        <StatCard label="Low Stock" value={TOTALS.lowStock} icon={AlertTriangle} className={STAT_FIT} />
        <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={STAT_FIT} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <LowStockCard />
        <ExpiringCard limit={3} />
      </div>
    </>
  )
}

export function LowStockCard({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
      <CardBody>
        <ul className="divide-y divide-[#EEF2F7]">
          {LOW_STOCK.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[#0F172A]">{p.name}</span>
                <span className="text-[12px] text-[#64748B]">{p.category}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-[13px] tabular-nums text-[#475569]">
                  {p.stock} <span className="text-[#64748B]">/ {p.threshold}</span>
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
        <ul className="divide-y divide-[#EEF2F7]">
          {EXPIRING.slice(0, limit).map((e) => {
            const expired = e.expiry < SNAPSHOT_DATE
            return (
              <li key={e.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
                    {e.name} <span className="font-normal text-[#64748B]">· {e.quantity} units</span>
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

export function InventoryScreen({ rows = INVENTORY.length }: { rows?: number }) {
  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <ScreenTitle title="Inventory" sub={`${TOTALS.products} products · ${TOTALS.liveLots} lots`} />
        <span className="hidden items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11.5px] font-semibold text-white sm:inline-flex">
          <ScanBarcode className="h-3.5 w-3.5" /> Scan
        </span>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#EEF2F7] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Stock</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Next expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {INVENTORY.slice(0, rows).map((r) => {
              const low = r.stock <= r.threshold
              const live = r.lots.filter((l) => l.q > 0).length
              return (
                <tr key={r.name}>
                  <td className="px-4 py-2.5">
                    <span className="block text-[13px] font-semibold text-[#0F172A]">{r.name}</span>
                    <span className="block md:hidden">
                      <ExpiryTag date={nextExpiry(r.lots)} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} lots={live} />
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-[12.5px] text-[#475569] sm:table-cell">{r.category}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-[13px] font-semibold tabular-nums text-[#0F172A]">{r.stock}</span>
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

/** One product's two delivery lots — a real demo record. */
export function LotsCard({ className = '' }: { className?: string }) {
  const r = INVENTORY[0]
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-[#0F172A]">{r.name}</p>
          <p className="text-[12px] text-[#64748B]">
            {r.stock} in stock · {r.lots.length} delivery lots
          </p>
        </div>
        <Badge tone="success">OK</Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {r.lots.map((l, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded-xl bg-[#F5F7FF] px-3 py-2.5 text-[12.5px] text-[#475569]"
          >
            <span>
              Lot {i + 1} · received {fmtShort(l.rec)}
            </span>
            <span className="font-semibold tabular-nums text-[#0F172A]">{l.q} units</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** The earliest-expiry-first sale verified in production QA. */
export function FefoCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D28D9]">
        Sale · {FEFO_SALE.units} units
      </p>
      <p className="mt-1 text-[14px] font-semibold text-[#0F172A]">{FEFO_SALE.product}</p>
      <ul className="mt-4 space-y-2.5">
        {FEFO_SALE.lots.map((l, i) => (
          <li key={l.exp} className="rounded-xl border border-[#EEF2F7] bg-white p-3">
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <span className="text-[#475569]">
                Lot expiring <span className="font-semibold text-[#0F172A]">{l.exp}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[#475569]">
                {l.before} → <span className="font-semibold text-[#0F172A]">{l.after}</span>
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-[#64748B]">{i === 0 ? 'Taken first — expires sooner' : 'Remainder taken next'}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** The cashier's offline flow, in the app's own words. */
export function OfflineCard({ className = '' }: { className?: string }) {
  const steps = [
    { icon: CloudOff, state: 'No connection', text: OFFLINE_UI.saved, tone: 'neutral' as const },
    { icon: Clock, state: 'Waiting to sync', text: OFFLINE_UI.pending, tone: 'warning' as const },
    { icon: RefreshCw, state: 'Back online', text: OFFLINE_UI.synced, tone: 'success' as const },
  ]
  return (
    <Card className={`p-5 ${className}`}>
      <ol className="space-y-3">
        {steps.map(({ icon: Icon, state, text, tone }) => (
          <li key={state} className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">{state}</span>
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

/** Products per category — the app's bar-chart style, in the landing palette. */
export function CategoryBars({ className = '', tall = false }: { className?: string; tall?: boolean }) {
  const max = Math.max(...BY_CATEGORY.map((c) => c.value))
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <p className="text-[14px] font-semibold text-[#0F172A]">Products by category</p>
      <p className="text-[12.5px] text-[#64748B]">
        {TOTALS.products} products · demo store · {SNAPSHOT_LABEL}
      </p>
      <div className={`mt-5 flex items-end gap-2 sm:gap-4 ${tall ? 'h-52' : 'h-36'}`}>
        {BY_CATEGORY.map((c) => (
          <div key={c.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[12px] font-semibold tabular-nums text-[#475569]">{c.value}</span>
            <span
              className={`w-full max-w-16 rounded-t-md ${
                c.value === max ? 'bg-gradient-to-t from-[#2563EB] to-[#7C3AED]' : 'bg-[#DBE4FF]'
              }`}
              style={{ height: `${(c.value / max) * 76}%` }}
            />
            {/* 10px below sm: at 375px a column is ~55px and "Household" needs ~54px at 11px. */}
            <span className="max-w-full truncate text-[10px] text-[#64748B] sm:text-[11.5px]">{c.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function StockHealthCard({ className = '' }: { className?: string }) {
  const ok = TOTALS.liveLots - TOTALS.expiredLots - TOTALS.expiringSoonLots
  const healthy = TOTALS.products - TOTALS.lowStock
  const lots = [
    { label: 'Fine', v: ok, c: 'bg-[#C7D2FE]' },
    { label: `Expiring within ${WARNING_DAYS} days`, v: TOTALS.expiringSoonLots, c: 'bg-[#F59E0B]' },
    { label: 'Expired', v: TOTALS.expiredLots, c: 'bg-[#DC2626]' },
  ]
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <p className="text-[14px] font-semibold text-[#0F172A]">Stock health</p>
      <p className="text-[12.5px] text-[#64748B]">Live lots and reorder levels · {SNAPSHOT_LABEL}</p>

      <p className="mt-5 text-[12.5px] font-medium text-[#475569]">{TOTALS.liveLots} lots in stock</p>
      <div className="mt-2 flex h-3.5 overflow-hidden rounded-full bg-[#F1F5F9]">
        {lots.map((s) => (
          <span key={s.label} className={s.c} style={{ width: `${(s.v / TOTALS.liveLots) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#475569]">
        {lots.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.c}`} />
            {s.label} <span className="font-semibold tabular-nums">{s.v}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[12.5px] font-medium text-[#475569]">{TOTALS.products} products</p>
      <div className="mt-2 flex h-3.5 overflow-hidden rounded-full bg-[#F1F5F9]">
        <span className="bg-[#C7D2FE]" style={{ width: `${(healthy / TOTALS.products) * 100}%` }} />
        <span className="bg-[#7C3AED]" style={{ width: `${(TOTALS.lowStock / TOTALS.products) * 100}%` }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#475569]">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#C7D2FE]" />
          Above reorder level <span className="font-semibold tabular-nums">{healthy}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
          At or below <span className="font-semibold tabular-nums">{TOTALS.lowStock}</span>
        </li>
      </ul>
    </Card>
  )
}

export function SupplierStages({ className = '' }: { className?: string }) {
  const stages = ['Ordered', 'Shipped', 'In transit', 'At dock']
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-[13px] font-semibold text-[#0F172A]">Purchase order stages</p>
      <ol className="mt-5 flex items-start justify-between">
        {stages.map((s, i) => (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className="absolute right-1/2 top-[7px] h-0.5 w-full bg-[#DBE4FF]" />}
            <span className="relative h-4 w-4 rounded-full border-2 border-[#2563EB] bg-white" />
            <span className="mt-2 text-[11.5px] font-medium text-[#475569]">{s}</span>
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
      <p className="text-[13px] font-semibold text-[#0F172A]">Roles</p>
      <ul className="mt-2 divide-y divide-[#EEF2F7]">
        {roles.map((r) => (
          <li key={r.role} className="flex items-center justify-between gap-4 py-2.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                r.role === 'Owner' ? 'bg-[#F3E8FF] text-[#6D28D9]' : 'bg-[#EEF2FF] text-[#3730A3]'
              }`}
            >
              {r.role}
            </span>
            <span className="text-right text-[12.5px] text-[#475569]">{r.can}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
