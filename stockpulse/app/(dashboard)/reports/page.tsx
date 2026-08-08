import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canViewReports } from '@/lib/permissions'
import { toLocalISODate } from '@/lib/format'
import type { Category, Product } from '@/types'
import type { ReportItem, ReportSale } from '@/lib/reports'
import ReportsClient from '@/components/reports/ReportsClient'

export const metadata: Metadata = {
  title: "Reports",
  description: "Period reports for your store, exportable as CSV or PDF.",
  robots: { index: false, follow: false },
}

/**
 * Twice the widest preset, not once.
 *
 * The page offers up to 90 days and now compares each range against the
 * equally-long period before it, so a 90-day report needs 180 days in hand.
 * Fetching only 90 would leave the comparison reading a half-empty prior
 * period as a collapse in revenue. `windowStartIso` goes to the client so it
 * can say "outside compared window" rather than invent a number when a range
 * still reaches past the edge.
 *
 * This is the window the retired /analytics page used, for the same reason.
 */
const WINDOW_DAYS = 180

/** The sale_items -> sales join comes back nested, and PostgREST may hand it
 *  back as an object or a single-element array depending on the relationship. */
type JoinedItem = {
  product_name: string
  quantity: number
  line_total: number
  sales?: { created_at: string } | { created_at: string }[] | null
}

export default async function ReportsPage() {
  const { profile, store } = await getCurrentUser()
  // Reports aggregate the whole store's takings — owner-only, matching the
  // roles declared for this route in lib/nav.ts.
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
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false }),
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
    // A line item with no reachable parent sale cannot be placed in time, so
    // it is dropped rather than silently dated "now".
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

  // Seeded server-side so the first paint has a range and hydration matches.
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)

  return (
    <ReportsClient
      sales={reportSales}
      items={reportItems}
      productCategories={productCategories}
      storeName={store.name}
      defaultFrom={toLocalISODate(from)}
      defaultTo={toLocalISODate(to)}
      windowStartIso={toLocalISODate(windowStart)}
    />
  )
}
