import type { QueuedSale } from '@/lib/offline/queue'

/**
 * Two defences against the storage layer losing a queue that holds real money.
 *
 * WebKit evicts IndexedDB under storage pressure and after a period of
 * inactivity. For a queue that is the ONLY record of a sale, an eviction is a
 * shop's takings gone — and the worst part is that it is SILENT: the app would
 * simply show fewer pending sales than there were, and nothing would
 * distinguish that from having synced them.
 *
 * Neither of these makes the queue safe on iOS. That needs a real device.
 * What they do is (a) ask the browser not to evict, and (b) make it impossible
 * for an eviction to pass unnoticed.
 */

/** Where the expected count lives. Deliberately NOT IndexedDB — see below. */
const COUNT_KEY = 'sp-queue-count'

export interface StorageState {
  /** Whether the browser has granted persistent storage for this origin. */
  persisted: boolean
  /** False when the browser has no Storage API at all (older Safari). */
  supported: boolean
}

/**
 * Ask the browser to keep this origin's storage.
 *
 * `persist()` is a REQUEST, not a command, and browsers answer it differently:
 * Chrome grants it silently for an installed PWA, Firefox may prompt, and
 * Safari has historically ignored it. So the answer is checked rather than
 * assumed — a granted request and a refused one must not look the same to the
 * rest of the app.
 *
 * Safe to call repeatedly: if permission is already held, this returns without
 * re-requesting.
 */
export async function requestPersistentStorage(): Promise<StorageState> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return { persisted: false, supported: false }
  }
  try {
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false
    if (already) return { persisted: true, supported: true }
    const granted = await navigator.storage.persist()
    return { persisted: granted, supported: true }
  } catch {
    // A refusal must never break the till.
    return { persisted: false, supported: true }
  }
}

/**
 * The queue we last knew to be true, kept in localStorage.
 *
 * NOT in IndexedDB, and that is the entire point: a witness stored in the same
 * place as the thing it witnesses is evicted along with it, and the app would
 * then "agree" that the queue had always been empty. localStorage is a separate
 * bucket with its own eviction behaviour, so a mismatch between the two is
 * evidence rather than coincidence.
 *
 * Ids are recorded as well as the count, so a queue that lost one sale and
 * gained another cannot look unchanged.
 */
export function rememberQueue(storeId: string, sales: QueuedSale[]): void {
  try {
    window.localStorage.setItem(
      `${COUNT_KEY}:${storeId}`,
      JSON.stringify({
        count: sales.length,
        ids: sales.map((s) => s.id).sort(),
        at: new Date().toISOString(),
      }),
    )
  } catch {
    // Storage refused. The check degrades to "unknown", which reports nothing
    // rather than reporting a false alarm.
  }
}

export interface IntegrityResult {
  /** False only when sales are demonstrably MISSING. */
  ok: boolean
  expected: number
  actual: number
  /** Ids the witness knew about that IndexedDB no longer returns. */
  missingIds: string[]
}

/**
 * Compare what IndexedDB returned against what was last recorded.
 *
 * Only a DISAPPEARANCE is an alarm. A queue that grew is a sale somebody just
 * made; a queue that shrank because sales synced is normal — which is why
 * `rememberQueue` is called after a successful sync as well as after a write.
 * What cannot happen legitimately is an id vanishing without this app removing
 * it, and that is the only condition reported.
 */
export function checkQueueIntegrity(storeId: string, actual: QueuedSale[]): IntegrityResult {
  const base: IntegrityResult = {
    ok: true,
    expected: actual.length,
    actual: actual.length,
    missingIds: [],
  }

  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(`${COUNT_KEY}:${storeId}`)
  } catch {
    return base
  }
  // No witness yet — a first run, or storage that refused the write. Silence is
  // correct: there is nothing to compare against, and an alarm here would fire
  // on every fresh install.
  if (!raw) return base

  try {
    const seen = JSON.parse(raw) as { count?: number; ids?: string[] }
    const knownIds: string[] = Array.isArray(seen.ids) ? seen.ids : []
    const have = new Set(actual.map((s) => s.id))
    const missingIds = knownIds.filter((id) => !have.has(id))
    return {
      ok: missingIds.length === 0,
      expected: typeof seen.count === 'number' ? seen.count : knownIds.length,
      actual: actual.length,
      missingIds,
    }
  } catch {
    // A corrupt witness is not evidence of a lost sale.
    return base
  }
}
