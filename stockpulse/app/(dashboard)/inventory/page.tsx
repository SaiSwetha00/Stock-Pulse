import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { getStoreCategories } from '@/lib/categories'
import { reportingDate } from '@/lib/reportingTimezone'
import { storeExpiryWarningDays } from '@/lib/expiry'
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

  const [{ data: products }, { categories }] = await Promise.all([
    // The embed, not a second query: PostgREST resolves it through 0016's
    // composite FK (store_id, product_id) -> products (store_id, id), so the
    // lots arrive in the same round trip and cannot come from another store.
    // Measured against the hosted schema before being written here.
    supabase
      .from('products')
      .select('*, product_batches(*)')
      .eq('store_id', store.id)
      .order('name', { ascending: true }),
    // The product form's dropdown, the filter row and the CSV export all read
    // their labels from this. Before 0013 it was a constant in three files.
    getStoreCategories(supabase, store.id),
  ])

  return (
    <InventoryClient
      role={profile.role}
      storeId={store.id}
      initialProducts={(products ?? []) as Product[]}
      categories={categories}
      // Computed here, on the shop's clock, and passed down rather than read
      // in the browser. An "Expired" badge decided by `new Date()` inside a
      // client component can differ between the server render and hydration
      // for anyone browsing near midnight, and React would swap it under them.
      today={reportingDate()}
      // Phase 4: the tone of an expiry has to follow the SHOP's window, not a
      // constant. Until now expiryTone() carried its own hardcoded 7, so a
      // store that moved this setting would have seen the dashboard and this
      // list disagree about the same lot.
      expiryWarningDays={storeExpiryWarningDays(store)}
    />
  )
}
