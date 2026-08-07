import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Landing from '@/components/marketing/Landing'

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
 * Anyone signed out gets the landing, with the sign-in card on the hero.
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

  // Only ever reached signed out — the redirect above guarantees it, so the
  // ported landing page (below) doesn't need a signedIn prop at all.
  return <Landing />
}
