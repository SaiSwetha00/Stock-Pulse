import { findProductByBarcode } from '@/app/(dashboard)/inventory/actions'
import { isValidBarcode } from '@/lib/validation/product'
import { loadSnapshot, type CachedProduct } from '@/lib/offline/snapshot'
import type { Product } from '@/types'

/**
 * ONE entry point for "what product has this barcode", online or off.
 *
 * The brief said not to write a second matcher that can drift from the first,
 * so this is not a parallel implementation — it is the same three rules
 * applied to whichever source can answer:
 *
 *   1. the same shape test, `isValidBarcode`, now exported from
 *      lib/validation/product.ts and shared with the Server Action rather than
 *      copied — the action carried its own inline regex until this phase;
 *   2. the same store scoping — the cache is keyed by `storeId`, so an offline
 *      lookup cannot reach another store's row for the same reason the online
 *      query cannot: there is no code path that asks without saying whose;
 *   3. the same discriminated result, in which `product: null` is a SUCCESSFUL
 *      answer meaning "no product has this barcode" (D17), distinct from a
 *      failure.
 *
 * What differs is `source`, and callers must branch on it. That is deliberate
 * rather than a leak: a cached product is enough to NAME something at a shelf
 * and not enough to sell it, because Phase 2 caches reads only. Hiding the
 * difference behind a uniform type is how a cashier ends up with a sale that
 * appears to work and never reaches the server.
 */
export type LookupResult =
  | { ok: false; message: string }
  | { ok: true; source: 'server'; product: Product | null }
  | { ok: true; source: 'cache'; product: CachedProduct | null; syncedAt: string }

/**
 * Matching against the cached list. Extracted so the rule is stated once and
 * can be exercised without a database.
 *
 * Trimmed on both sides for the same reason the validator trims: a scanner can
 * hand over trailing whitespace, and `'8901030865278 ' !== '8901030865278'`
 * would be a miss that looks like a missing product.
 */
export function matchCachedBarcode(
  products: CachedProduct[],
  value: string,
): CachedProduct | null {
  const wanted = value.trim()
  return products.find((p) => (p.barcode ?? '').trim() === wanted) ?? null
}

export async function lookupBarcode(value: string, storeId: string): Promise<LookupResult> {
  const barcode = value.trim()

  // Rule 1, before either source is touched. A malformed value must not become
  // a pointless round trip online or a pointless scan of the cache offline.
  if (!isValidBarcode(barcode)) {
    return { ok: false, message: 'That is not a valid barcode.' }
  }

  const looksOffline = typeof navigator !== 'undefined' && navigator.onLine === false

  if (!looksOffline) {
    try {
      const result = await findProductByBarcode(barcode)
      // A genuine server answer — including "no such product" — wins outright.
      if (result.ok) return { ok: true, source: 'server', product: result.product }
      // `ok: false` here is the server declining for a reason it can explain
      // (a bad barcode, a missing migration). That is not a network problem,
      // and the cache cannot improve on it, so it is returned as-is.
      return result
    } catch {
      // The Server Action could not be reached. `navigator.onLine` is famously
      // optimistic — true on a captive portal, and on a phone showing bars but
      // holding no route — so the failed call, not the flag, is what proves we
      // are offline. Fall through to the cache.
    }
  }

  const snapshot = await loadSnapshot(storeId)
  if (!snapshot) {
    return {
      ok: false,
      message:
        'You are offline and this device has no saved product list yet. Reconnect once to download it.',
    }
  }

  return {
    ok: true,
    source: 'cache',
    product: matchCachedBarcode(snapshot.products, barcode),
    syncedAt: snapshot.syncedAt,
  }
}
