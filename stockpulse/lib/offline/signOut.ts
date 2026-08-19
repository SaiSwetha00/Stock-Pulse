'use client'

import { logout } from '@/app/auth/actions'
import { clearSnapshots } from '@/lib/offline/snapshot'

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
  try {
    await clearSnapshots()
  } catch {
    // Deliberately swallowed - see above.
  }
  await logout()
}
