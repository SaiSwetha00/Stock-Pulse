import type { Metadata } from 'next'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import CustomersClient from '@/components/customers/CustomersClient'
import CustomersSetupNotice from '@/components/customers/CustomersSetupNotice'
import { isMissingTableError } from '@/lib/supabase/errors'
import type { Customer } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.customers
  return { title, description, robots: { index: false, follow: false } }
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
