'use client'

import { useEffect, useState } from 'react'
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
        if (alive) setQueued(rows)
      })
    }
    read()
    const t = setInterval(read, 10000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [storeId])

  // --- connectivity -----------------------------------------------------
  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false)
    update()

    const goneOnline = () => {
      setOffline(false)
      // Pull fresh data the moment signal returns. This is the whole refresh
      // policy: re-render on the server, which rewrites the snapshot above.
      router.refresh()
    }

    window.addEventListener('online', goneOnline)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', goneOnline)
      window.removeEventListener('offline', update)
    }
  }, [router])

  const pendingTotal = queued.reduce((sum, s) => sum + s.total, 0)

  // Silence while online AND with an empty queue. Unsent sales are never
  // silent, even with signal: until Phase 4 syncs them they exist on one phone
  // and nowhere else, and a cashier must be able to see that nothing was
  // swallowed.
  if (!offline && queued.length === 0) return null

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
          {/* Said plainly, because Phase 3 does not sync and a cashier who
              assumed it did would stop checking. */}
          <p className="mt-1 text-xs opacity-80">
            These stay on this device until syncing is switched on.
          </p>
        </div>
      )}
    </div>
  )
}

