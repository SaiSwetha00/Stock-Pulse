import type { Metadata } from 'next'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import HelpCenterClient from '@/components/help/HelpCenterClient'
import SupportRequestForm from '@/components/help/SupportRequestForm'
import { getCurrentUser } from '@/lib/data'
import { localizedHelp } from '@/lib/help/localized'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.help
  return { title, description }
}

/**
 * The browsing and searching half is a client component because it filters as
 * you type. The support form is seeded from the signed-in profile, which is
 * server data, so it is fetched here and passed down rather than fetched again
 * from the browser.
 */
export default async function HelpPage() {
  const { profile } = await getCurrentUser()
  // Resolved here, in the reader's language, so the client half receives
  // only that language's text rather than importing all three.
  const { categories, articles } = localizedHelp(await getLocale())

  return (
    <>
      <HelpCenterClient categories={categories} articles={articles} />
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
