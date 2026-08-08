import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import PageHeader from '@/components/ui/PageHeader'
import SupportClient, { type SupportRequestRow } from '@/components/support/SupportClient'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Requests raised from the Help Centre.',
}

export default async function SupportPage() {
  const { profile } = await getCurrentUser()
  // Mirrors the RLS policy and this route's NAV_ITEMS roles. All three must
  // agree, or the nav offers a link that bounces.
  if (!canManage(profile.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase
    .from('support_requests')
    .select('id, reference, name, email, category, message, created_at, status, resolved_at')
    // Open first, then newest — matching the index added in 0010, so the sort
    // is served rather than computed.
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)

  const requests = (data ?? []) as SupportRequestRow[]
  const openCount = requests.filter((r) => r.status === 'open').length

  return (
    <div className="sp-page">
      <PageHeader
        eyebrow="Support"
        title="Help requests"
        description={
          openCount > 0
            ? `${openCount} request${openCount === 1 ? '' : 's'} waiting on a reply.`
            : 'Everything raised from the Help Centre, and what has been dealt with.'
        }
      />
      <SupportClient requests={requests} />
    </div>
  )
}
