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
  FileText,
  CalendarClock,
  CalendarX,
  type LucideIcon,
} from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/format'
import type { Product, Sale } from '@/types'
import type { ExpiringProduct, ExpiringStock } from '@/lib/expiringStock'
import { expiryRelative, formatExpiry } from '@/lib/expiry'
import { categoryLabel } from '@/lib/categories'
import SalesTrendChart from '@/components/dashboard/SalesTrendChartLazy'
import AutoRefresh from '@/components/dashboard/AutoRefresh'
import { LocalDate, RelativeTime } from '@/components/ui/LocalTime'
import Greeting from '@/components/dashboard/Greeting'
import ProductThumb from '@/components/ui/ProductThumb'
import CountUp from '@/components/ui/CountUp'

export interface DashboardAlert {
  id: string
  kind: 'stock' | 'expired' | 'expiring' | 'device' | 'delivery'
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
// Secondary tier. sp-lift so hover raises exactly one rung (e1 -> e2).
const STAT_CARD = 'sp-rise sp-lift sp-e1 rounded-2xl p-4 lg:p-5'
/** The hero. Wider (2 of 5 columns from xl) and more generously padded. */
const STAT_CARD_HERO = 'sp-rise sp-lift sp-e1 sp-accent-edge rounded-2xl p-5 lg:p-6 col-span-2'
const STAT_ICON = 'flex h-10 w-10 items-center justify-center rounded-lg'
const STAT_LABEL = 'sp-kpi-label mt-4'
const STAT_VALUE = 'sp-kpi mt-2'
const STAT_VALUE_HERO = 'sp-kpi sp-kpi-hero mt-2'
const STAT_FOOT = 'sp-kpi-caption mt-2'

const ALERT_STYLES = {
  stock: {
    border: 'border-l-4 border-danger',
    iconWrap: 'rounded-lg bg-danger-bg',
    icon: 'text-danger',
    Icon: AlertTriangle,
    href: '/inventory',
  },
  // Two entries, not one with a flag, because the two states are not degrees
  // of the same thing. `expired` is loss that has already happened and takes
  // the danger treatment the low-stock alert takes. `expiring` is stock that
  // can still be sold, so it takes the warning tokens — a softer border, an
  // amber icon field, and a calendar rather than a warning triangle. Giving
  // both the triangle would make the one that still has a remedy look like
  // the one that does not.
  expired: {
    border: 'border-l-4 border-danger',
    iconWrap: 'rounded-lg bg-danger-bg',
    icon: 'text-danger',
    Icon: CalendarX,
    href: '/inventory',
  },
  expiring: {
    border: 'border-l-4 border-warning',
    iconWrap: 'rounded-lg bg-warning-bg',
    icon: 'text-warning',
    Icon: CalendarClock,
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
    iconWrap: 'rounded-full bg-success',
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
    span: '',
  },
]

/**
 * The week's revenue shape, as one inline SVG path.
 *
 * Deliberately not the charting library the panel below uses: this is seven
 * numbers at 96x32, where recharts would mount a responsive container and a
 * whole render tree to draw one polyline. No dependency, no canvas, ~30 lines.
 *
 * `preserveAspectRatio="none"` lets it stretch to whatever width the hero's
 * right column has without needing to be measured.
 */
function Sparkline({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return null
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  // A week of zeroes draws a flat line along the baseline, which on screen
  // reads as a stray horizontal rule floating in the card rather than as "no
  // takings". Seen in a 1440px screenshot. Render nothing instead — the
  // "0 sales today" caption beneath already says it.
  if (max === 0) return null
  const span = max
  const step = 100 / (data.length - 1)
  const points = values.map((v, i) => `${i * step},${32 - (v / span) * 28}`).join(' ')

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="h-8 w-full max-w-[180px]"
      role="img"
      aria-label={`Revenue for the last ${data.length} days`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Reports lives in the sidebar, which is `hidden lg:flex`, and the mobile tab
 * bar has four fixed slots. Without this entry an owner on a phone has no
 * route to it at all.
 *
 * Was two entries; /analytics was retired into /reports, so the second would
 * now be a dead link. It takes the full row on a two-column phone grid rather
 * than sitting alone beside a gap.
 */
const OWNER_QUICK_ACTIONS: QuickAction[] = [
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
  greeting,
  fullName,
  nowIso,
  todayTotal,
  todayCount,
  pendingCount,
  counterCount,
  changePct,
  weekTotal,
  weekCount,
  trendData,
  recentSales,
  lowStockItems,
  expiring,
  expiryWarningDays,
  today,
  categoryLabels,
  alerts,
}: {
  isOwner: boolean
  /** Resolved on the shop's clock by `storeGreeting()`, so the heading is
   *  final at first paint. See the note in Greeting.tsx. */
  greeting: string
  fullName: string
  nowIso: string
  todayTotal: number
  todayCount: number
  pendingCount: number
  /** Total configured checkout counters. */
  counterCount: number
  changePct: number | null
  weekTotal: number
  weekCount: number
  trendData: { label: string; value: number }[]
  recentSales: Sale[]
  lowStockItems: Product[]
  /** Already bucketed and urgency-ordered by getExpiringStock. */
  expiring: ExpiringStock
  /** This store's window, for the copy that has to name it. */
  expiryWarningDays: number
  /** The shop's calendar date, from the server — see lib/expiry.ts. */
  today: string
  /** slug -> display name, from the store's own categories. */
  categoryLabels: Record<string, string>
  alerts: DashboardAlert[]
}) {
  // Expired first, then expiring — the list is read top-down and loss that has
  // already happened outranks loss that can still be prevented. Capped at six
  // exactly as the Low Stock table is: a dashboard panel is a prompt to go and
  // look, not the inventory screen.
  const expiringRows: ExpiringProduct[] = [...expiring.expired, ...expiring.soon].slice(0, 6)

  return (
    <div className="sp-page">
      {/* The greeting replaces the old eyebrow + "Dashboard Overview" title.
          A page titled after itself tells you nothing the sidebar did not
          already say; a greeting that names what needs attention does. */}
      <Greeting
        greeting={greeting}
        fullName={fullName}
        lowStockCount={lowStockItems.length}
        pendingCount={pendingCount}
        counterCount={counterCount}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* The server's calendar day is not necessarily the viewer's. */}
        <p className="sp-eyebrow">
          <LocalDate iso={nowIso} withYear />
        </p>
        <AutoRefresh />
      </div>

      {/* ---- Metrics ---- */}
      {/* Six columns at xl, not five: the hero still takes two, and Low Stock
          and Expiring Soon are now a pair. Below xl they are one column each
          rather than the full-width tile Low Stock used to be, so the two
          action figures land on the same row on a phone instead of stacking
          with the week's revenue between them. */}
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-6">
        {/* One card shell for all four tiles.

            These were three different cards — white, solid black, and a pink
            one — which read as three unrelated components sitting in a row.
            The signal each carried now lives in its icon square, so the tiles
            stay distinguishable at a glance without the surfaces fighting
            each other. */}
        {/* Gold on exactly one card, and it is this one.

            `sp-accent-edge` is the only decorative use of the accent in the
            app. Today's takings is the figure a shopkeeper opens this page
            for, so it is the one that earns the hairline. Putting it on all
            four would make it mean nothing. */}
        {/* Two columns inside the hero. Measured at 1536px the numeral sat in
            a 525px box and left ~300px of nothing to its right; a wide card
            with a void in it is worse than the equal grid it replaced. The
            right column carries the week's shape and today's volume, which is
            the context someone reads a takings figure against. */}
        <div className={`${STAT_CARD_HERO} sp-delay-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4`}>
          <div className="min-w-0">
            <div className={`${STAT_ICON} bg-accent-soft`}>
              <Wallet className="h-5 w-5 text-accent-ink" aria-hidden="true" />
            </div>
            <p className={STAT_LABEL}>{isOwner ? "Today's Sales" : "Today's Total"}</p>
            <p className={STAT_VALUE_HERO}>
              <CountUp value={todayTotal} format="currency" />
            </p>
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

          <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
            <Sparkline data={trendData} />
            <p className="sp-kpi-caption text-right">
              <span className="font-semibold text-foreground">{todayCount}</span>{' '}
              {todayCount === 1 ? 'sale' : 'sales'} today
            </p>
          </div>
        </div>

        <div className={`${STAT_CARD} sp-delay-2`}>
          <div className={`${STAT_ICON} bg-accent-soft`}>
            <ShoppingBag className="h-5 w-5 text-accent-ink" aria-hidden="true" />
          </div>
          <p className={STAT_LABEL}>Transactions Today</p>
          <p className={STAT_VALUE}>
            <CountUp value={todayCount} />{' '}
            <span className="text-base font-normal text-muted">logged</span>
          </p>
          {/* Came from the mobile "Order Volume" card, which was the only
              place the occupied-checkout count surfaced. */}
          {/* "pending" implied queued work sitting unattended. This counts
              counters that are not free. With none configured the line is
              dropped rather than rendering "0 of 0". */}
          {counterCount > 0 && (
            <p className={STAT_FOOT}>
              {pendingCount} of {counterCount} counters busy
            </p>
          )}
        </div>

        <div className={`${STAT_CARD} sp-delay-3`}>
          <div className={`${STAT_ICON} bg-surface-muted`}>
            <TrendingUp className="h-5 w-5 text-muted-strong" aria-hidden="true" />
          </div>
          <p className={STAT_LABEL}>7-Day Revenue</p>
          <p className={STAT_VALUE}>
            <CountUp value={weekTotal} format="currency" />
          </p>
          <p className={STAT_FOOT}>
            {weekCount} transaction{weekCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* The only clickable tile, so it is the only one that lifts on
            hover. `sp-lift` is the shared affordance: shadow-sm to shadow-md
            plus 2px of travel, and a press state that also fires on touch,
            where there is no hover to rely on. */}
        <Link href="/inventory" className={`${STAT_CARD} sp-delay-4`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`${STAT_ICON} bg-danger-bg`}>
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-danger">View all</span>
          </div>
          <p className={STAT_LABEL}>Low Stock Items</p>
          {/* The number keeps the danger colour: it is the one figure here
              that means someone has to act. */}
          {/* Deep red only when there is something to act on. Zero items low
              on stock is the good outcome, and colouring it as an alert made
              an empty store look like a failing one. */}
          <p className={`${STAT_VALUE} ${lowStockItems.length > 0 ? 'sp-kpi-alert' : ''}`}>
            <CountUp value={lowStockItems.length} />
          </p>
        </Link>

        {/* Beside Low Stock, deliberately. These are the two "go and do
            something about it" figures on the page, and a shopkeeper reads
            them as a pair in the morning. Today's takings keeps the hero and
            the only gold hairline; nothing here competes with it. */}
        <Link href="/inventory" className={`${STAT_CARD} sp-delay-5`}>
          <div className="flex items-center justify-between gap-2">
            <div className={`${STAT_ICON} bg-warning-bg`}>
              <CalendarClock className="h-5 w-5 text-warning" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-warning">View all</span>
          </div>
          <p className={STAT_LABEL}>Expiring Soon</p>
          {/* Amber, not red, and only when there is something in it — the same
              rule the tile above learned. Zero expiring is a good outcome and
              a coloured zero would make a well-run shop look like a failing
              one. Expiring stock is also not the same problem as expired
              stock: this can still be sold, so it warns rather than alarms. */}
          <p
            className={`${STAT_VALUE} ${expiring.soon.length > 0 ? 'sp-kpi-warning' : ''}`}
          >
            <CountUp value={expiring.soon.length} />
          </p>
          {/* Deep red, and only when it exists. Already-expired stock is loss
              that has happened, so it reads in the alert colour rather than
              the warning one — and a shop with none of it is shown no red at
              all rather than a reassuring "0 expired". */}
          {expiring.expired.length > 0 ? (
            <p className={`${STAT_FOOT} font-semibold text-danger`}>
              {expiring.expired.length} already expired
            </p>
          ) : (
            <p className={STAT_FOOT}>
              within {expiryWarningDays} day{expiryWarningDays === 1 ? '' : 's'}
            </p>
          )}
        </Link>
      </div>

      {/* ---- Quick actions ---- */}
      <h2 className="sp-heading mt-8">Quick Actions</h2>
      <div className="sp-qa-grid mt-4">
        {(isOwner ? [...QUICK_ACTIONS, ...OWNER_QUICK_ACTIONS] : QUICK_ACTIONS).map((action, i) => {
          const Icon = action.Icon
          return (
            <Link
              key={action.label}
              href={action.href}
              // Staggered by position, capped at the sixth step: past ~250ms
              // the last tile reads as late rather than sequenced, and the
              // owner variant of this row is six tiles exactly.
              className={`sp-qa sp-rise sp-delay-${Math.min(i + 1, 6)} ${action.span}`}
            >
              <span className={`sp-qa-icon ${action.wrap}`}>
                <Icon className={`h-4 w-4 ${action.icon}`} aria-hidden="true" />
              </span>
              <span className="truncate text-sm font-semibold text-foreground">{action.label}</span>
            </Link>
          )
        })}
      </div>

      {/* ---- Trend + recent sales ---- */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="sp-heading">Daily Sales Trends</h2>
          {/* A chart of seven zeroes is a flat line along the axis, which reads
              as a broken panel rather than as an empty store. Say it instead. */}
          {trendData.every((d) => d.value === 0) ? (
            <EmptyState
              icon={TrendingUp}
              title="No sales this week"
              description="Once you log sales, the last seven days appear here as a trend."
              className="py-10"
              action={
                <Link
                  href="/sales"
                  className="control-h inline-flex items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
                >
                  Log a sale
                </Link>
              }
            />
          ) : (
            <div className="mt-4">
              <SalesTrendChart data={trendData} />
            </div>
          )}
        </div>

        <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="sp-heading">Recent Sales</h2>
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
                className="rounded-xl border-l-4 border-success bg-surface-muted p-3.5"
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
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
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
        <h2 className="sp-heading">Recent Alerts</h2>
        {alerts.length > 0 && (
          <span className="shrink-0 rounded-lg bg-danger px-2.5 py-1 text-sm font-semibold text-surface">
            {alerts.length} New
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {alerts.length === 0 && (
          <div className="sp-rise rounded-2xl border border-border bg-surface-muted lg:col-span-2">
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
      <div className="mt-7 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-danger" />
          <h2 className="sp-heading">Low Stock Alerts</h2>
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
                    {/* Same thumbnail as the inventory table, so a line looks
                        the same wherever it appears. */}
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ProductThumb name={p.name} imageUrl={p.image_url} size={32} />
                      <span className="truncate">{p.name}</span>
                    </span>
                  </td>
                  <td className="mt-2 block lg:mt-0 lg:table-cell lg:py-3.5 lg:pr-4">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted-strong">
                      {categoryLabel(p.category, categoryLabels)}
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

      {/* ---- Expiring ---- */}
      {/* The Low Stock card above, with one column swapped. Same shell, same
          table-collapses-to-cards shape, same EmptyState, same sentence
          pattern for the empty copy — this is the other half of "what needs
          attention today", not a second system that happens to look similar. */}
      <div className="mt-7 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-warning" />
          <h2 className="sp-heading">Expiring Soon</h2>
        </div>

        {/* A failed read is said out loud. An empty table would read as
            "nothing is expiring", which is the one wrong answer this panel
            must never give silently. */}
        {expiring.error && (
          <p role="alert" className="mt-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            Expiry dates could not be read just now, so this list may be
            incomplete. Reload to try again.
          </p>
        )}

        <table className="sp-table mt-4 block w-full text-left text-sm lg:table">
          <thead className="hidden lg:table-header-group">
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="pb-3 pr-4 font-semibold">Item Name</th>
              <th className="pb-3 pr-4 font-semibold">Category</th>
              <th className="pb-3 pr-4 font-semibold">Expires</th>
              {isOwner && <th className="pb-3 font-semibold">Action</th>}
            </tr>
          </thead>
          <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
            {expiringRows.length === 0 && !expiring.error && (
              <tr className="block lg:table-row">
                <td colSpan={isOwner ? 4 : 3} className="block lg:table-cell">
                  <EmptyState
                    icon={PackageCheck}
                    title="Nothing is expiring soon"
                    description={`Items fall into this list once they come within ${expiryWarningDays} day${expiryWarningDays === 1 ? '' : 's'} of their expiry date.`}
                    className="py-8"
                  />
                </td>
              </tr>
            )}
            {expiringRows.map((p) => {
              const isExpired = p.expiry_date < today
              return (
                <tr
                  key={p.id}
                  className="block rounded-xl border border-border p-4 lg:table-row lg:rounded-none lg:border-0 lg:border-b lg:border-border lg:p-0 lg:last:border-0"
                >
                  <td className="block font-medium text-foreground lg:table-cell lg:py-3.5 lg:pr-4">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ProductThumb name={p.name} imageUrl={p.image_url} size={32} />
                      <span className="truncate">{p.name}</span>
                    </span>
                  </td>
                  <td className="mt-2 block lg:mt-0 lg:table-cell lg:py-3.5 lg:pr-4">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted-strong">
                      {categoryLabel(p.category, categoryLabels)}
                    </span>
                  </td>
                  <td className="mt-3 block lg:mt-0 lg:table-cell lg:py-3.5 lg:pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${isExpired ? 'bg-danger' : 'bg-warning'}`}
                      />
                      <span
                        className={`whitespace-nowrap text-sm font-semibold ${isExpired ? 'text-danger' : 'text-warning'}`}
                      >
                        {formatExpiry(p.expiry_date)}
                      </span>
                      {/* The date alone makes the reader do the subtraction.
                          "5 days ago" and "in 2 days" are the same fact said
                          the way the decision is actually made. */}
                      <span className="whitespace-nowrap text-xs text-muted">
                        {isExpired ? 'expired' : 'expires'} {expiryRelative(p.expiry_date, today)}
                        {' · '}
                        {p.quantity} unit{p.quantity === 1 ? '' : 's'}
                      </span>
                    </div>
                  </td>
                  {isOwner && (
                    <td className="mt-1 block lg:mt-0 lg:table-cell lg:py-3.5">
                      <Link
                        href="/inventory"
                        className="inline-flex control-h items-center text-sm font-semibold text-muted-strong hover:underline"
                      >
                        {isExpired ? 'Write off' : 'Discount'}
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
