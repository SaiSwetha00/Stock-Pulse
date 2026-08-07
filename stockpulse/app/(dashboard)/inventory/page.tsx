import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import InventoryClient from '@/components/inventory/InventoryClient'
import type { Product } from '@/types'

export default async function InventoryPage() {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .order('name', { ascending: true })

  return (
    <InventoryClient
      role={profile.role}
      initialProducts={(products ?? []) as Product[]}
    />
  )
}
