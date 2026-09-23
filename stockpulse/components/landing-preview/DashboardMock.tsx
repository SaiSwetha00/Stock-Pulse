import {
  Archive,
  FileText,
  LayoutGrid,
  MonitorCheck,
  Settings,
  TrendingUp,
  Truck,
  UserSquare2,
  Users,
} from 'lucide-react'

/**
 * A static, HTML-only picture of the real /dashboard — no screenshot, no
 * canvas, no client JS. The labels are the app's own (DashboardView.tsx:
 * "Today's Sales", "Transactions Today", "7-Day Revenue", "Low Stock Items",
 * "Expiring Soon", the Discount / Write off actions) and the sidebar is
 * lib/nav.ts's order, so what a visitor sees here is what they get after
 * "Explore Demo Store". The figures are sample data and say so.
 *
 * Themed entirely through CSS variables the concept sets on an ancestor
 * (--dm-*), so one component serves three visual languages.
 *
 * The whole frame is aria-hidden behind a <figure> with a text alternative:
 * a screen reader should hear what the picture shows, not forty table cells
 * of invented numbers read out as if they were content.
 */

const SIDEBAR = [
  { label: 'Dashboard', icon: LayoutGrid, active: true },
  { label: 'Inventory', icon: Archive },
  { label: 'Sales', icon: TrendingUp },
  { label: 'Reports', icon: FileText },
  { label: 'Customers', icon: Users },
  { label: 'Suppliers', icon: Truck },
  { label: 'Staff', icon: UserSquare2 },
  { label: 'Monitoring', icon: MonitorCheck },
  { label: 'Settings', icon: Settings },
]

const WEEK = [
  { d: 'Sun', v: 14.2 },
  { d: 'Mon', v: 12.8 },
  { d: 'Tue', v: 15.1 },
  { d: 'Wed', v: 13.4 },
  { d: 'Thu', v: 16.9 },
  { d: 'Fri', v: 21.6 },
  { d: 'Sat', v: 18.4 },
]

const LOW_STOCK = [
  { name: 'Toned Milk 1L', stock: 4, min: 12 },
  { name: 'Brown Bread 400g', stock: 3, min: 8 },
  { name: 'Basmati Rice 5kg', stock: 2, min: 5 },
  { name: 'Sunflower Oil 1L', stock: 5, min: 10 },
]

const EXPIRING = [
  { name: 'Paneer 200g', when: 'expired 2 days ago', qty: 4, expired: true },
  { name: 'Fresh Curd 400g', when: 'expires tomorrow', qty: 9, expired: false },
  { name: 'Spiced Buttermilk 200ml', when: 'expires in 3 days', qty: 12, expired: false },
]

export const DASHBOARD_ALT =
  'The StockPulse dashboard with sample data: today’s sales of ₹18,420 across 126 transactions, a seven-day revenue chart, six products below their low-stock threshold, and four expiring soon — one already expired.'

export default function DashboardMock({
  variant = 'compact',
  className = '',
}: {
  variant?: 'compact' | 'full'
  className?: string
}) {
  const full = variant === 'full'
  const max = Math.max(...WEEK.map((w) => w.v))

  return (
    <figure className={className}>
      <div
        role="img"
        aria-label={DASHBOARD_ALT}
        className="overflow-hidden rounded-[var(--dm-radius,14px)] border border-[var(--dm-border)] bg-[var(--dm-bg)] text-[var(--dm-ink)] shadow-[var(--dm-shadow,0_1px_2px_rgba(0,0,0,0.04))] select-none"
      >
        <div aria-hidden="true">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--dm-border)] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dm-dot,var(--dm-border))]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dm-dot,var(--dm-border))]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--dm-dot,var(--dm-border))]" />
            <span className="ml-3 truncate text-[11px] font-medium text-[var(--dm-muted)]">
              StockPulse · Demo Store
            </span>
          </div>

          <div className="flex">
            {full && (
              <aside className="hidden w-48 shrink-0 border-r border-[var(--dm-border)] bg-[var(--dm-side,var(--dm-bg))] p-3 lg:block">
                <ul className="space-y-0.5">
                  {SIDEBAR.map(({ label, icon: Icon, active }) => (
                    <li
                      key={label}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] ${
                        active
                          ? 'bg-[var(--dm-accent-soft)] font-semibold text-[var(--dm-accent-strong,var(--dm-ink))]'
                          : 'text-[var(--dm-muted)]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      {label}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="min-w-0 flex-1 bg-[var(--dm-canvas,var(--dm-bg))] p-4 sm:p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-[var(--dm-muted)]">Saturday, 19 September</p>
                  <p className="text-[15px] font-semibold tracking-tight">Dashboard</p>
                </div>
                <span className="rounded-full bg-[var(--dm-accent)] px-3 py-1.5 text-[11px] font-semibold text-[var(--dm-accent-ink)]">
                  Log Sale
                </span>
              </div>

              {/* KPI tiles — the dashboard's own labels */}
              <div className={`grid gap-2.5 ${full ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
                <Kpi label="Today’s Sales" value="₹18,420" note="+12% vs yesterday" noteTone="up" wide={full} />
                <Kpi label="Transactions Today" value="126" note="Avg ₹146" />
                {full && <Kpi label="7-Day Revenue" value="₹1,12,380" note="Last 7 days" />}
                <Kpi label="Low Stock Items" value="6" note="Below threshold" noteTone="warn" />
                <Kpi label="Expiring Soon" value="4" note="1 already expired" noteTone="danger" />
              </div>

              <div className={`mt-2.5 grid gap-2.5 ${full ? 'md:grid-cols-[1.35fr_1fr]' : 'sm:grid-cols-[1.2fr_1fr]'}`}>
                {/* 7-day revenue */}
                <div className="rounded-[10px] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-semibold">Sales trend</p>
                    <p className="text-[10.5px] text-[var(--dm-muted)]">₹ thousands · last 7 days</p>
                  </div>
                  <div className="mt-3 flex h-28 items-end gap-2 sm:h-32">
                    {WEEK.map((w, i) => (
                      <div key={w.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <div
                          className={`w-full rounded-t-[4px] ${
                            i === WEEK.length - 1 ? 'bg-[var(--dm-accent)]' : 'bg-[var(--dm-bar,var(--dm-accent-soft))]'
                          }`}
                          style={{ height: `${Math.round((w.v / max) * 82)}%` }}
                        />
                        <span className="text-[9.5px] text-[var(--dm-muted)]">{w.d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expiring Soon — expired first, as the real panel orders it */}
                <div className="rounded-[10px] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-3.5">
                  <p className="text-[12px] font-semibold">Expiring Soon</p>
                  <ul className="mt-2.5 divide-y divide-[var(--dm-border)]">
                    {EXPIRING.map((e) => (
                      <li key={e.name} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-medium">{e.name}</p>
                          <p
                            className={`flex items-center gap-1.5 text-[10.5px] font-medium ${
                              e.expired ? 'text-[var(--dm-danger)]' : 'text-[var(--dm-warn)]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                e.expired ? 'bg-[var(--dm-danger)]' : 'bg-[var(--dm-warn)]'
                              }`}
                            />
                            {e.when} · {e.qty} units
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-[var(--dm-border)] px-2 py-1 text-[10px] font-semibold text-[var(--dm-muted)]">
                          {e.expired ? 'Write off' : 'Discount'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {full && (
                <div className="mt-2.5 hidden rounded-[10px] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-3.5 sm:block">
                  <p className="text-[12px] font-semibold">Low Stock Alerts</p>
                  <table className="mt-2 w-full text-left text-[11.5px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-[var(--dm-muted)]">
                        <th className="py-1.5 font-semibold">Product</th>
                        <th className="py-1.5 font-semibold">In stock</th>
                        <th className="py-1.5 font-semibold">Threshold</th>
                        <th className="py-1.5 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--dm-border)]">
                      {LOW_STOCK.map((p) => (
                        <tr key={p.name}>
                          <td className="py-2 font-medium">{p.name}</td>
                          <td className="py-2 tabular-nums">{p.stock}</td>
                          <td className="py-2 tabular-nums text-[var(--dm-muted)]">{p.min}</td>
                          <td className="py-2 text-right">
                            <span className="rounded-full bg-[var(--dm-warn-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--dm-warn)]">
                              Reorder
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-2.5 text-center text-[11px] text-[var(--dm-caption,var(--dm-muted))]">
        Sample data — the demo store shows the real thing.
      </figcaption>
    </figure>
  )
}

function Kpi({
  label,
  value,
  note,
  noteTone,
  wide = false,
}: {
  label: string
  value: string
  note: string
  noteTone?: 'up' | 'warn' | 'danger'
  wide?: boolean
}) {
  const tone =
    noteTone === 'up'
      ? 'text-[var(--dm-up,var(--dm-ink))]'
      : noteTone === 'warn'
        ? 'text-[var(--dm-warn)]'
        : noteTone === 'danger'
          ? 'text-[var(--dm-danger)]'
          : 'text-[var(--dm-muted)]'
  return (
    <div
      className={`rounded-[10px] border border-[var(--dm-border)] bg-[var(--dm-surface)] p-3 ${
        wide ? 'col-span-2 md:col-span-1' : ''
      }`}
    >
      <p className="text-[10.5px] font-medium text-[var(--dm-muted)]">{label}</p>
      <p className="mt-1 text-[19px] font-semibold tracking-tight tabular-nums">{value}</p>
      <p className={`mt-0.5 text-[10px] font-medium ${tone}`}>{note}</p>
    </div>
  )
}
