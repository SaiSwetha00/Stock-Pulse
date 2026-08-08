import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import ProfileClient from '@/components/profile/ProfileClient'

export const metadata: Metadata = {
  title: "Profile",
  description: "Your name, photo, contact details and password.",
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()

  const [{ count: itemsManaged }, { count: staffCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('store_id', store.id),
  ])

  return (
    <ProfileClient
      profile={profile}
      itemsManaged={itemsManaged ?? 0}
      staffCount={staffCount ?? 0}
    />
  )
}
