import { queueGetAll, queuePut } from '@/lib/offline/db'

/**
 * A sale that happened in the shop but has not reached the database.
 *
 * THIS RECORD IS THE TRANSACTION. Until Phase 4 syncs it, the only evidence
 * that a customer paid is this row in IndexedDB on one phone, so every field
 * exists because a replay needs it and because losing it loses money.
 *
 * PRICES ARE COPIED, NOT REFERENCED. `unit_price` is the price charged at the
 * moment of sale, stored per line. Replaying against whatever the product costs
 * at sync time would silently re-price a completed transaction — a shop that
 * raised a price on Tuesday would find Monday's queued sales had quietly
 * increased. `product_name` is copied for the same reason: the queue must stay
 * readable to a human even if the product is renamed or deleted before sync.
 *
 * `id` IS CLIENT-GENERATED, and that is the whole idempotency story. Phase 4
 * hands it to the server, which must refuse a second sale bearing an id it has
 * already seen — so a flaky reconnect that replays the same queue twice cannot
 * deduct the shop's stock twice. Generating it server-side would defeat the
 * point: the client has to be able to name the sale before it can send it.
 */
export interface QueuedSaleItem {
  product_id: string
  /** Copied, so the queue stays legible after a rename or a delete. */
  product_name: string
  quantity: number
  /** The price CHARGED, not the price today. */
  unit_price: number
}

export interface QueuedSale {
  /** RFC-4122 v4, generated on this device. The replay key. */
  id: string
  storeId: string
  /** Whose till. Captured at sale time, not at sync time, so an expired
   *  session or a shift change cannot reattribute somebody's takings. */
  userId: string
  /** ISO-8601 UTC. Orders the queue and dates the sale on replay. */
  createdAt: string
  paymentMethod: 'cash' | 'card' | 'nfc'
  /** Sum of the lines, computed at sale time for the same reason prices are
   *  copied — it is what the customer actually paid. */
  total: number
  items: QueuedSaleItem[]

  // --- set by Phase 4's sync when a replay FAILS ---------------------------
  // Stored on the record rather than held in memory, because the reason has to
  // survive the reload that a cashier will do before asking why a sale is
  // stuck. A sale is never dropped for failing; it is annotated and retried.
  /** Readable reason from the last attempt. */
  lastError?: string
  /** ISO-8601 UTC. */
  lastTriedAt?: string
  attempts?: number
}

/**
 * A v4 UUID, from the platform where it exists.
 *
 * `crypto.randomUUID` is unavailable on insecure origins and on older Safari,
 * and that must not be the thing that stops a sale being recorded — so there is
 * a fallback, and it uses `crypto.getRandomValues` rather than `Math.random`.
 * A collision here is a duplicate transaction, which is not a risk worth taking
 * for brevity.
 */
export function newSaleId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const b = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Write a sale to the queue.
 *
 * Returns whether it was actually stored, and the caller MUST act on that. A
 * queue write that fails silently is worse than having no queue: the cashier is
 * told the sale is safe, the customer leaves, and nothing exists.
 *
 * The write is READ BACK before success is claimed. "The put did not throw" is
 * not the same as "the record is there" — a quota refusal can surface late, and
 * this store is the only copy of the money.
 */
export async function enqueueSale(sale: QueuedSale): Promise<boolean> {
  const result = await queuePut(sale)
  // `queuePut` resolves null when IndexedDB is unavailable or the transaction
  // failed. `undefined` is a normal successful `put` result, so null is the
  // only failure signal and has to be tested for explicitly.
  if (result === null) return false
  const all = await listQueuedSales(sale.storeId)
  return all.some((s) => s.id === sale.id)
}

/** This store's queue, oldest first. */
export async function listQueuedSales(storeId: string): Promise<QueuedSale[]> {
  const all = (await queueGetAll<QueuedSale>()) ?? []
  return all
    .filter((s) => s.storeId === storeId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
}

/**
 * How much stock each product owes, summed across every queued sale.
 *
 * Used to show a cashier a sane number between the sale and the sync. DERIVED
 * from the queue rather than kept as a running total, so it cannot drift:
 * remove a queued sale and the number is correct again with no bookkeeping.
 */
export function pendingStockDeltas(sales: QueuedSale[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const sale of sales) {
    for (const item of sale.items) {
      out[item.product_id] = (out[item.product_id] ?? 0) + item.quantity
    }
  }
  return out
}
