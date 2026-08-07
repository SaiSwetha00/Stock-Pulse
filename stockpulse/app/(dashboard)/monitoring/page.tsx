import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import MonitoringClient from '@/components/monitoring/MonitoringClient'
import type { CheckoutStation } from '@/types'

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
