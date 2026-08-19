'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudOff, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import {
  saveSnapshot,
  snapshotClock,
  toCachedProducts,
  type StoreSnapshot,
} from '@/lib/offline/snapshot'
import { listQueuedSales, type QueuedSale } from '@/lib/offline/queue'
import { loadDecoder } from '@/lib/barcode/decoder'
import { syncQueue, type SyncReport } from '@/lib/offline/sync'
import {
  checkQueueIntegrity,
  rememberQueue,
  requestPersistentStorage,
  type IntegrityResult,
} from '@/lib/offline/integrity'
import { useToast } from '@/components/ui/Toast'
import type { Product } from '@/types'

/**
 * Keeps this store's offline snapshot fresh, and says out loud when the app is
 * running on it.
 *
 * One component for both jobs because they are one job: the cache is only
 * honest if whatever writes it also owns the sentence describing how old it
 * is. Splitting them is how a banner ends up claiming 14:07 while the data
 * underneath it is from yesterday.
 *
 * THE REFRESH POLICY, in full:
 *   - The server render IS the sync. Whenever this mounts with products from a
 *     server component, that list is written to IndexedDB. There is no separate
 *     fetch loop, so the cache cannot disagree with what the page is showing.
 *   - Regaining connectivity calls `router.refresh()`, which re-runs the server
 *     component, which re-renders this with fresh products, which rewrites the
 *     snapshot. One path, not two.
 *   - Nothing polls. A till on a metered connection should not fetch a product
 *     list every thirty seconds to discover nothing changed.
 *
 * WHY `navigator.onLine` IS NOT TRUSTED ALONE. It reports `true` on a captive
 * portal and on a phone showing full bars with no route, so it can only prove
 * the NEGATIVE: `false` genuinely means no network, while `true` means "maybe".
 * That is why `lookupBarcode` treats a failed call, not this flag, as proof of
 * being offline.
 */
export default function OfflineStatus({
  storeId,
  userId,
  products,
}: {
  storeId: string
  userId: string
  products: Product[]
}) {
  const router = useRouter()
  const [offline, setOffline] = useState(false)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [queued, setQueued] = useState<QueuedSale[]>([])
  const [syncing, setSyncing] = useState(false)
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null)
  const toast = useToast()

  // --- sync -------------------------------------------------------------
  useEffect(() => {
    // A server render that produced no products is not evidence the shop has
    // none — it is also what a failed or partial fetch looks like. Writing it
    // would replace a good snapshot with an empty one, and the cashier would
    // lose the list precisely when the network is flaky.
    if (products.length === 0) return

    const snapshot: StoreSnapshot = {
      storeId,
      userId,
      syncedAt: new Date().toISOString(),
      products: toCachedProducts(products),
    }
    void saveSnapshot(snapshot).then(() => {
      setSyncedAt(snapshot.syncedAt)
      // Which store this device last held, so the offline page can open the
      // right snapshot with no session to ask. Written only after the snapshot
      // itself succeeds, so the pointer can never name a record that is absent.
      try {
        window.localStorage.setItem('sp-last-store', storeId)
      } catch {
        // Storage refused (private browsing). The banner still works; only the
        // cold-start offline page loses its way in, which it reports honestly.
      }
    })
  }, [storeId, userId, products])

  // --- warm the barcode decoder WHILE THERE IS STILL SIGNAL --------------
  useEffect(() => {
    // A measured defect, reported from a phone: scanning offline failed with
    // "Failed to load chunk /_next/static/chunks/<hash>.js".
    //
    // `lib/barcode/decoder.ts` loads zxing through `await import(...)`, so the
    // bundler splits it into its own chunk, and ScannerPrototype only calls
    // `loadDecoder()` when it MOUNTS - that is, when somebody opens the
    // scanner. The service worker precaches only /offline.html and caches
    // everything else opportunistically, on first fetch. So on a device that
    // has never decoded a barcode in this browser, the chunk is in no cache at
    // all, and the first request for it happens at the exact moment there is
    // no network to serve it.
    //
    // Warming it here fixes the cause rather than the symptom: `loadDecoder`
    // memoises, so this is the same promise the scanner will later await, and
    // doing it now costs a fetch that would have happened anyway.
    if (navigator.onLine === false) return

    const warm = () => {
      // Failures are ignored on purpose. This is opportunistic - the scanner
      // still loads the decoder itself, and reporting a warm-up failure would
      // tell a shopkeeper about work they never asked for.
      void loadDecoder().catch(() => undefined)
      // The wasm is a separate 1 MB request that `prepareZXingModule` defers
      // until the first decode, so warming the module alone would still leave
      // the binary missing offline. It is under /wasm/, which the worker
      // caches cache-first.
      void fetch('/wasm/zxing_reader.wasm').catch(() => undefined)
    }

    // On idle, so a 1 MB binary never competes with the first paint of a page
    // a cashier is trying to read.
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    if (typeof ric === 'function') ric(warm)
    else window.setTimeout(warm, 3000)
  }, [])

  // --- ask the browser to keep our storage --------------------------------
  useEffect(() => {
    // A REQUEST, not a command. Chrome grants it silently for an installed PWA,
    // Firefox may prompt, Safari has historically ignored it - which is exactly
    // the platform whose eviction puts a money-bearing queue at risk, so the
    // answer is logged rather than assumed. This is mitigation, not a fix; only
    // a real iPhone can close that gap.
    void requestPersistentStorage().then((state) => {
      if (!state.supported) {
        console.warn('[offline] this browser has no Storage API; the queue cannot be pinned')
      } else if (!state.persisted) {
        console.warn('[offline] persistent storage was NOT granted; the queue may be evicted')
      }
    })
  }, [])

  // --- the queue ---------------------------------------------------------
  // Polled rather than pushed, and slowly. A sale can be queued from the
  // static offline page, which shares the database but not this React tree, so
  // there is no event to subscribe to across that boundary. Ten seconds is far
  // below the rate at which a human notices and far above the rate at which
  // reading a handful of rows costs anything.
  useEffect(() => {
    let alive = true
    const read = () => {
      void listQueuedSales(storeId).then((rows) => {
        if (!alive) return
        // Compare BEFORE remembering, or the check would always agree with
        // itself. A shrink that this app did not cause is the alarm.
        const result = checkQueueIntegrity(storeId, rows)
        setIntegrity(result.ok ? null : result)
        rememberQueue(storeId, rows)
        setQueued(rows)
      })
    }
    read()
    const t = setInterval(read, 10000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [storeId])

  // --- sync --------------------------------------------------------------
  const runSync = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const report: SyncReport = await syncQueue(storeId)
      const after = await listQueuedSales(storeId)
      // Sales that synced left the queue legitimately, so the witness is
      // updated here too - otherwise every successful sync would look like an
      // eviction on the next read.
      rememberQueue(storeId, after)
      setQueued(after)

      if (report.attempted === 0) return

      // NOTHING RESOLVES SILENTLY. Every outcome a cashier could be surprised
      // by gets its own message, because "3 sales waiting" quietly becoming
      // "0 sales waiting" is indistinguishable from the sales having been lost.
      if (report.discrepancies.length > 0) {
        // The loudest case, and deliberately an error rather than a warning:
        // stock was short, so the shop sold something it did not have. The sale
        // still landed - the money was taken - but somebody has to count a
        // shelf.
        const lines = report.discrepancies
          .map((d) => `${d.product_name}: sold ${d.units_sold}, only ${d.stock_available} left`)
          .join(' · ')
        toast.error(
          `Stock did not add up on ${report.discrepancies.length} item${report.discrepancies.length === 1 ? '' : 's'}`,
          `${lines}. The sale${report.created === 1 ? '' : 's'} went through and stock is now 0 — please check the shelf.`,
        )
      }

      if (report.created > 0 || report.duplicates > 0) {
        const parts: string[] = []
        if (report.created > 0) parts.push(`${report.created} sent`)
        // Named rather than hidden. A duplicate means an earlier attempt had
        // already committed - which is exactly what the client id is for, and a
        // cashier who sees the count drop deserves to know why.
        if (report.duplicates > 0) {
          parts.push(`${report.duplicates} already recorded`)
        }
        toast.success('Offline sales synced', parts.join(' · '))
      }

      if (report.failed.length > 0) {
        toast.error(
          `${report.failed.length} sale${report.failed.length === 1 ? '' : 's'} could not sync`,
          `${report.failed[0].reason ?? 'Unknown reason.'} ${report.failed.length > 1 ? 'See the list below.' : ''} They are still saved on this device.`,
        )
      }

      // Server-side stock and takings have moved, so the page's own data is
      // now stale.
      if (report.created > 0) router.refresh()
    } finally {
      setSyncing(false)
    }
  }, [storeId, syncing, toast, router])

  // --- connectivity -----------------------------------------------------
  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false)
    update()

    const goneOnline = () => {
      setOffline(false)
      // Sync BEFORE refreshing. A refresh would otherwise pull stock that does
      // not yet include the queued sales, and the cashier would watch the
      // numbers move twice.
      void runSync()
      router.refresh()
    }

    window.addEventListener('online', goneOnline)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', goneOnline)
      window.removeEventListener('offline', update)
    }
  }, [router, runSync])

  const pendingTotal = queued.reduce((sum, s) => sum + s.total, 0)

  // Silence while online AND with an empty queue. Unsent sales are never
  // silent, even with signal: until Phase 4 syncs them they exist on one phone
  // and nowhere else, and a cashier must be able to see that nothing was
  // swallowed.
  if (!offline && queued.length === 0 && !integrity) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {offline ? (
          <>
            <span className="font-semibold">You are offline.</span>
            <span>
              {/* Named precisely, because a vague "some features unavailable"
                  leaves a cashier guessing which. */}
              Showing saved products
              {syncedAt ? ` from ${snapshotClock(syncedAt)}` : ''}. Sales you complete are saved on
              this device.
            </span>
          </>
        ) : (
          <span className="font-semibold">Back online.</span>
        )}
        <button
          type="button"
          onClick={() => router.refresh()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold underline underline-offset-2"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>

      {/* THE LOUDEST THING THIS COMPONENT CAN SAY. Sales that were on this
          device are no longer in IndexedDB, and this app did not remove them -
          which on iOS means the browser evicted them. Shown in the danger
          colour and never auto-dismissed, because the alternative is a queue
          that silently got shorter. */}
      {integrity && (
        <div className="mt-2 rounded-lg border border-danger bg-danger-bg px-3 py-2 text-danger">
          <p className="text-sm font-semibold">
            {integrity.missingIds.length} saved sale
            {integrity.missingIds.length === 1 ? '' : 's'} disappeared from this device
          </p>
          <p className="mt-0.5 text-xs">
            This device held {integrity.expected} and now has {integrity.actual}. Nothing here
            removed {integrity.missingIds.length === 1 ? 'it' : 'them'}, so the browser may have
            cleared storage. Any sale that had not synced is not recorded anywhere — check
            today&apos;s takings against the till.
          </p>
        </div>
      )}

      {/* The queue, itemised rather than counted. "3 sales pending" tells a
          cashier a number; naming them lets somebody check the till against
          the list, which is what they will actually do if they are worried. */}
      {queued.length > 0 && (
        <div className="mt-2 border-t border-warning/40 pt-2">
          <p className="font-semibold">
            {queued.length} sale{queued.length === 1 ? '' : 's'} waiting to sync ·{' '}
            {formatCurrency(pendingTotal)}
          </p>
          <ul className="mt-1 space-y-0.5">
            {queued.slice(0, 5).map((s) => (
              <li key={s.id} className="sp-num text-xs">
                {new Date(s.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {s.items.length} item{s.items.length === 1 ? '' : 's'} ·{' '}
                {formatCurrency(s.total)}
                <span className="ml-1 opacity-70">
                  ({s.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')})
                </span>
              </li>
            ))}
          </ul>
          {queued.length > 5 && (
            <p className="mt-1 text-xs opacity-80">and {queued.length - 5} more.</p>
          )}

          {/* A failed sale shows WHY, on the sale itself. A cashier asking
              "why is this stuck" should not have to find a toast that has
              already gone. */}
          {queued.some((s) => s.lastError) && (
            <ul className="mt-2 space-y-0.5">
              {queued
                .filter((s) => s.lastError)
                .slice(0, 3)
                .map((s) => (
                  <li key={`err-${s.id}`} className="text-xs font-medium text-danger">
                    {formatCurrency(s.total)} — {s.lastError}
                    {s.attempts && s.attempts > 1 ? ` (tried ${s.attempts} times)` : ''}
                  </li>
                ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => void runSync()}
            disabled={syncing || offline}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-warning px-3 py-1 text-xs font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {syncing ? 'Syncing…' : offline ? 'Waiting for signal' : 'Sync now'}
          </button>
          {/* Said plainly, because Phase 3 does not sync and a cashier who
              assumed it did would stop checking. */}
          <p className="mt-1 text-xs opacity-80">
            {offline
              ? 'These stay on this device until you are back online.'
              : 'They are sent one at a time, oldest first.'}
          </p>
        </div>
      )}
    </div>
  )
}

