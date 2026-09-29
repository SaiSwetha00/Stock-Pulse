import type { Metadata } from 'next'
import { authCopy } from '@/lib/i18n/auth'
import { AuthCopyProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'

/**
 * Carries the chosen language into the auth pages.
 *
 * All four auth pages are Client Components, so they cannot read the cookie
 * themselves; reading it in the browser would mean rendering English and
 * swapping it after hydration — a visible flip on the very first screen after
 * somebody picks a language. A route layout is a Server Component, so it can
 * resolve the dictionary and hand it down, and the page arrives already in the
 * right language.
 *
 * WHY A LAYOUT RATHER THAN A REWRITE. The alternative was turning each
 * page.tsx into a server wrapper around a new client component, moving ~750
 * lines of working sign-in code between files for no behavioural gain. A
 * layout adds one level to the React tree and changes no URL, no Server
 * Action, no redirect and no auth logic.
 *
 * Each of the four routes re-exports this as its own layout, so there is one
 * copy of the behaviour rather than four that can drift.
 *
 * It does make those four routes dynamic, since it reads a cookie. They are
 * forms whose prerendering bought nothing, and the root layout is deliberately
 * left alone so /privacy, /terms and the rest stay static.
 */
/**
 * The auth pages' title and description in the visitor's language. They had
 * none of their own and inherited the root layout's English default.
 * `absolute` keeps the root "%s · StockPulse" template from repeating the name.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = authCopy(await getLocale()).meta
  return { title: { absolute: title }, description }
}

export default async function AuthLocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <AuthCopyProvider locale={locale} copy={authCopy(locale)}>
      {children}
    </AuthCopyProvider>
  )
}
