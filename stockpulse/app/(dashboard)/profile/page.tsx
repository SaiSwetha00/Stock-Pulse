import type { Metadata } from 'next'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import ProfileClient from '@/components/profile/ProfileClient'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.profile
  return { title, description, robots: { index: false, follow: false } }
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
