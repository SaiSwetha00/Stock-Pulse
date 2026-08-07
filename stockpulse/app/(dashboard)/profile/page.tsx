import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import ProfileClient from '@/components/profile/ProfileClient'

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
