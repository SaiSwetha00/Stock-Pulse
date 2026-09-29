import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canViewReports } from '@/lib/permissions'
import { dayLabels } from '@/lib/format'
import {
  REPORTING_TIMEZONE,
  reportingDate,
  shiftDays,
  storeGreeting,
  weekdayIndex,
} from '@/lib/reportingTimezone'
import { storeExpiryWarningDays } from '@/lib/expiry'
import { getExpiringStock } from '@/lib/expiringStock'
import type { Product, Sale } from '@/types'
import { categoryLabel, getStoreCategories, labelMap, localizeCategories } from '@/lib/categories'
import DashboardView, { type DashboardAlert } from '@/components/dashboard/DashboardView'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.dashboard
  return { title, description, robots: { index: false, follow: false } }
}

/** One row per day from public.sales_daily_totals (migration 0004). */
type DailyTotal = { day: string; total: number; sale_count: number }

export default async function DashboardPage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()
  const isOwner = canViewReports(profile.role)
  const copy = appCopy(await getLocale())
  const t = copy.dash
  // The axis reads the ROTA's day names rather than a second set of its own,
  // so Monday is the same word on the chart and on the schedule.
  const days7 = dayLabels(copy.staff)

  const now = new Date()
  const today = reportingDate(now)
  const weekStart = shiftDays(today, -6)

  // The window this store warns on. Read through the helper, never off the
  // property: `expiry_warning_days` is absent until 0017 is applied, and an
  // undefined here would become NaN in shiftDays and quietly report that
  // nothing is expiring — which looks exactly like good news.
  const warningDays = storeExpiryWarningDays(store)

  const [
    { data: lowStock },
    { data: recentSales },
    { data: daily },
    { data: stations },
    { data: recentShipments },
    expiring,
  ] = await Promise.all([
    // Was every product in the store, filtered down in Node. Each product
    // carries its own threshold, so the test is column-to-column — something
    // PostgREST's filter syntax cannot express, hence a function.
    supabase.rpc('low_stock_products'),
    supabase
      .from('sales')
      .select('*, profiles(full_name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(4),
    // Was seven days of sale rows fetched to derive four totals and one bar
    // per day. Postgres now returns exactly those seven rows.
    supabase.rpc('sales_daily_totals', {
      p_from: weekStart,
      p_to: today,
      p_tz: REPORTING_TIMEZONE,
    }),
    supabase
      .from('checkout_stations')
      .select('station_number, status, alert_type, updated_at')
      .eq('store_id', store.id)
      .order('station_number', { ascending: true }),
    supabase
      .from('shipments')
      .select('po_number, status, created_at, suppliers(name)')
      .eq('store_id', store.id)
      .eq('status', 'dock')
      .order('created_at', { ascending: false })
      .limit(1),
    // Same shape as low_stock_products above: one scoped call that comes back
    // already ordered urgency-first, so nothing here filters or sorts.
    getExpiringStock(supabase, store.id, today, warningDays),
  ])

  // Already ordered scarcest-first by the function.
  const lowStockItems = (lowStock ?? []) as Product[]

  // Zero-filled and oldest-first, so the last row is today and the one before
  // it is yesterday — no date matching needed on this side.
  const days = (daily ?? []) as DailyTotal[]
  const todayRow = days[days.length - 1]
  const yesterdayRow = days[days.length - 2]

  const todayTotal = Number(todayRow?.total ?? 0)
  const todayCount = Number(todayRow?.sale_count ?? 0)

  const trendData = days.map((d) => ({
    label: days7[weekdayIndex(d.day)],
    value: Number(d.total),
  }))

  // ---- Mobile dashboard data ----
  const yesterdayTotal = Number(yesterdayRow?.total ?? 0)
  const changePct =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null

  const occupiedStations = (stations ?? []).filter((s) => s.status !== 'available')

  const weekTotal = days.reduce((sum, d) => sum + Number(d.total), 0)
  const weekCount = days.reduce((sum, d) => sum + Number(d.sale_count), 0)

  // Category display names, for the low-stock table and the alert headline.
  // Read here rather than baked in, so a shop that renamed "Packaged Goods"
  // sees its own word on the dashboard too.
  const { categories } = await getStoreCategories(supabase, store.id)
  // Display labels: seeded defaults follow the language, shop-named ones do not.
  const categoryLabels = labelMap(localizeCategories(categories, copy.categoryNames))

  const alerts: DashboardAlert[] = []

  // Expired first: it is the more urgent of the two and the alert list is
  // read top-down. Deep red for loss that has already happened; the
  // expiring-soon entry is a warning and must not shout in the same voice.
  if (expiring.expired.length > 0) {
    alerts.push({
      id: 'expired',
      kind: 'expired',
      title: (expiring.expired.length === 1 ? t.aExpiredTitleOne : t.aExpiredTitleMany).replace(
        '{n}',
        String(expiring.expired.length),
      ),
      description:
        expiring.expired.length === 1
          ? t.aExpiredBodyOne.replace('{name}', expiring.expired[0].name)
          : (expiring.expired.length === 2 ? t.aExpiredBodyTwo : t.aExpiredBodyMany)
              .replace('{name}', expiring.expired[0].name)
              .replace('{n}', String(expiring.expired.length - 1)),
      time: t.timeNow,
    })
  }

  if (expiring.soon.length > 0) {
    alerts.push({
      id: 'expiring',
      kind: 'expiring',
      title: (warningDays === 1 ? t.aExpiringTitleOne : t.aExpiringTitleMany).replace(
        '{n}',
        String(warningDays),
      ),
      description: (expiring.soon.length === 1
        ? t.aExpiringBodyOne
        : t.aExpiringBodyMany
      ).replace('{n}', String(expiring.soon.length)),
      time: t.timeNow,
    })
  }

  if (lowStockItems.length > 0) {
    const topCategory = categoryLabel(lowStockItems[0].category, categoryLabels)
    alerts.push({
      id: 'low-stock',
      kind: 'stock',
      title: t.aLowStockTitle.replace('{category}', topCategory),
      description: (lowStockItems.length === 1
        ? t.aLowStockBodyOne
        : t.aLowStockBodyMany
      ).replace('{n}', String(lowStockItems.length)),
      time: t.timeNow,
    })
  }

  for (const station of (stations ?? []).filter((s) => s.alert_type)) {
    alerts.push({
      id: `station-${station.station_number}`,
      kind: 'device',
      title: t.aStationTitle.replace('{n}', String(station.station_number)),
      description: station.alert_type === 'weight_mismatch' ? t.aWeightMismatch : t.aAgeCheck,
      time: '',
      timeIso: station.updated_at,
    })
  }

  const dockedShipment = (recentShipments ?? [])[0] as unknown as
    | { po_number: string; created_at: string; suppliers?: { name: string } | { name: string }[] | null }
    | undefined
  if (dockedShipment) {
    const supplierRel = dockedShipment.suppliers
    const supplierName = Array.isArray(supplierRel) ? supplierRel[0]?.name : supplierRel?.name
    alerts.push({
      id: 'delivery',
      kind: 'delivery',
      title: t.aDeliveryTitle,
      description: t.aDeliveryBody.replace('{supplier}', supplierName ?? t.supplierFallback),
      time: '',
      timeIso: dockedShipment.created_at,
    })
  }

  return (
    <DashboardView
      isOwner={isOwner}
      greeting={storeGreeting(t)}
      fullName={profile.full_name}
      nowIso={now.toISOString()}
      todayTotal={todayTotal}
      todayCount={todayCount}
      pendingCount={occupiedStations.length}
      counterCount={(stations ?? []).length}
      changePct={changePct}
      weekTotal={weekTotal}
      weekCount={weekCount}
      trendData={trendData}
      recentSales={(recentSales ?? []) as Sale[]}
      lowStockItems={lowStockItems}
      categoryLabels={categoryLabels}
      alerts={alerts}
      expiring={expiring}
      expiryWarningDays={warningDays}
      today={today}
      t={t}
      expiryCopy={copy.expiry}
    />
  )
}
