'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/supabase/recovery'
import { isAssignableRole, ROLE_LABELS, type AssignableRole } from '@/lib/permissions'
import { notify } from '@/app/(dashboard)/notifications/actions'
import { redirect } from 'next/navigation'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'

/** The actor's messages, from their language cookie — see ServerCopy. */
async function serverCopy() {
  return appCopy(await getLocale())
}

export async function signUpOwner(formData: {
  storeName: string
  fullName: string
  email: string
  password: string
}) {
  // `not null` is not `not blank`. The signup form checks these, but a client
  // check is a convenience and a crafted request skips it entirely — and this
  // is the action that CREATES the store, so an unguarded blank here births a
  // nameless shop rather than merely blanking an existing one. Same defect
  // Settings carried until Phase 3C-ii; this is where the row starts.
  const storeName = formData.storeName.trim()
  const fullName = formData.fullName.trim()
  const email = formData.email.trim()

  const t = (await serverCopy()).server
  if (!storeName) return { error: t.storeNameRequired }
  if (storeName.length > 120) return { error: t.storeNameTooLong }
  if (!fullName) return { error: t.nameRequired }
  if (fullName.length > 120) return { error: t.nameTooLong }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: formData.password,
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: t.accountFailed }

  const admin = createAdminClient()

  const { data: store, error: storeError } = await admin
    .from('stores')
    .insert({ name: storeName })
    .select()
    .single()

  if (storeError) return { error: storeError.message }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    store_id: store.id,
    full_name: fullName,
    email,
    role: 'owner',
    job_title: 'Store Owner',
  })

  if (profileError) return { error: profileError.message }

  redirect('/dashboard')
}

export async function login(formData: { email: string; password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(email: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Deliberately not the SSR client: it forces PKCE, which binds the link to
  // the requesting browser. See lib/supabase/recovery.ts. Implicit flow puts
  // the tokens in the link's #fragment, so the email can be opened on a phone
  // after requesting on a laptop. A fragment never reaches the server, so this
  // targets the page directly rather than /auth/callback.
  return sendPasswordResetEmail(email, `${origin}/reset-password`)
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Shared gate for the invite management actions.
 *
 * `inviteStaff` keeps its own inline copy: it predates this and works, and
 * rewriting a correct authorization check to save six lines is how a
 * regression gets introduced somewhere nobody is looking.
 *
 * Returns the requester's store so callers can scope by it. Never trust a
 * store id from the client — everything below is reached through the admin
 * client, which bypasses RLS entirely.
 */
async function requireOwner(): Promise<
  { error: string } | { userId: string; storeId: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const t = (await serverCopy()).server
  if (!user) return { error: t.notAuthenticated }

  const { data: requester } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user.id)
    .single()

  if (!requester || requester.role !== 'owner') {
    return { error: t.ownerOnlyInvites }
  }
  return { userId: user.id, storeId: requester.store_id as string }
}

/**
 * Reads a pending invite and confirms it is one.
 *
 * The `invited` check is the important one. Both callers below are destructive
 * or near-destructive, and neither should ever be able to reach a colleague who
 * has already accepted and been working in the shop for a month — "resend an
 * invitation" and "delete an active user account" must not be one button away
 * from each other.
 */
async function loadPendingInvite(profileId: string, storeId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, role, invited, store_id')
    .eq('id', profileId)
    .eq('store_id', storeId)
    .single()

  const t = (await serverCopy()).server
  if (!profile) return { error: t.notInStore }
  if (profile.role === 'owner') return { error: t.ownerCannotRevoke }
  if (!profile.invited) {
    return { error: t.alreadyAccepted }
  }
  return { profile }
}

/** Shared by invite and resend: both hit the same throttled sender. */
async function inviteErrorMessage(error: { status?: number; message: string }): Promise<string> {
  const rateLimited = error.status === 429 || /rate limit|too many/i.test(error.message)
  if (rateLimited) return (await serverCopy()).server.inviteRateLimited
  return error.message
}

export async function resendInvite(profileId: string) {
  const gate = await requireOwner()
  if ('error' in gate) return { error: gate.error }

  const found = await loadPendingInvite(profileId, gate.storeId)
  if ('error' in found) return { error: found.error }

  const admin = createAdminClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Same call as the original invitation. Supabase reissues the link for an
  // existing unconfirmed user rather than erroring, so there is no separate
  // "resend" endpoint to reach for.
  const { error } = await admin.auth.admin.inviteUserByEmail(found.profile.email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) return { error: await inviteErrorMessage(error) }
  return { success: true }
}

export async function revokeInvite(profileId: string) {
  const gate = await requireOwner()
  if ('error' in gate) return { error: gate.error }

  const found = await loadPendingInvite(profileId, gate.storeId)
  if ('error' in found) return { error: found.error }

  const admin = createAdminClient()

  // Auth user first. If this succeeds and the profile delete then fails, the
  // leftover row is visible and fixable; the reverse order would leave an
  // account that can still sign in with no profile behind it, which fails in
  // ways that are much harder to trace.
  const { error: authError } = await admin.auth.admin.deleteUser(profileId)
  if (authError) return { error: authError.message }

  const { error: profileError } = await admin.from('profiles').delete().eq('id', profileId)
  if (profileError) return { error: profileError.message }

  const tn = (await serverCopy()).server
  await notify({
    title: tn.notifRevokedTitle,
    body: tn.notifRevokedBody.replace('{name}', found.profile.full_name),
    audience: 'managers',
    kind: 'staff',
    entity: 'profiles',
    entityId: profileId,
  })

  return { success: true }
}

export async function inviteStaff(formData: {
  storeId: string
  fullName: string
  email: string
  jobTitle: string
  role: AssignableRole
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const copy = await serverCopy()
  const t = copy.server
  if (!user) return { error: t.notAuthenticated }

  const { data: requester } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user.id)
    .single()

  if (!requester || requester.role !== 'owner' || requester.store_id !== formData.storeId) {
    return { error: t.ownerOnlyAddStaff }
  }

  // Same reason as signUpOwner: the insert below goes through the admin client
  // and bypasses RLS, so nothing downstream will catch a blank name. An invited
  // colleague with `full_name: ''` renders as a nameless row in the roster, the
  // rota and every audit entry that names them.
  const inviteName = formData.fullName.trim()
  if (!inviteName) return { error: t.inviteNameRequired }
  if (inviteName.length > 120) return { error: t.inviteNameTooLong }

  // Re-checked on the server even though the form offers only two options: the
  // parameter is whatever the caller sent, and the insert below goes through
  // the admin client, which bypasses RLS. 'owner' must never pass here — see
  // ASSIGNABLE_ROLES for why.
  if (!isAssignableRole(formData.role)) {
    return { error: t.inviteBadRole }
  }

  const admin = createAdminClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // createAdminClient uses plain @supabase/supabase-js, which defaults to the
  // implicit flow — so invite links already arrive with tokens in the #fragment
  // and must go straight to the page. Routing them via /auth/callback would
  // strand the invite: a server route never sees a fragment.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    formData.email,
    { redirectTo: `${origin}/reset-password` }
  )

  // Supabase's built-in SMTP allows only a handful of messages per hour and its
  // own docs call it testing-only. The raw error is a bare 429, which reads as
  // an app bug and sends the next person debugging this function, where nothing
  // is wrong — inviteErrorMessage names the layer that actually failed.
  if (inviteError) return { error: await inviteErrorMessage(inviteError) }
  if (!invited.user) return { error: t.staffAccountFailed }

  const { error: profileError } = await admin.from('profiles').insert({
    id: invited.user.id,
    store_id: formData.storeId,
    full_name: inviteName,
    email: formData.email.trim(),
    role: formData.role,
    // Falls back to the role's own label rather than a hardcoded 'Staff', so
    // an invited manager whose job title was left blank does not read as staff
    // everywhere the title is shown.
    job_title: formData.jobTitle || ROLE_LABELS[formData.role],
    invited: true,
  })

  if (profileError) return { error: profileError.message }

  // 'managers' rather than 'store': who joined the team and in what role is
  // management information, and the staff view is deliberately limited to
  // notifications addressed to that person.
  await notify({
    title: t.notifInvitedTitle,
    body: t.notifInvitedBody
      .replace('{name}', formData.fullName)
      .replace('{role}', copy.roles[formData.role]),
    audience: 'managers',
    kind: 'staff',
    entity: 'profiles',
    entityId: invited.user.id,
  })

  return { success: true }
}
