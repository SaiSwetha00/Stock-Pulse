import type { Metadata } from 'next'
import HelpCenterClient from '@/components/help/HelpCenterClient'
import SupportRequestForm from '@/components/help/SupportRequestForm'
import { getCurrentUser } from '@/lib/data'

export const metadata: Metadata = {
  // Just the page's own name. app/layout.tsx supplies the "%s · StockPulse"
  // template, so spelling the suffix out here rendered "Help Centre ·
  // StockPulse · StockPulse" in the tab.
  title: 'Help Centre',
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
      {/* sp-page, not a hand-rolled `px-6 pb-12` — the support form sits
          directly under HelpCenterClient and has to share its gutters, or the
          page has two different left edges. pt-0 because the article list
          above already ends on the rhythm. */}
      <div className="sp-page max-w-[1100px] pt-0">
        <div className="max-w-xl border-t border-border pt-10">
          <SupportRequestForm defaultName={profile.full_name} defaultEmail={profile.email} />
        </div>
      </div>
    </>
  )
}
