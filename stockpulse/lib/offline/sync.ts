import { createClient } from '@/lib/supabase/client'
import { queueDelete, queuePut } from '@/lib/offline/db'
import { listQueuedSales, type QueuedSale } from '@/lib/offline/queue'

/**
 * Replaying the offline queue. This is the phase that can lose or duplicate
 * real money, so every rule here is deliberately defensive.
 *
 * IDEMPOTENCY IS THE DATABASE'S JOB, NOT THIS FILE'S. `replay_sale` (0018) is
 * guarded by a unique index on `(store_id, client_id)` and reports back
 * `created` or `duplicate`. This module never decides "I think I already sent
 * that" — it sends, and believes the answer. A client-side guess would be wrong
 * exactly when it matters most: a request that timed out may well have
 * committed.
 *
 * WHICH MEANS A TIMEOUT IS NOT A FAILURE. If the network dies mid-sync the sale
 * stays queued, and the next attempt is answered `duplicate` rather than
 * inserting a second row. That is the whole reason the id is generated on the
 * device before the sale is ever sent.
 */

/** What happened to one queued sale. */
export interface SyncOutcome {
  id: string
  /** `created` — it landed. `duplicate` — it was already there, which is a
   *  SUCCESS: a previous attempt committed and this one proved it. */
  status: 'created' | 'duplicate' | 'failed'
  saleId?: string
  /** Recomputed by the server from the snapshotted lines. Where it differs
   *  from the queued float, the server's figure is the true one. */
  total?: number
  /** Present when replay could not take all the stock the sale sold. */
  discrepancies?: {
    product_id: string
    product_name: string
    units_sold: number
    stock_available: number
    shortfall: number
  }[]
  /** Readable by a cashier, when `failed`. */
  reason?: string
}

export interface SyncReport {
  attempted: number
  created: number
  duplicates: number
  failed: SyncOutcome[]
  /** Flattened across every sale, so the caller can raise one clear alarm. */
  discrepancies: NonNullable<SyncOutcome['discrepancies']>
  outcomes: SyncOutcome[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Codes worth naming rather than surfacing raw to somebody at a till. */
function readableReason(error: { code?: string; message?: string }): string {
  const message = error.message ?? 'The sale could not be sent.'
  if (error.code === 'PGRST202' || /replay_sale/i.test(message)) {
    return 'Syncing is not set up on this database yet. Run migration 0018.'
  }
  if (error.code === '42501') {
    return 'This account is not allowed to record that sale. Ask the owner.'
  }
  if (/not a member of this store/i.test(message)) {
    return 'The person who made this sale is no longer in this store.'
  }
  if (/Product not found/i.test(message)) {
    return 'A product on this sale no longer exists. It needs recording by hand.'
  }
  if (/fetch|network|Failed to fetch/i.test(message)) {
    return 'No connection. It will be sent when you are back online.'
  }
  if (/invalid input syntax for type uuid/i.test(message)) {
    // Should now be unreachable - the guard below sends null rather than a
    // malformed id. Named anyway, because the version of this that reached a
    // phone showed a shopkeeper raw Postgres.
    return 'This sale was saved without a valid user. It needs recording by hand.'
  }
  if (/JWT|expired|not authenticated/i.test(message)) {
    return 'Your session expired. Sign in again and this will be sent.'
  }
  return message
}

/**
 * Replay every queued sale for this store, oldest first.
 *
 * ORDER MATTERS and is not cosmetic. Sales are replayed in the order the shop
 * made them, so when stock runs short it is the LATER sale that records the
 * shortfall — which is what actually happened on the shelf.
 *
 * SEQUENTIAL, not parallel. Two replays touching the same product would race on
 * its stock, and the discrepancy rows would then describe an order of events
 * that never occurred. Slower, and correct.
 *
 * ONE FAILURE DOES NOT STOP THE REST. A sale that cannot be sent stays queued
 * with a readable reason and is retried next time; the sales after it still go.
 * Halting the queue on one bad row would hold good money hostage to it.
 */
export async function syncQueue(storeId: string): Promise<SyncReport> {
  const pending = await listQueuedSales(storeId)
  const report: SyncReport = {
    attempted: pending.length,
    created: 0,
    duplicates: 0,
    failed: [],
    discrepancies: [],
    outcomes: [],
  }
  if (pending.length === 0) return report

  const supabase = createClient()

  for (const sale of pending) {
    let outcome: SyncOutcome

    try {
      const { data, error } = await supabase.rpc('replay_sale', {
        p_client_id: sale.id,
        // The prices CHARGED, from the device. The server recomputes the total
        // from these rather than trusting the queued float (Phase 3 observed
        // 13.450000000000001), and never re-reads today's price.
        p_items: sale.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        p_payment_method: sale.paymentMethod,
        // Only a real uuid, never a placeholder. The offline till used to write
        // the string 'unknown' when a snapshot carried no user, and
        // `p_sold_by uuid` rejects that outright - stranding the sale forever.
        // Sending null lets the sale land unattributed, which is recoverable;
        // a stuck sale is not.
        p_sold_by: UUID_RE.test(String(sale.userId ?? '')) ? sale.userId : null,
        p_created_at: sale.createdAt,
      })

      if (error) {
        outcome = { id: sale.id, status: 'failed', reason: readableReason(error) }
      } else {
        // D24 applied to a whole operation: the function reports what it did,
        // and that is believed over "no error was thrown". A null payload means
        // the call returned without saying anything, which is not success.
        const result = data as
          | {
              status?: string
              sale_id?: string
              total?: number
              discrepancies?: SyncOutcome['discrepancies']
            }
          | null

        if (
          !result ||
          !result.sale_id ||
          (result.status !== 'created' && result.status !== 'duplicate')
        ) {
          outcome = {
            id: sale.id,
            status: 'failed',
            reason: 'The server did not confirm this sale. It stays saved here.',
          }
        } else {
          outcome = {
            id: sale.id,
            status: result.status,
            saleId: result.sale_id,
            total: Number(result.total),
            discrepancies: result.discrepancies ?? [],
          }
        }
      }
    } catch (err) {
      // supabase-js resolves rather than throws on a network failure, so
      // reaching here is unusual. Treated as a failure, never as a success.
      outcome = {
        id: sale.id,
        status: 'failed',
        reason: readableReason({ message: err instanceof Error ? err.message : String(err) }),
      }
    }

    report.outcomes.push(outcome)

    if (outcome.status === 'failed') {
      report.failed.push(outcome)
      // Kept in the queue, annotated. A failed sale is never dropped: it is
      // money, and the reason is stored rather than living only in a toast
      // that has already gone.
      // Built as a typed QueuedSale first, so the annotated record is checked
      // against the real shape rather than slipping through as a loose literal.
      const annotated: QueuedSale = {
        ...sale,
        lastError: outcome.reason,
        lastTriedAt: new Date().toISOString(),
        attempts: (sale.attempts ?? 0) + 1,
      }
      await queuePut(annotated)
      continue
    }

    if (outcome.status === 'created') report.created++
    else report.duplicates++
    if (outcome.discrepancies?.length) report.discrepancies.push(...outcome.discrepancies)

    // Removed only AFTER the server confirmed it. If this delete fails, the
    // sale is replayed next time and answered `duplicate`, which is harmless.
    // The opposite order would delete a sale that never landed.
    await queueDelete(sale.id)
  }

  return report
}

/** Re-exported so callers can type a queued sale carrying its failure note. */
export type { QueuedSale }
