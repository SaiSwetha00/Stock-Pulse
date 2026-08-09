import type { Category } from '@/types'
import { categoryLabel } from '@/lib/categories'

/** A sale, reduced to what any report actually needs. */
export interface ReportSale {
  id: string
  total: number
  created_at: string
  payment_method: string
}

/** A line item, flattened out of the sale_items/sales join. */
export interface ReportItem {
  product_name: string
  quantity: number
  line_total: number
  created_at: string
}

export interface Kpis {
  revenue: number
  transactions: number
  avgOrder: number
  unitsSold: number
}

/**
 * Inclusive local-day bounds. The `to` end is pushed to the last millisecond
 * of its day so a same-day from/to still contains that day's sales — the same
 * rule the Sales table's date filter uses.
 */
export function dayBounds(from: string, to: string): { fromTs: number | null; toTs: number | null } {
  return {
    fromTs: from ? new Date(`${from}T00:00:00`).getTime() : null,
    toTs: to ? new Date(`${to}T23:59:59.999`).getTime() : null,
  }
}

export function withinRange(iso: string, fromTs: number | null, toTs: number | null): boolean {
  const ts = new Date(iso).getTime()
  if (fromTs !== null && ts < fromTs) return false
  if (toTs !== null && ts > toTs) return false
  return true
}

export function summarize(sales: ReportSale[], items: ReportItem[]): Kpis {
  const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const transactions = sales.length
  return {
    revenue,
    transactions,
    // Guard the divide: an empty range is a legitimate state, not an error.
    avgOrder: transactions ? revenue / transactions : 0,
    unitsSold: items.reduce((sum, i) => sum + Number(i.quantity), 0),
  }
}

/** Local YYYY-MM-DD. Never toISOString(): that shifts the day in +UTC zones. */
function localKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * One entry per calendar day in the range, including days with no sales — a
 * trend line that silently skips empty days misrepresents a quiet week as a
 * busy one.
 */
export function revenueByDay(
  sales: ReportSale[],
  from: string,
  to: string
): { label: string; value: number; iso: string }[] {
  if (!from || !to) return []
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []

  const buckets = new Map<string, number>()
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.set(localKey(d), 0)
  }
  for (const s of sales) {
    const key = localKey(new Date(s.created_at))
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(s.total))
  }
  return [...buckets.entries()].map(([iso, value]) => ({
    iso,
    value,
    label: new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }))
}

export function topProducts(
  items: ReportItem[],
  limit = 10
): { name: string; units: number; revenue: number }[] {
  const acc = new Map<string, { units: number; revenue: number }>()
  for (const i of items) {
    const cur = acc.get(i.product_name) ?? { units: 0, revenue: 0 }
    cur.units += Number(i.quantity)
    cur.revenue += Number(i.line_total)
    acc.set(i.product_name, cur)
  }
  return [...acc.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function categoryMix(
  items: ReportItem[],
  categoryOf: Map<string, Category>,
  /** slug -> display name, from the store's own categories. Passed in rather
   *  than imported: this file has no session and no store to read one for. */
  labels: Record<string, string>
): { label: string; revenue: number; pct: number }[] {
  const acc = new Map<string, number>()
  let grand = 0
  for (const i of items) {
    // Products deleted since the sale have no category left to look up; they
    // are still real revenue, so they get their own bucket rather than being
    // silently folded into an arbitrary category.
    const cat = categoryOf.get(i.product_name)
    const label = cat ? categoryLabel(cat, labels) : 'Uncategorised'
    const v = Number(i.line_total)
    acc.set(label, (acc.get(label) ?? 0) + v)
    grand += v
  }
  return [...acc.entries()]
    .map(([label, revenue]) => ({ label, revenue, pct: grand ? (revenue / grand) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

const PAYMENT_LABELS: Record<string, string> = { cash: 'Cash', card: 'Card', nfc: 'NFC' }

export function paymentMix(
  sales: ReportSale[]
): { label: string; count: number; revenue: number; pct: number }[] {
  const acc = new Map<string, { count: number; revenue: number }>()
  let grand = 0
  for (const s of sales) {
    const label = PAYMENT_LABELS[s.payment_method] ?? s.payment_method
    const cur = acc.get(label) ?? { count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += Number(s.total)
    acc.set(label, cur)
    grand += Number(s.total)
  }
  return [...acc.entries()]
    .map(([label, v]) => ({ label, ...v, pct: grand ? (v.revenue / grand) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** `days` back from today, as local YYYY-MM-DD, inclusive of today. */
export function presetRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: localKey(from), to: localKey(to) }
}
