import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, Store } from '@/types'

/**
 * Memoized for the lifetime of one request. The dashboard layout and the page
 * inside it both call this, which otherwise means running the auth check and
 * both lookups twice per navigation.
 *
 * This is React's per-request cache, not `use cache` — the result is
 * user-specific and must never be shared across requests.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<{
  profile: Profile
  store: Store
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // One round-trip, not two. The store lookup used to wait on the profile
  // purely to read profile.store_id, which made it a serial hop on every
  // authenticated request. PostgREST can embed the related row over the
  // existing profiles.store_id -> stores.id foreign key, so both come back
  // together.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, stores(*)')
    .eq('id', user.id)
    .single<Profile & { stores: Store | null }>()

  if (!profile) redirect('/login')

  const { stores: store, ...rest } = profile
  if (!store) redirect('/login')

  return { profile: rest as Profile, store }
})
