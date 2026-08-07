'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/supabase/recovery'
import { isAssignableRole, ROLE_LABELS, type AssignableRole } from '@/lib/permissions'
import { notify } from '@/app/(dashboard)/notifications/actions'
import { redirect } from 'next/navigation'

export async function signUpOwner(formData: {
  storeName: string
  fullName: string
  email: string
  password: string
}) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Could not create account. Please try again.' }

  const admin = createAdminClient()

  const { data: store, error: storeError } = await admin
    .from('stores')
    .insert({ name: formData.storeName })
    .select()
    .single()

  if (storeError) return { error: storeError.message }

  const { error: profileError } = await admin.from('profiles').insert({
    id: authData.user.id,
    store_id: store.id,
    full_name: formData.fullName,
    email: formData.email,
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
  if (!user) return { error: 'Not authenticated' }

  const { data: requester } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', user.id)
    .single()

  if (!requester || requester.role !== 'owner' || requester.store_id !== formData.storeId) {
    return { error: 'Only the store owner can add staff.' }
  }

  // Re-checked on the server even though the form offers only two options: the
  // parameter is whatever the caller sent, and the insert below goes through
  // the admin client, which bypasses RLS. 'owner' must never pass here — see
  // ASSIGNABLE_ROLES for why.
  if (!isAssignableRole(formData.role)) {
    return { error: 'Choose a valid role for this team member.' }
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

  if (inviteError) return { error: inviteError.message }
  if (!invited.user) return { error: 'Could not create staff account.' }

  const { error: profileError } = await admin.from('profiles').insert({
    id: invited.user.id,
    store_id: formData.storeId,
    full_name: formData.fullName,
    email: formData.email,
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
    title: 'New team member invited',
    body: `${formData.fullName} was invited as ${ROLE_LABELS[formData.role]}.`,
    audience: 'managers',
    kind: 'staff',
    entity: 'profiles',
    entityId: invited.user.id,
  })

  return { success: true }
}
