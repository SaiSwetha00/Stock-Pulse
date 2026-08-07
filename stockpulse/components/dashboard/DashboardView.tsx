import Link from 'next/link'
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  MonitorCheck,
  Thermometer,
  Truck,
  ChevronRight,
  Receipt,
  BellOff,
  PackageCheck,
  ChartColumn,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/format'
import { CATEGORY_LABELS, type Product, type Sale } from '@/types'
import SalesTrendChart from '@/components/dashboard/SalesTrendChartLazy'
import AutoRefresh from '@/components/dashboard/AutoRefresh'
import { LocalDate, RelativeTime } from '@/components/ui/LocalTime'

export interface DashboardAlert {
  id: string
  kind: 'stock' | 'device' | 'delivery'
  title: string
  description: string
  /** Fallback label for alerts with no timestamp (e.g. "now"). */
  time: string
  /**
   * ISO-8601 UTC. When present the label is rendered client-side, because a
   * relative time computed on the server is relative to the server's clock.
   */
  timeIso?: string
}

/**
 * The stat tile system, in one place.
 *
 * Named constants rather than repeated class strings because the four tiles
 * drifting apart is exactly how this section got into three different card
 * styles. Anything that reads differently between tiles now has to be a
 * deliberate override at the call site.
 *
 * `rounded-2xl` is the codebase's card radius and resolves to 10px via the
 * scale in globals.css; the border is what stops a white card dissolving into
 * a near-white page background.
 */
const STAT_CARD = 'rounded-2xl border border-border bg-surface p-4 shadow-sm lg:p-6'
const STAT_ICON = 'flex h-10 w-10 items-center justify-center rounded-lg'
const STAT_LABEL = 'mt-4 text-xs font-semibold uppercase tracking-wide text-muted'
const STAT_VALUE = 'mt-1 text-2xl font-bold text-foreground lg:text-3xl'
const STAT_FOOT = 'mt-2 text-xs text-muted'

const ALERT_STYLES = {
  stock: {
    border: 'border-l-4 border-danger',
    iconWrap: 'rounded-lg bg-red-100',
    icon: 'text-danger',
    Icon: AlertTriangle,
    href: '/inventory',
  },
  device: {
    border: 'border-l-4 border-border',
    iconWrap: 'rounded-lg bg-surface-muted',
    icon: 'text-muted-strong',
    Icon: Thermometer,
    href: '/monitoring',
  },
  delivery: {
    border: '',
    iconWrap: 'rounded-full bg-emerald-600',
    icon: 'text-surface',
    Icon: Truck,
    href: '/suppliers',
  },
} as const

interface QuickAction {
  href: string
  label: string
  Icon: LucideIcon
  wrap: string
  icon: string
  span: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/sales',
    label: 'New Order',
    Icon: ShoppingCart,
    wrap: 'bg-accent-soft',
    icon: 'text-accent-ink',
    span: '',
  },
  {
    // Was "Scan Item", which linked to /inventory and promised barcode
    // scanning the app has never had. /monitoring is a real screen open to
    // both roles, and it is where the "N checkouts pending" figure on the
    // card above actually resolves.
    href: '/monitoring',
    label: 'Checkout Status',
    Icon: MonitorCheck,
    wrap: 'bg-surface-muted',
    icon: 'text-muted-strong',
    span: '',
  },
  {
    // Was "Log Waste", which linked to /inventory and promised waste
    // logging the app has never had — the same defect as the old
    // "Scan Item". Checking stock is what /inventory actually does.
    href: '/inventory',
    label: 'Check Stock',
    Icon: Archive,
    wrap: 'bg-surface-muted',
    icon: 'text-muted-strong',
    // Odd one out on a two-column phone grid, so it takes the full row
    // there and falls back into line once a third column exists.
    span: 'col-span-2 sm:col-span-1',
  },
]

/**
 * Analytics and Reports live in the sidebar, which is `hidden lg:flex`, and the
 * mobile tab bar has four fixed slots. Without these two entries an owner on a
 * phone has no route to either page at all.
 */
const OWNER_QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/analytics',
    label: 'Analytics',
    Icon: ChartColumn,
    wrap: 'bg-surface-muted',
    icon: 'text-muted-strong',
    span: '',
  },
  {
    href: '/reports',
    label: 'Reports',
    Icon: FileText,
    wrap: 'bg-surface-muted',
    icon: 'text-muted-strong',
    span: '',
  },
]

/**
 * One dashboard for every width. This replaces the previous pair — a
 * `MobileDashboard` under `lg:hidden` sitting next to a desktop tree under
 * `hidden lg:block` — which rendered two different sets of content into the
 * same page and let each drift from the other.
 *
 * Nothing is width-gated any more: the phone gains the metrics, trend chart,
 * recent sales and low-stock detail it could not previously reach, and the
 * desktop gains the quick actions and the station/delivery alert feed. Only
 * the *shape* changes across breakpoints.
 */
export default function DashboardView({
  isOwner,
  nowIso,
  todayTotal,
  todayCount,
  pendingCount,
  changePct,
  weekTotal,
  weekCount,
  trendData,
  recentSales,
  lowStockItems,
  alerts,
}: {
  isOwner: boolean
  nowIso: string
  todayTotal: number
  todayCount: number
  pendingCount: number
  changePct: number | null
  weekTotal: number
  weekCount: number
  trendData: { label: string; value: number }[]
  recentSales: Sale[]
  lowStockItems: Product[]
  alerts: DashboardAlert[]
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Dashboard Overview</h1>
          {/* The server's calendar day is not necessarily the viewer's. */}
          <p className="mt-1 text-sm text-muted">
            <LocalDate iso={nowIso} withYear />
          </p>
        </div>
        <AutoRefresh />
      </div>

      {/* ---- Metrics ---- */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* One card shell for all four tiles.

            These were three different cards — white, solid black, and a pink
            one — which read as three unrelated components sitting in a row.
            The signal each carried now lives in its icon square, so the tiles
            stay distinguishable at a glance without the surfaces fighting
            each other. */}
        <div className={STAT_CARD}>
          <div className={`${STAT_ICON} bg-surface-muted`}>
            <Wallet className="h-5 w-5 text-muted-strong" aria-hidden="true" />
          </div>
          <p className={STAT_LABEL}>{isOwner ? "Today's Sales" : "Today's Total"}</p>
          <p className={STAT_VALUE}>{formatCurrency(todayTotal)}</p>
          {/* changePct is null when yesterday had no sales — a percentage
              change from zero is not meaningful, so show nothing. */}
          {changePct !== null && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {changePct >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
              )}
              <span
                className={`text-xs font-semibold ${changePct >= 0 ? 'text-accent' : 'text-danger'}`}
              >
                {changePct >= 0 ? '+' : ''}
                {changePct.toFixed(1)}%
              </span>
              <span className="text-xs text-muted">vs yesterday</span>
            </div>
          )}
        </div>

        <div className={STAT_CARD}>
          <div className={`${STAT_ICON} bg-accent-soft`}>
            <ShoppingBag className="h-5 w-5 text-accent-ink" aria-hidden="true" />
          </div>
          <p className={STAT_LABEL}>Transactions Today</p>
          <p className={STAT_VALUE}>
            {todayCount} <span className="text-base font-normal text-muted">logged</span>
          </p>
          {/* Came from the mobile "Order Volume" card, which was the only
              place the occupied-checkout count surfaced. */}
          <p className={STAT_FOOT}>
            {pendingCount} checkout{pendingCount === 1 ? '' : 's'} pending
          </p>
        </div>

        <div className={STAT_CARD}>
          <div className={`${STAT_ICON} bg-surface-muted`}>
            <TrendingUp className="h-5 w-5 text-muted-strong" aria-hidden="true" />
          </div>
          <p className={STAT_LABEL}>7-Day Revenue</p>
          <p className={STAT_VALUE}>{formatCurrency(weekTotal)}</p>
          <p className={STAT_FOOT}>
            {weekCount} transaction{weekCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* The only clickable tile, so it is the only one that lifts on
            hover — shadow-sm to shadow-md, the affordance the brief asks
            clickable cards to carry. */}
        <Link href="/inventory" className={`${STAT_CARD} block transition-shadow duration-150 hover:shadow-md`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`${STAT_ICON} bg-danger-bg`}>
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-danger">View all</span>
          </div>
          <p className={STAT_LABEL}>Low Stock Items</p>
          {/* The number keeps the danger colour: it is the one figure here
              that means someone has to act. */}
          <p className={`${STAT_VALUE} text-danger`}>{lowStockItems.length}</p>
        </Link>
      </div>

      {/* ---- Quick actions ---- */}
      <h2 className="mt-7 text-lg font-bold text-foreground">Quick Actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {(isOwner ? [...QUICK_ACTIONS, ...OWNER_QUICK_ACTIONS] : QUICK_ACTIONS).map((action) => {
          const Icon = action.Icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface py-6 shadow-sm transition-shadow duration-150 hover:shadow-md active:brightness-[0.98] ${action.span}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${action.wrap}`}
              >
                <Icon className={`h-5 w-5 ${action.icon}`} />
              </span>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </Link>
          )
        })}
      </div>

      {/* ---- Trend + recent sales ---- */}
      <div className="mt-7 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-foreground">Daily Sales Trends</h2>
          <div className="mt-4">
            <SalesTrendChart data={trendData} />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground">Recent Sales</h2>
            {/* This list is capped by the query's limit(4) — labelling it
                "Total" reported the cap, not the store's sale count. */}
            <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-strong">
              Latest {recentSales.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {recentSales.length === 0 && (
              <EmptyState
                icon={Receipt}
                title="No sales logged yet"
                description="Sales appear here as your team logs them."
                className="py-8"
                action={
                  <Link
                    href="/sales"
                    className="inline-flex control-h items-center rounded-lg bg-surface-muted px-4 text-sm font-semibold text-muted-strong hover:bg-surface-muted"
                  >
                    Log a sale
                  </Link>
                }
              />
            )}
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-xl border-l-4 border-emerald-500 bg-surface-muted p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">
                    #{sale.id.slice(0, 6).toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(Number(sale.total))}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-strong">{sale.profiles?.full_name ?? 'Staff'}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Completed
                  </span>
                  <span className="text-xs text-muted">
                    <RelativeTime iso={sale.created_at} />
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/sales"
            className="mt-4 flex control-h items-center justify-center rounded-lg bg-surface-muted px-4 text-center text-sm font-semibold text-muted-strong hover:bg-surface-muted"
          >
            View Complete History
          </Link>
        </div>
      </div>

      {/* ---- Recent alerts ---- */}
      <div className="mt-7 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">Recent Alerts</h2>
        {alerts.length > 0 && (
          <span className="shrink-0 rounded-lg bg-danger px-2.5 py-1 text-sm font-semibold text-surface">
            {alerts.length} New
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {alerts.length === 0 && (
          <div className="rounded-2xl bg-surface-muted lg:col-span-2">
            <EmptyState
              icon={BellOff}
              title="No active alerts"
              description="Low stock, checkout issues, and arriving deliveries will show up here."
              className="py-10"
            />
          </div>
        )}
        {alerts.map((alert) => {
          const style = ALERT_STYLES[alert.kind]
          const Icon = style.Icon
          return (
            <Link
              key={alert.id}
              href={style.href}
              className={`flex items-start gap-3 overflow-hidden rounded-xl bg-surface-muted p-3.5 transition hover:bg-surface-muted ${style.border}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center ${style.iconWrap}`}
              >
                <Icon className={`h-4 w-4 ${style.icon}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-semibold text-foreground">{alert.title}</span>
                  <span className="shrink-0 text-sm text-muted">
                    {alert.timeIso ? <RelativeTime iso={alert.timeIso} /> : alert.time}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-strong">{alert.description}</span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
            </Link>
          )
        })}
      </div>

      {/* ---- Low stock ---- */}
      <div className="mt-7 rounded-2xl bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-danger" />
          <h2 className="text-lg font-bold text-foreground">Low Stock Alerts</h2>
        </div>

        {/* One table, two shapes: rows collapse into cards below `lg` instead
            of forcing a horizontal scroll on a phone. */}
        <table className="sp-table mt-4 block w-full text-left text-sm lg:table">
          <thead className="hidden lg:table-header-group">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="pb-3 pr-4 font-semibold">Item Name</th>
              <th className="pb-3 pr-4 font-semibold">Category</th>
              <th className="pb-3 pr-4 font-semibold">Stock Level</th>
              {isOwner && <th className="pb-3 font-semibold">Action</th>}
            </tr>
          </thead>
          <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
            {lowStockItems.length === 0 && (
              <tr className="block lg:table-row">
                <td colSpan={isOwner ? 4 : 3} className="block lg:table-cell">
                  <EmptyState
                    icon={PackageCheck}
                    title="All products are well stocked"
                    description="Items fall into this list once they drop to their low-stock threshold."
                    className="py-8"
                  />
                </td>
              </tr>
            )}
            {lowStockItems.slice(0, 6).map((p) => {
              const pct = p.low_stock_threshold
                ? Math.min(100, (p.stock / p.low_stock_threshold) * 100)
                : 0
              return (
                <tr
                  key={p.id}
                  className="block rounded-xl border border-border p-4 lg:table-row lg:rounded-none lg:border-0 lg:border-b lg:border-border lg:p-0 lg:last:border-0"
                >
                  <td className="block font-medium text-foreground lg:table-cell lg:py-3.5 lg:pr-4">
                    {p.name}
                  </td>
                  <td className="mt-2 block lg:mt-0 lg:table-cell lg:py-3.5 lg:pr-4">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted-strong">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                  </td>
                  <td className="mt-3 block lg:mt-0 lg:table-cell lg:py-3.5 lg:pr-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-danger"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-sm font-semibold text-danger">
                        {p.stock} left
                      </span>
                    </div>
                  </td>
                  {isOwner && (
                    <td className="mt-1 block lg:mt-0 lg:table-cell lg:py-3.5">
                      <Link
                        href="/inventory"
                        className="inline-flex control-h items-center text-sm font-semibold text-muted-strong hover:underline"
                      >
                        Restock
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
