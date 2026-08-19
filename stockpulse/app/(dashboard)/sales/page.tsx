import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { DAY_LABELS } from '@/lib/format'
import { REPORTING_TIMEZONE, reportingDate, shiftDays, weekdayIndex } from '@/lib/reportingTimezone'
import type { Product, Sale } from '@/types'
import { categoryLabel, getStoreCategories, labelMap } from '@/lib/categories'
import SalesClient from '@/components/sales/SalesClient'
import { storeExpiryWarningDays } from '@/lib/expiry'

export const metadata: Metadata = {
  title: "Sales",
  description: "Log sales and review every transaction your store has taken.",
  robots: { index: false, follow: false },
}

/** Shapes returned by the aggregate functions in migration 0004. */
type DailyTotal = { day: string; total: number; sale_count: number }
type CategoryTotal = { category: string; total: number }
type TopProduct = { product_name: string; units: number; revenue: number }

/** How many slices the category breakdown and the best-seller list render. */
const BREAKDOWN_LIMIT = 4

export default async function SalesPage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()

  const today = reportingDate()
  const weekStart = shiftDays(today, -6)
  const monthStart = shiftDays(today, -30)

  // The month window used to arrive as one row per line item — every
  // sale_item sold in thirty days — and was reduced here to four percentages
  // and four names. Both rollups happen in Postgres now.
  const [
    { data: products },
    { data: sales },
    { data: daily },
    { data: categories },
    { data: top },
  ] = await Promise.all([
    // Lots embedded for the same reason /inventory embeds them: the cart
    // shows each line's nearest expiry, and a product reached by SEARCH must
    // carry the same information as one reached by SCAN — otherwise the same
    // milk would show a date when beeped and nothing when typed.
    supabase.from('products').select('*, product_batches(*)').eq('store_id', store.id),
    supabase
      .from('sales')
      .select('*, profiles(full_name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.rpc('sales_daily_totals', {
      p_from: weekStart,
      p_to: today,
      p_tz: REPORTING_TIMEZONE,
    }),
    supabase.rpc('sales_category_breakdown', {
      p_from: monthStart,
      p_to: today,
      p_tz: REPORTING_TIMEZONE,
    }),
    supabase.rpc('sales_top_products', {
      p_from: monthStart,
      p_to: today,
      p_tz: REPORTING_TIMEZONE,
      p_limit: BREAKDOWN_LIMIT,
    }),
  ])

  // Zero-filled and oldest-first, so this maps straight onto the chart.
  const days = (daily ?? []) as DailyTotal[]
  const trendData = days.map((d) => ({
    label: DAY_LABELS[weekdayIndex(d.day)],
    value: Number(d.total),
  }))

  const weekTotal = days.reduce((sum, d) => sum + Number(d.total), 0)
  const weekCount = days.reduce((sum, d) => sum + Number(d.sale_count), 0)
  const avgOrder = weekCount ? weekTotal / weekCount : 0

  // The share is worked out here rather than in SQL because it has to be of
  // the whole month's takings while only the leading few slices are drawn —
  // taking the percentage after the cut would report shares of a subtotal.
  const categoryTotals = (categories ?? []) as CategoryTotal[]
  const grandTotal = categoryTotals.reduce((sum, c) => sum + Number(c.total), 0)
  // The RPC still groups by products.category and returns the slug, which is
  // why 0013 kept that column as text. Naming it is this page's job.
  const { categories: storeCategories } = await getStoreCategories(supabase, store.id)
  const categoryLabels = labelMap(storeCategories)
  const categoryBreakdown = categoryTotals.slice(0, BREAKDOWN_LIMIT).map((c) => ({
    label: categoryLabel(c.category, categoryLabels),
    pct: grandTotal ? Math.round((Number(c.total) / grandTotal) * 100) : 0,
  }))

  const topSelling = ((top ?? []) as TopProduct[]).map((t) => ({
    name: t.product_name,
    units: Number(t.units),
  }))

  return (
    <SalesClient
      role={profile.role}
      products={(products ?? []) as Product[]}
      sales={(sales ?? []) as Sale[]}
      trendData={trendData}
      categoryBreakdown={categoryBreakdown}
      topSelling={topSelling}
      weekTotal={weekTotal}
      avgOrder={avgOrder}
      // Both decided on the server, for the reason lib/expiry.ts gives: a
      // client that read its own clock could tone the same lot differently
      // before and after hydration, and a client that assumed 7 days would
      // ignore a shop that moved its threshold.
      today={today}
      expiryWarningDays={storeExpiryWarningDays(store)}
      storeId={store.id}
      userId={profile.id}
    />
  )
}
