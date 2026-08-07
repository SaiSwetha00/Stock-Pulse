import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canViewReports } from '@/lib/permissions'
import { toLocalISODate } from '@/lib/format'
import type { Category, Product } from '@/types'
import type { ReportItem, ReportSale } from '@/lib/reports'
import AnalyticsClient from '@/components/analytics/AnalyticsClient'

/**
 * The longest period the page offers is 90 days, and each of those compares
 * against the 90 before it — so 180 days of history has to be in hand.
 */
const WINDOW_DAYS = 180

type JoinedItem = {
  product_name: string
  quantity: number
  line_total: number
  sales?: { created_at: string } | { created_at: string }[] | null
}

export default async function AnalyticsPage() {
  const { profile, store } = await getCurrentUser()
  // Store-wide takings — owner-only, matching lib/nav.ts.
  if (!canViewReports(profile.role)) redirect('/dashboard')

  const supabase = await createClient()

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1))
  windowStart.setHours(0, 0, 0, 0)

  const [{ data: sales }, { data: items }, { data: products }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, total, created_at, payment_method')
      .eq('store_id', store.id)
      .gte('created_at', windowStart.toISOString()),
    supabase
      .from('sale_items')
      .select('product_name, quantity, line_total, sales!inner(store_id, created_at)')
      .eq('sales.store_id', store.id)
      .gte('sales.created_at', windowStart.toISOString()),
    supabase.from('products').select('name, category').eq('store_id', store.id),
  ])

  const reportSales: ReportSale[] = (sales ?? []).map((s) => ({
    id: s.id,
    total: Number(s.total),
    created_at: s.created_at,
    payment_method: s.payment_method,
  }))

  const reportItems: ReportItem[] = ((items ?? []) as unknown as JoinedItem[]).flatMap((i) => {
    const rel = i.sales
    const created = Array.isArray(rel) ? rel[0]?.created_at : rel?.created_at
    if (!created) return []
    return [
      {
        product_name: i.product_name,
        quantity: Number(i.quantity),
        line_total: Number(i.line_total),
        created_at: created,
      },
    ]
  })

  const productCategories: [string, Category][] = (
    (products ?? []) as Pick<Product, 'name' | 'category'>[]
  ).map((p) => [p.name, p.category])

  return (
    <AnalyticsClient
      sales={reportSales}
      items={reportItems}
      productCategories={productCategories}
      todayIso={toLocalISODate(new Date())}
    />
  )
}
