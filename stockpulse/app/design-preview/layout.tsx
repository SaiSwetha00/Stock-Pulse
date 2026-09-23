import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Visual design explorations — NOT the landing page, which is still
 * app/page.tsx. Hero mockups only.
 *
 * Two guards, so these can never become a second public homepage:
 *  1. notFound() on a Vercel PRODUCTION deployment (local dev and preview
 *     deployments still render them).
 *  2. noindex/nofollow everywhere else.
 *
 * They also sit behind the auth proxy — /design-preview is not in
 * lib/supabase/middleware.ts's public list, so a signed-out visitor is sent
 * to /login. That is deliberate: no auth code is touched for a throwaway route.
 */
export const metadata: Metadata = {
  title: 'Design directions',
  robots: { index: false, follow: false },
}

export default function DesignPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return children
}
