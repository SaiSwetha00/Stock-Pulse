import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import SettingsClient from '@/components/settings/SettingsClient'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const { profile, store } = await getCurrentUser()
  if (profile.role !== 'owner') redirect('/dashboard')

  const supabase = await createClient()
  const { data: staff } = await supabase
    .from('profiles')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: true })

  return <SettingsClient store={store} staff={(staff ?? []) as Profile[]} />
}
