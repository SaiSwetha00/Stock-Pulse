import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import InventoryClient from '@/components/inventory/InventoryClient'
import type { Product } from '@/types'

export const metadata: Metadata = {
  title: "Inventory",
  description: "Every product you stock, what is running low, and what is close to expiry.",
  robots: { index: false, follow: false },
}

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
      storeId={store.id}
      initialProducts={(products ?? []) as Product[]}
    />
  )
}
