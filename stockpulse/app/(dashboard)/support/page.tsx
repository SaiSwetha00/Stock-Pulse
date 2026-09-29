import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import PageHeader from '@/components/ui/PageHeader'
import SupportClient, { type SupportRequestRow } from '@/components/support/SupportClient'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.support
  return { title, description }
}

export default async function SupportPage() {
  const { profile } = await getCurrentUser()
  const t = appCopy(await getLocale()).support
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
        eyebrow={t.eyebrow}
        title={t.title}
        description={
          openCount > 0
            ? (openCount === 1 ? t.waitingOne : t.waitingMany).replace('{n}', String(openCount))
            : t.allDescription
        }
      />
      <SupportClient requests={requests} />
    </div>
  )
}
