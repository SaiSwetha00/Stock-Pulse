import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Design samples for a landing-page redesign. NOT the landing page — that is
 * still `app/page.tsx` → `components/marketing/Landing`, untouched.
 *
 * Two guards, because these pages must never become a second public homepage:
 *
 *  1. `notFound()` on a Vercel PRODUCTION deployment. Preview deployments and
 *     local dev still render them; the production domain answers 404 even if
 *     this branch is merged by accident.
 *  2. noindex/nofollow, for every other environment a crawler might reach.
 *
 * They also sit behind the auth proxy: `/landing-preview` is not in
 * lib/supabase/middleware.ts's public list, so a signed-out visitor is sent to
 * /login. That is deliberate — adding it would mean editing the auth proxy for
 * a throwaway route. Sign in (the demo account works) to view them.
 */
export const metadata: Metadata = {
  // The root layout's title template appends "· StockPulse" already.
  title: 'Landing page design samples',
  robots: { index: false, follow: false },
}

export default function LandingPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return children
}
