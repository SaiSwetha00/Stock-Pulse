import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingNavy from '@/components/landing/LandingNavy'
import { LOCALE_COOKIE, toLocale } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'StockPulse — Store operations for independent grocers',
  description:
    'Inventory, point of sale, staff and suppliers, held in one calm place. Built for the shops that feed a neighbourhood. Free while we are in beta.',
}

/**
 * The public landing page.
 *
 * Signed-in visitors never see it: they are sent straight to the dashboard.
 * Someone who already has an account is coming here to get to their shop, not
 * to read the pitch again, and making them click through a marketing page to
 * reach it is friction with nothing on the other side of it.
 *
 * Anyone signed out gets components/landing/LandingNavy — the approved navy
 * design, reviewed as /design-exploration/3/full, which that route still
 * renders so preview and production cannot drift. It replaced a
 * white-and-green page (components/landing/LandingPage, deleted with its
 * ProductUI and MobileMenu); the older dark/gold components/marketing landing
 * had already stopped being rendered here.
 *
 * `getUser()` rather than `getSession()`: the former revalidates the token with
 * Supabase, and this decides whether someone is shown their own workspace. The
 * cost is one round trip on a route that is dynamic either way.
 */
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  // The visitor's chosen language, read on the SERVER so the page is rendered
  // in it from the first byte — no flash of English, no hydration mismatch.
  // Free here: this route is already dynamic because of the getUser() call
  // above, so a cookie read costs nothing. Deliberately not done in
  // app/layout.tsx, which every route shares and where it would make /login,
  // /privacy and /terms dynamic too. Anything other than the three supported
  // codes falls back to English inside toLocale().
  const locale = toLocale((await cookies()).get(LOCALE_COOKIE)?.value)

  // Only ever reached signed out — the redirect above guarantees it, so the
  // landing page (below) doesn't need a signedIn prop at all.
  return <LandingNavy locale={locale} />
}
