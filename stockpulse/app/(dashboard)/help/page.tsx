import type { Metadata } from 'next'
import HelpCenterClient from '@/components/help/HelpCenterClient'
import SupportRequestForm from '@/components/help/SupportRequestForm'
import { getCurrentUser } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Help Centre · StockPulse',
  description: 'Guides for running your store in StockPulse, and a way to reach support.',
}

/**
 * The browsing and searching half is a client component because it filters as
 * you type. The support form is seeded from the signed-in profile, which is
 * server data, so it is fetched here and passed down rather than fetched again
 * from the browser.
 */
export default async function HelpPage() {
  const { profile } = await getCurrentUser()

  return (
    <>
      <HelpCenterClient />
      <div className="mx-auto max-w-[1100px] px-6 pb-12 lg:px-8">
        <div className="max-w-xl border-t border-border pt-10">
          <SupportRequestForm defaultName={profile.full_name} defaultEmail={profile.email} />
        </div>
      </div>
    </>
  )
}
