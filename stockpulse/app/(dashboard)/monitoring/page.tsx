import type { Metadata } from 'next'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import MonitoringClient from '@/components/monitoring/MonitoringClient'
import type { CheckoutStation } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.monitoring
  return { title, description, robots: { index: false, follow: false } }
}

export default async function MonitoringPage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()

  const { data: stations } = await supabase
    .from('checkout_stations')
    .select('*')
    .eq('store_id', store.id)
    .order('station_number', { ascending: true })

  return (
    <MonitoringClient
      storeId={store.id}
      role={profile.role}
      stations={(stations ?? []) as CheckoutStation[]}
    />
  )
}
