import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Design explorations, round 2 — first-screen hero mockups only. NOT the
 * landing page, which is still app/page.tsx.
 *
 * The same two guards as /design-preview, so these can never become a second
 * public homepage: notFound() on a Vercel PRODUCTION deployment, and
 * noindex/nofollow everywhere else. Like /design-preview they sit behind the
 * auth proxy (not in lib/supabase/middleware.ts's public list) — deliberately,
 * so no auth code is touched for a throwaway route.
 */
export const metadata: Metadata = {
  title: 'Design exploration',
  robots: { index: false, follow: false },
}

export default function DesignExplorationLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return children
}
