import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/data'
import { isOwner } from '@/lib/permissions'
import TeamRosterClient, { type TeamMember } from '@/components/staff/TeamRosterClient'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: 'Team',
  description: 'Everyone who works in your store, and what they can do.',
}

/**
 * Whether a GoTrue ban is still in force.
 *
 * `banned_until` is a timestamp, not a flag: an expired one is a person who may
 * sign in perfectly well, so comparing against now is the only correct read.
 * Treating the field's mere presence as "banned" would show a reinstated
 * colleague as deactivated forever.
 */
function isBanned(bannedUntil: string | undefined): boolean {
  if (!bannedUntil) return false
  const until = new Date(bannedUntil)
  return Number.isFinite(until.getTime()) && until.getTime() > Date.now()
}

export default async function TeamPage() {
  const { profile, store } = await getCurrentUser()
  // Same guard /settings carried when this screen lived there: 0002 reserves
  // hiring and role changes to the owner. StaffTabs hides the tab for everyone
  // else, so this is the URL-typed case.
  if (!isOwner(profile.role)) redirect('/staff')

  const supabase = await createClient()
  const { data: staff } = await supabase
    .from('profiles')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: true })

  const profiles = (staff ?? []) as Profile[]

  /**
   * Sign-in status comes from the auth system, which has no `store_id` and is
   * not reachable through RLS — hence the service-role client.
   *
   * One `getUserById` per member rather than a single `listUsers`: listUsers
   * returns every user of the whole project, so a page for one shop would be
   * paging through every other shop's accounts to find five rows. These run in
   * parallel, and the roster is a shop's staff list, not a dataset.
   *
   * A failed lookup resolves to active rather than throwing. Someone whose
   * status could not be read is far better shown as normal than as locked out,
   * and the row's real controls still work either way.
   */
  const admin = createAdminClient()
  const members: TeamMember[] = await Promise.all(
    profiles.map(async (p) => {
      try {
        const { data } = await admin.auth.admin.getUserById(p.id)
        return { ...p, active: !isBanned(data.user?.banned_until) }
      } catch {
        return { ...p, active: true }
      }
    }),
  )

  return (
    <TeamRosterClient
      role={profile.role}
      storeId={store.id}
      currentUserId={profile.id}
      members={members}
    />
  )
}
