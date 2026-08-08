import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import CustomersClient from '@/components/customers/CustomersClient'
import CustomersSetupNotice from '@/components/customers/CustomersSetupNotice'
import { isMissingTableError } from '@/lib/supabase/errors'
import type { Customer } from '@/types'

export const metadata: Metadata = {
  title: "Customers",
  description: "The people who shop with you, and what they buy.",
  robots: { index: false, follow: false },
}

export default async function CustomersPage() {
  const { profile, store } = await getCurrentUser()
  // Customer records are owner-only, matching the Sidebar nav role filter.
  if (!canManage(profile.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  // The customers table ships in schema_phase4.sql, which is applied by hand in
  // the Supabase SQL editor. Until then, explain that instead of crashing.
  if (error) {
    if (isMissingTableError(error)) return <CustomersSetupNotice />
    throw new Error(error.message)
  }

  return <CustomersClient initialCustomers={(data ?? []) as Customer[]} />
}
