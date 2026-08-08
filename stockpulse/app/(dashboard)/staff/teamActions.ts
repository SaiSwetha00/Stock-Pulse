'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAssignableRole, ROLE_LABELS, type AssignableRole } from '@/lib/permissions'
import { notify } from '@/app/(dashboard)/notifications/actions'
import type { Role } from '@/types'

export type TeamActionResult = { ok: true } | { ok: false; message: string }

/**
 * Team administration is owner-only, deliberately narrower than `canManage`.
 *
 * `lib/permissions.ts` reserves hiring to the owner and migration 0002 does the
 * same in the database — a manager runs the shop but does not decide who works
 * in it or at what level. Every write below goes through the admin client,
 * which bypasses RLS entirely, so this is the only check standing between a
 * crafted request and someone granting themselves a role.
 *
 * Returns the caller's own id alongside the store: several of the actions below
 * have to refuse to act on the requester themselves.
 */
async function requireOwner(): Promise<
  { error: string } | { userId: string; storeId: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: requester } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user.id)
    .single()

  if (!requester || requester.role !== 'owner') {
    return { error: 'Only the store owner can manage the team.' }
  }
  return { userId: user.id, storeId: requester.store_id as string }
}

type TeamMemberRow = {
  id: string
  full_name: string
  email: string
  role: Role
  job_title: string | null
  invited: boolean
  store_id: string
}

/**
 * Loads a team member the caller is allowed to act on.
 *
 * Three refusals, each covering a different way this goes wrong:
 *   - a profile in another store (the store_id filter — the admin client would
 *     happily return anyone's row otherwise)
 *   - the caller's own row, so an owner cannot demote or lock out themselves
 *     and leave the store with nobody able to administer it
 *   - any row whose role is 'owner', for the same reason from the other side
 *
 * The failure shape is TeamActionResult's own, so a caller forwards a refusal
 * with `return found` rather than rebuilding the message. `ok` is a literal
 * discriminant deliberately: an earlier version keyed off an optional `error`
 * property, and TypeScript narrows such a property without narrowing the union
 * it sits in — every caller then had to re-check what it had already checked.
 */
async function loadTeamMember(
  profileId: string,
  storeId: string,
  requesterId: string,
): Promise<{ ok: false; message: string } | { ok: true; profile: TeamMemberRow }> {
  if (profileId === requesterId) {
    return { ok: false, message: 'You cannot change your own role or access from here.' }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, email, role, job_title, invited, store_id')
    .eq('id', profileId)
    .eq('store_id', storeId)
    .single()

  if (!profile) return { ok: false, message: 'That team member is not in this store.' }
  if (profile.role === 'owner') {
    return { ok: false, message: 'The store owner’s account cannot be changed from here.' }
  }
  return { ok: true, profile: profile as TeamMemberRow }
}

/**
 * Rename, retitle and re-role one team member.
 *
 * Role is re-validated with `isAssignableRole` rather than trusted from the
 * form: the select offers two options, but the parameter is whatever the caller
 * sent, and 'owner' reaching the update below would mint a second owner.
 */
export async function updateTeamMember(input: {
  profileId: string
  fullName: string
  jobTitle: string
  role: AssignableRole
}): Promise<TeamActionResult> {
  const gate = await requireOwner()
  if ('error' in gate) return { ok: false, message: gate.error }

  const found = await loadTeamMember(input.profileId, gate.storeId, gate.userId)
  if (!found.ok) return found

  const fullName = input.fullName.trim()
  if (!fullName) return { ok: false, message: 'A name is required.' }
  if (!isAssignableRole(input.role)) {
    return { ok: false, message: 'Choose a valid role for this team member.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      // Falls back to the role's label rather than storing an empty string, so
      // a manager whose title was cleared does not read as untitled everywhere
      // the job title is shown.
      job_title: input.jobTitle.trim() || ROLE_LABELS[input.role],
      role: input.role,
    })
    .eq('id', input.profileId)
    .eq('store_id', gate.storeId)

  if (error) return { ok: false, message: error.message }

  if (found.profile.role !== input.role) {
    await notify({
      title: 'Team role changed',
      body: `${fullName} is now ${ROLE_LABELS[input.role]}.`,
      audience: 'managers',
      kind: 'staff',
      entity: 'profiles',
      entityId: input.profileId,
    })
  }

  revalidatePath('/staff/team')
  revalidatePath('/staff')
  return { ok: true }
}

/**
 * Deactivate or restore a team member's access.
 *
 * Implemented as a GoTrue ban rather than a `profiles.active` column, and that
 * is the point: banning revokes the ability to sign in immediately and holds at
 * the next token refresh for anyone already signed in, while leaving the
 * profile row intact. Deleting the profile instead would orphan every sale,
 * shift and audit entry naming them — `sales.sold_by` would stop resolving and
 * the shop's own history would develop holes.
 *
 * Reversible by construction: 'none' clears the ban and the person signs back
 * in with the password they already had. The 100-year duration is GoTrue's
 * idiom for indefinite; it has no concept of a permanent ban.
 */
export async function setTeamMemberActive(
  profileId: string,
  active: boolean,
): Promise<TeamActionResult> {
  const gate = await requireOwner()
  if ('error' in gate) return { ok: false, message: gate.error }

  const found = await loadTeamMember(profileId, gate.storeId, gate.userId)
  if (!found.ok) return found

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(profileId, {
    ban_duration: active ? 'none' : '876000h',
  })

  if (error) return { ok: false, message: error.message }

  await notify({
    title: active ? 'Team member reactivated' : 'Team member deactivated',
    body: active
      ? `${found.profile.full_name} can sign in again.`
      : `${found.profile.full_name} can no longer sign in. Their history is kept.`,
    audience: 'managers',
    kind: 'staff',
    entity: 'profiles',
    entityId: profileId,
  })

  revalidatePath('/staff/team')
  revalidatePath('/staff')
  return { ok: true }
}
