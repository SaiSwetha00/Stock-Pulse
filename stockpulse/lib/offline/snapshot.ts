import { idbClear, idbGet, idbPut } from '@/lib/offline/db'
import type { Product } from '@/types'

/**
 * What a cashier needs with no signal, and deliberately nothing else.
 *
 * This is an ALLOWLIST, not a convenience type. Writing `products` straight
 * into IndexedDB would be one line shorter and would quietly persist every
 * column the query happened to select, forever, on a shared shop phone. Naming
 * the fields means adding one is a decision somebody makes on purpose.
 *
 * Not here, and not by accident: reports, analytics, audit rows, sales
 * history, customers, suppliers, staff. A till needs to identify a tin of ghee
 * and charge for it.
 */
export interface CachedProduct {
  id: string
  name: string
  barcode: string | null
  unit_price: number
  unit: string
  stock: number
  category: string
  image_url: string | null
  low_stock_threshold: number
  /** Only what expiry needs: how many, and when they go off. */
  batches: { quantity: number; expiry_date: string | null }[]
}

export interface StoreSnapshot {
  storeId: string
  /** Who fetched it. Carried so a snapshot cannot be silently reused across
   *  two people on the same handset without that being visible. */
  userId: string
  /** ISO-8601 UTC. The indicator turns this into "as of 14:07". */
  syncedAt: string
  products: CachedProduct[]
}

/** Narrow a server `Product` to the allowlist above. */
export function toCachedProducts(products: Product[]): CachedProduct[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    unit_price: p.unit_price,
    unit: p.unit,
    stock: p.stock,
    category: p.category,
    image_url: p.image_url,
    low_stock_threshold: p.low_stock_threshold,
    batches: (p.product_batches ?? []).map((b) => ({
      quantity: b.quantity,
      expiry_date: b.expiry_date,
    })),
  }))
}

export async function saveSnapshot(snapshot: StoreSnapshot): Promise<void> {
  await idbPut(snapshot)
}

/**
 * Read this store's snapshot.
 *
 * `storeId` is REQUIRED and is the key, so there is no code path that reads
 * "the snapshot" without saying whose. That is the whole defence against a
 * cross-tenant leak: a second store's data cannot be returned by a caller that
 * forgot a filter, because there is no filter to forget.
 */
export async function loadSnapshot(storeId: string): Promise<StoreSnapshot | null> {
  const snap = await idbGet<StoreSnapshot>(storeId)
  if (!snap) return null
  // Belt and braces. The key already guarantees this, but a record whose body
  // disagrees with its key is corrupt and must be distrusted rather than
  // merely noted.
  if (snap.storeId !== storeId) return null
  return snap
}

/** Sign-out. See the note in db.ts — a decision, not tidiness. */
export async function clearSnapshots(): Promise<void> {
  await idbClear()
}

/** Whole minutes since the snapshot was taken; null if it cannot be read. */
export function minutesSince(syncedAt: string, now: number = Date.now()): number | null {
  const t = Date.parse(syncedAt)
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.floor((now - t) / 60000))
}

/**
 * "as of 14:07" — the device's wall clock, not a duration.
 *
 * A time is more useful than "12 minutes ago" for what a cashier actually
 * decides: whether the price they are about to charge predates the delivery
 * that arrived this morning. Durations also go stale on screen; a timestamp
 * does not.
 */
export function snapshotClock(syncedAt: string): string {
  const d = new Date(syncedAt)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
