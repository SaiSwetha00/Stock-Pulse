import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { reportingDate } from '@/lib/reportingTimezone'
import SuppliersClient from '@/components/suppliers/SuppliersClient'
import type { Shipment, Supplier, SupplierActivity } from '@/types'

/** Shapes returned by the aggregate functions in migration 0004. */
type ActiveOrderCount = { supplier_id: string; active_orders: number }
type PalletTotals = { total_pallets: number; received_pallets: number }

export default async function SuppliersPage() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) redirect('/dashboard')

  const supabase = await createClient()
  const today = reportingDate()

  // Both counts used to be their own sequential round-trip after this block,
  // each pulling rows only to reduce them: every open shipment in the store to
  // produce one number per supplier, and every shipment due today to produce
  // two integers. They aggregate in Postgres now and join the same parallel
  // batch, so the page waits on one round of queries rather than three.
  const [
    { data: suppliers },
    { data: shipments },
    { data: activity },
    { data: orderCounts },
    { data: palletTotals },
  ] = await Promise.all([
    supabase.from('suppliers').select('*').eq('store_id', store.id).order('created_at', { ascending: true }),
    supabase
      .from('shipments')
      .select('*, suppliers(name)')
      .eq('store_id', store.id)
      .neq('status', 'dock')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('supplier_activity')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.rpc('supplier_active_order_counts'),
    supabase.rpc('shipment_pallets_on', { p_date: today }),
  ])

  // Suppliers with nothing open are absent from the result rather than zero.
  const activeOrderCounts = new Map<string, number>(
    ((orderCounts ?? []) as ActiveOrderCount[]).map((r) => [r.supplier_id, Number(r.active_orders)])
  )

  const suppliersWithOrders = (suppliers ?? []).map((s) => ({
    ...s,
    active_orders: activeOrderCounts.get(s.id) ?? 0,
  }))

  // `returns table` always yields a row here — the function coalesces a day
  // with no deliveries to 0/0 — but the optional chain covers the RPC failing.
  const pallets = ((palletTotals ?? []) as PalletTotals[])[0]
  const totalPallets = Number(pallets?.total_pallets ?? 0)
  const receivedPallets = Number(pallets?.received_pallets ?? 0)

  return (
    <SuppliersClient
      suppliers={suppliersWithOrders as Supplier[]}
      shipments={(shipments ?? []) as Shipment[]}
      activity={(activity ?? []) as SupplierActivity[]}
      totalPallets={totalPallets}
      receivedPallets={receivedPallets}
    />
  )
}
