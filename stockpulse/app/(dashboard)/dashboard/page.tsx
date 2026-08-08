import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canViewReports } from '@/lib/permissions'
import { DAY_LABELS } from '@/lib/format'
import { REPORTING_TIMEZONE, reportingDate, shiftDays, weekdayIndex } from '@/lib/reportingTimezone'
import { CATEGORY_LABELS, type Product, type Sale } from '@/types'
import DashboardView, { type DashboardAlert } from '@/components/dashboard/DashboardView'

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Today's takings, low stock, and what needs attention in your store.",
  robots: { index: false, follow: false },
}

/** One row per day from public.sales_daily_totals (migration 0004). */
type DailyTotal = { day: string; total: number; sale_count: number }

export default async function DashboardPage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()
  const isOwner = canViewReports(profile.role)

  const now = new Date()
  const today = reportingDate(now)
  const weekStart = shiftDays(today, -6)

  const [
    { data: lowStock },
    { data: recentSales },
    { data: daily },
    { data: stations },
    { data: recentShipments },
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
    label: DAY_LABELS[weekdayIndex(d.day)],
    value: Number(d.total),
  }))

  // ---- Mobile dashboard data ----
  const yesterdayTotal = Number(yesterdayRow?.total ?? 0)
  const changePct =
    yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : null

  const occupiedStations = (stations ?? []).filter((s) => s.status !== 'available')

  const weekTotal = days.reduce((sum, d) => sum + Number(d.total), 0)
  const weekCount = days.reduce((sum, d) => sum + Number(d.sale_count), 0)

  const alerts: DashboardAlert[] = []

  if (lowStockItems.length > 0) {
    const topCategory = CATEGORY_LABELS[lowStockItems[0].category]
    alerts.push({
      id: 'low-stock',
      kind: 'stock',
      title: `Low Stock: ${topCategory}`,
      description: `${lowStockItems.length} item${lowStockItems.length === 1 ? '' : 's'} below minimum threshold.`,
      time: 'now',
    })
  }

  for (const station of (stations ?? []).filter((s) => s.alert_type)) {
    alerts.push({
      id: `station-${station.station_number}`,
      kind: 'device',
      title: `Station 0${station.station_number} Alert`,
      description:
        station.alert_type === 'weight_mismatch'
          ? 'Weight mismatch detected at bagging area.'
          : 'Age verification required for restricted item.',
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
      title: 'Delivery Arrived',
      description: `${supplierName ?? 'Supplier'} delivery is ready for intake.`,
      time: '',
      timeIso: dockedShipment.created_at,
    })
  }

  return (
    <DashboardView
      isOwner={isOwner}
      fullName={profile.full_name}
      nowIso={now.toISOString()}
      todayTotal={todayTotal}
      todayCount={todayCount}
      pendingCount={occupiedStations.length}
      changePct={changePct}
      weekTotal={weekTotal}
      weekCount={weekCount}
      trendData={trendData}
      recentSales={(recentSales ?? []) as Sale[]}
      lowStockItems={lowStockItems}
      alerts={alerts}
    />
  )
}
