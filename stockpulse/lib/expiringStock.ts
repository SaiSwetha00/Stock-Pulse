import type { createClient } from '@/lib/supabase/server'
import { shiftDays } from '@/lib/reportingTimezone'
import type { Category } from '@/types'

/**
 * "What is about to go off", read the same way "what is running low" is read.
 *
 * The shape deliberately matches `low_stock_products`: ONE scoped call that
 * comes back already ordered urgency-first, so the page does no filtering and
 * no sorting, and the ordering cannot end up subtly different on one screen
 * from another.
 *
 * It is a plain query rather than an RPC, and that is the one place it departs
 * from the low-stock pattern. `low_stock_products` had to be a function because
 * its test is column-to-column — `stock <= low_stock_threshold` — which
 * PostgREST's filter syntax cannot express. This test is column-to-constant:
 * the cutoff date is computed here and passed down. A function would cost a
 * migration and buy nothing.
 */
export interface ExpiringProduct {
  id: string
  name: string
  category: Category
  image_url: string | null
  /** Earliest at-risk expiry among this product's lots. */
  expiry_date: string
  /** Units sitting on lots at or before the cutoff — NOT the product's total
   *  stock. A product with 40 on hand and 6 in a lot dated Friday has 6 at
   *  risk, and saying 40 would overstate every line on the list. */
  quantity: number
  /** How many of this product's lots are at risk. */
  lots: number
}

export interface ExpiringStock {
  /** Already past. Deep red — this is loss that has happened. */
  expired: ExpiringProduct[]
  /** Within the window and still sellable. A warning, not an alarm. */
  soon: ExpiringProduct[]
  /**
   * Set when the read failed. The dashboard renders without the expiry panels
   * rather than 500ing on them — but the failure is RETURNED rather than
   * swallowed, so a caller can say "could not read" instead of showing an
   * empty list. An empty list reads as "nothing is expiring", which is the
   * worst possible way for an alerting feature to fail, because it looks
   * exactly like good news. That distinction is why this field exists.
   */
  error: string | null
}

type BatchRow = {
  quantity: number
  expiry_date: string
  products:
    | { id: string; name: string; category: Category; image_url: string | null }
    | { id: string; name: string; category: Category; image_url: string | null }[]
    | null
}

export async function getExpiringStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
  /** The shop's calendar date, from `reportingDate()`. Never `new Date()`. */
  today: string,
  /** The store's window, from `storeExpiryWarningDays()`. */
  days: number,
): Promise<ExpiringStock> {
  const cutoff = shiftDays(today, days)

  const { data, error } = await supabase
    .from('product_batches')
    .select('quantity, expiry_date, products!inner(id, name, category, image_url)')
    .eq('store_id', storeId)
    // A lot that has sold out is not a warning. 0016 keeps zero-quantity lots
    // for their history, and surfacing stock that is no longer on the shelf is
    // how a warning list becomes background noise.
    .gt('quantity', 0)
    // Undated lots fall out here without a second filter: `null <= cutoff` is
    // null, not true, so those rows never match. It also lets Postgres use
    // 0016's partial index, whose predicate `expiry_date is not null` this
    // comparison implies.
    .lte('expiry_date', cutoff)
    .order('expiry_date', { ascending: true })

  if (error) return { expired: [], soon: [], error: error.message }
  if (!data || data.length === 0) return { expired: [], soon: [], error: null }

  // One entry per product, not per lot. A shopkeeper thinks in lines on a
  // shelf; three lots of the same paneer is one thing to walk over and look at.
  const byProduct = new Map<string, ExpiringProduct>()
  for (const row of data as unknown as BatchRow[]) {
    const rel = row.products
    const product = Array.isArray(rel) ? rel[0] : rel
    // A lot with no reachable product cannot be named or linked to, so it is
    // dropped rather than rendered as a blank row. `!inner` should make this
    // unreachable; it is here because "should be unreachable" is not a check.
    if (!product) continue

    const existing = byProduct.get(product.id)
    if (existing) {
      existing.quantity += Number(row.quantity)
      existing.lots += 1
      // Rows arrive earliest-first, so the first one seen is already the
      // earliest and `expiry_date` needs no comparison here.
      continue
    }
    byProduct.set(product.id, {
      id: product.id,
      name: product.name,
      category: product.category,
      image_url: product.image_url,
      expiry_date: row.expiry_date,
      quantity: Number(row.quantity),
      lots: 1,
    })
  }

  // Insertion order is the query's order — earliest expiry first — so both
  // buckets come out urgency-first without a second sort.
  const expired: ExpiringProduct[] = []
  const soon: ExpiringProduct[] = []
  for (const p of byProduct.values()) {
    if (p.expiry_date < today) expired.push(p)
    else soon.push(p)
  }

  return { expired, soon, error: null }
}
