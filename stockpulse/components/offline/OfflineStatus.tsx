'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudOff, RefreshCw } from 'lucide-react'
import {
  saveSnapshot,
  snapshotClock,
  toCachedProducts,
  type StoreSnapshot,
} from '@/lib/offline/snapshot'
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

  // --- sync -------------------------------------------------------------
  useEffect(() => {
    // A server render that produced no products is not evidence the shop has
    // none — it is also what a failed or partial fetch looks like. Writing it
    // would replace a good snapshot with an empty one, and the cashier would
    // lose the list precisely when the network is flaky.
    if (products.length === 0) return
    console.info('[offline] caching', products.length, 'products for store', storeId)

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

  // Silence while online is correct: a permanent "you are connected" badge is
  // noise, and the brief's point is that silence beats a warning only when
  // there is nothing to warn about.
  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warning bg-warning-bg px-4 py-3 text-sm text-warning"
    >
      <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="font-semibold">You are offline.</span>
      <span>
        {/* Named precisely, because a vague "some features unavailable" leaves
            a cashier guessing which. */}
        Showing saved products
        {syncedAt ? ` from ${snapshotClock(syncedAt)}` : ''}. Sales and stock changes cannot be
        saved until signal returns.
      </span>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold underline underline-offset-2"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  )
}
