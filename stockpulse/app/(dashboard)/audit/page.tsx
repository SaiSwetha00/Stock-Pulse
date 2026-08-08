import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import type { AuditLog } from '@/lib/audit'
import AuditLogClient from '@/components/audit/AuditLogClient'

export const metadata: Metadata = {
  title: "Activity",
  description: "A record of who changed what, and when.",
  robots: { index: false, follow: false },
}

/**
 * Most recent entries only. The table grows with every write in the store, so
 * an unbounded select would eventually ship megabytes to the browser; the
 * filters operate within this window. Moving the filters server-side is the
 * next step once a store outgrows it.
 */
const MAX_ENTRIES = 500

export default async function AuditPage() {
  const { profile, store } = await getCurrentUser()
  // Belt and braces: the RLS policy already restricts this table to owners,
  // so a staff member would simply see nothing. Redirecting is the clearer
  // outcome, and it matches how /reports behaves.
  if (profile.role !== 'owner') redirect('/dashboard')

  const supabase = await createClient()

  const { data } = await supabase
    .from('audit_logs')
    .select('id, actor_email, action, entity, entity_id, before, after, created_at')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(MAX_ENTRIES)

  return <AuditLogClient logs={(data ?? []) as AuditLog[]} />
}
