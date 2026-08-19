'use client'

import { logout } from '@/app/auth/actions'
import { clearSnapshots } from '@/lib/offline/snapshot'
import { listQueuedSales } from '@/lib/offline/queue'

/**
 * Sign out, and take the cached store data with you.
 *
 * The wipe happens HERE, in the browser, and not in the `logout` Server Action,
 * because IndexedDB does not exist on the server. An action cannot reach it,
 * so any call site that used `logout` directly would leave one person's product
 * list, prices and stock readable on a shared shop handset after they had
 * signed out.
 *
 * Cleared BEFORE `logout()` is called, because that action ends in a
 * `redirect()`, which throws to unwind the render. Anything after it does not
 * run.
 *
 * The failure mode is chosen deliberately: if clearing throws, the sign-out
 * still proceeds. Trapping someone in a signed-in session because a database
 * they never asked for refused to open is worse than the stale cache, and the
 * next successful sign-in on this device overwrites the snapshot for that
 * store anyway.
 */
export async function signOutEverywhereLocal(): Promise<void> {
  // The store is read from the same pointer the offline page uses, rather than
  // taken as an argument. Two reasons: this is passed directly as a <form
  // action=>, which would hand it FormData instead; and a caller that forgot
  // to pass it would silently skip the warning below, which is the one thing
  // this function exists to guarantee.
  let storeId: string | null = null
  try {
    storeId = window.localStorage.getItem('sp-last-store')
  } catch {
    // Storage refused. The warning is skipped; the queue is still not cleared.
  }

  // UNSENT SALES BLOCK A SILENT SIGN-OUT. A queued sale is money the shop has
  // already taken, held nowhere but this device, and sign-out is one tap away
  // on a shared handset. Phase 3 does not sync, so signing out here and handing
  // the phone to the next person is how a real transaction disappears.
  //
  // The queue is NOT cleared either way - `idbClear` deliberately leaves it
  // alone. This only ensures nobody walks past it without being told.
  if (storeId) {
    try {
      const pending = await listQueuedSales(storeId)
      if (pending.length > 0) {
        const ok = window.confirm(
          `${pending.length} sale${pending.length === 1 ? '' : 's'} made offline ` +
            `${pending.length === 1 ? 'has' : 'have'} not reached the server yet. ` +
            `${pending.length === 1 ? 'It stays' : 'They stay'} saved on this device and will ` +
            'sync when it is back online — but nobody else can see ' +
            `${pending.length === 1 ? 'it' : 'them'} until then.

Sign out anyway?`,
        )
        if (!ok) return
      }
    } catch {
      // A queue we cannot read is not a reason to trap someone in a session.
    }
  }

  try {
    // Snapshots only. The queue survives sign-out on purpose.
    await clearSnapshots()
  } catch {
    // Deliberately swallowed - see above.
  }
  await logout()
}
