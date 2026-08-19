'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, CloudOff, PackageX } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { expiryTone, formatExpiry, nextExpiry } from '@/lib/expiry'
import { matchCachedBarcode } from '@/lib/offline/barcodeLookup'
import { isValidBarcode } from '@/lib/validation/product'
import { idbGet } from '@/lib/offline/db'
import { snapshotClock, type StoreSnapshot } from '@/lib/offline/snapshot'

/**
 * The cached product list, rendered with no network at all.
 *
 * WHY THIS EXISTS RATHER THAN AN OFFLINE /inventory. Phase 1 decided the
 * service worker caches no authenticated HTML, because a grocery phone is
 * shared and a cached /inventory would show the next person the previous
 * person's shop before the network could answer. That decision stands, so a
 * cold navigation with no signal cannot render the real /inventory - its HTML
 * is not on the device and must not be.
 *
 * What CAN be delivered honestly is this: a static document the worker is
 * allowed to cache, which fills itself from IndexedDB at runtime. The data
 * arrives from a store-keyed record rather than from a cached response, so the
 * tenancy rule is structural.
 *
 * It reads. It does not write, and it says so.
 */
export default function OfflineProducts() {
  const [snapshot, setSnapshot] = useState<StoreSnapshot | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // There is no session to read offline, so the store cannot be resolved
      // from the server. `lastStoreId` is written by OfflineStatus alongside
      // each snapshot; without it there is nothing to show, and inventing a
      // "first record in the database" fallback is exactly how one store's
      // products would appear under another's login.
      const storeId = window.localStorage.getItem('sp-last-store')
      if (!storeId) {
        if (!cancelled) setState('empty')
        return
      }
      const snap = await idbGet<StoreSnapshot>(storeId)
      if (cancelled) return
      if (!snap || snap.storeId !== storeId) {
        setState('empty')
        return
      }
      setSnapshot(snap)
      setState('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }, [])

  const results = useMemo(() => {
    if (!snapshot) return []
    const q = query.trim().toLowerCase()
    if (!q) return snapshot.products.slice(0, 25)
    // A scanned or typed barcode is matched through the SAME function the
    // online lookup uses offline, so "which product is this" cannot mean two
    // different things on the two screens.
    if (isValidBarcode(q)) {
      const hit = matchCachedBarcode(snapshot.products, q)
      return hit ? [hit] : []
    }
    return snapshot.products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? '').includes(q))
      .slice(0, 25)
  }, [snapshot, query])

  if (state === 'loading') {
    return <p className="mt-6 text-sm text-muted">Opening your saved product list…</p>
  }

  if (state === 'empty') {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface-muted p-4 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackageX className="h-4 w-4" aria-hidden="true" />
          No saved product list on this device
        </p>
        <p className="mt-2 text-sm text-muted-strong">
          Sign in once with a connection and open Inventory or Sales. The list is saved
          automatically after that, and will be here next time you lose signal.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 text-left">
      <p className="flex items-center gap-2 text-xs font-medium text-warning">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Saved list from {snapshot ? snapshotClock(snapshot.syncedAt) : 'unknown'} · prices and
        stock may have changed since
      </p>

      <label className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a name, or scan/type a barcode"
          aria-label="Search saved products"
          className="min-h-[var(--control-h)] w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
      </label>

      {results.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing in the saved list matches that.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {results.map((p) => {
            const due = nextExpiry(p.batches)
            const tone = due ? expiryTone(due, today) : null
            return (
              <li key={p.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  {p.barcode && <p className="sp-num text-xs text-muted">{p.barcode}</p>}
                  {due && (
                    <p
                      className={`text-xs ${tone === 'expired' ? 'font-semibold text-danger' : tone === 'soon' ? 'font-semibold text-warning' : 'text-muted'}`}
                    >
                      {tone === 'expired' ? 'Expired' : 'Expires'} {formatExpiry(due)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="sp-num text-sm font-semibold text-foreground">
                    {formatCurrency(p.unit_price)}
                  </p>
                  <p className="sp-num text-xs text-muted">{p.stock} in stock</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
