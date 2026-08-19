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
// Bumped to 2 by Offline Phase 3, which added the sale queue. The upgrade is
// ADDITIVE - `snapshots` is left untouched - so a device that already holds a
// product cache keeps it across the upgrade rather than re-downloading on a
// connection it may not have.
const DB_VERSION = 2
const STORE = 'snapshots'
/** Queued offline sales. See lib/offline/queue.ts for the record shape. */
export const QUEUE_STORE = 'queue'

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
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        // Keyed by the CLIENT-generated id, which is what makes a replay
        // idempotent: the same sale can be handed to the server twice and be
        // recognised as one. `storeId` is indexed rather than used as the key
        // because a device can hold many queued sales for one store.
        const q = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        q.createIndex('by_store', 'storeId', { unique: false })
        q.createIndex('by_created', 'createdAt', { unique: false })
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
  storeName: string = STORE,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const t = db.transaction(storeName, mode)
          const req = run(t.objectStore(storeName))
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

/** Queue reads and writes. Same failure policy as the snapshot helpers. */
export function queuePut(record: { id: string }): Promise<unknown> {
  return tx('readwrite', (s) => s.put(record) as IDBRequest<unknown>, QUEUE_STORE)
}

export function queueGetAll<T>(): Promise<T[] | null> {
  return tx<T[]>('readonly', (s) => s.getAll() as IDBRequest<T[]>, QUEUE_STORE)
}

export function queueDelete(id: string): Promise<unknown> {
  return tx('readwrite', (s) => s.delete(id) as IDBRequest<unknown>, QUEUE_STORE)
}

/**
 * Wipe everything. Called on sign-out, and that is a decision rather than
 * tidiness: the owner and two staff share one handset, so one person's product
 * list, prices and stock must not stay readable on the device after they have
 * signed out.
 */
export async function idbClear(): Promise<unknown> {
  // Snapshots only. The QUEUE IS DELIBERATELY NOT CLEARED HERE.
  //
  // A queued sale is money the shop has already taken, and sign-out is one tap
  // away on a shared handset. Wiping unsent sales because somebody changed
  // shift would destroy real transactions with no warning and no way back.
  // The caller is responsible for refusing to sign out - or for asking first -
  // while the queue is non-empty; see lib/offline/signOut.ts.
  return tx('readwrite', (s) => s.clear() as IDBRequest<unknown>)
}
