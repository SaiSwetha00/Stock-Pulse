/**
 * The smallest IndexedDB wrapper that does this job, and no dependency.
 *
 * `idb` would read more nicely and is small, but this file needs four
 * operations, and adding a package to get them means a supply-chain surface
 * for something the platform already provides.
 *
 * WHY INDEXEDDB AND NOT THE SERVICE WORKER'S CACHE. Offline Phase 1 decided
 * the worker caches no page a signed-in user sees, because a grocery phone is
 * shared and a cached /dashboard would show the next person the previous
 * person's takings. The product snapshot is exactly that kind of data. Keeping
 * it here means it is addressed by store, wiped on sign-out, and never served
 * as the response to a request that merely looks similar.
 */

const DB_NAME = 'stockpulse-offline'
const DB_VERSION = 1
const STORE = 'snapshots'

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      // Safari in private browsing throws here rather than failing the request.
      resolve(null)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        // Keyed by storeId: one snapshot per store, which makes the tenancy
        // rule structural rather than a filter every reader must remember.
        db.createObjectStore(STORE, { keyPath: 'storeId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    // A refused or corrupt database must not break the app - it works exactly
    // as it did before this file existed, just without a cache. But it is
    // LOGGED rather than swallowed outright: a cache that silently never
    // writes is indistinguishable from one that is working, and that cost a
    // full debugging session during Phase 2 before this line existed.
    req.onerror = () => {
      console.warn('[offline] indexedDB open failed:', req.error)
      resolve(null)
    }
    req.onblocked = () => {
      console.warn('[offline] indexedDB open blocked by another connection')
      resolve(null)
    }
  })
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const t = db.transaction(STORE, mode)
          const req = run(t.objectStore(STORE))
          req.onsuccess = () => resolve(req.result as T)
          req.onerror = () => resolve(null)
          t.oncomplete = () => db.close()
        } catch (err) {
          console.warn('[offline] indexedDB transaction failed:', err)
          resolve(null)
        }
      }),
  )
}

export function idbGet<T>(storeId: string): Promise<T | null> {
  return tx<T>('readonly', (s) => s.get(storeId) as IDBRequest<T>)
}

export function idbPut(record: { storeId: string }): Promise<unknown> {
  return tx('readwrite', (s) => s.put(record) as IDBRequest<unknown>)
}

/**
 * Wipe everything. Called on sign-out, and that is a decision rather than
 * tidiness: the owner and two staff share one handset, so one person's product
 * list, prices and stock must not stay readable on the device after they have
 * signed out.
 */
export function idbClear(): Promise<unknown> {
  return tx('readwrite', (s) => s.clear() as IDBRequest<unknown>)
}
