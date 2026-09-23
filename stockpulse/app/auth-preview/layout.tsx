import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Authentication design concepts — MOCKUPS ONLY.
 *
 * The real auth pages are app/login, /signup, /forgot-password and
 * /reset-password and are untouched. Every form under this route is inert:
 * nothing here imports a Server Action or a Supabase client, so this cannot
 * become a second way to sign in.
 *
 * Same two guards as the other preview routes: notFound() on a Vercel
 * PRODUCTION deployment, and noindex/nofollow everywhere else. It also sits
 * behind the auth proxy, like /design-preview and /design-exploration.
 */
export const metadata: Metadata = {
  title: 'Authentication concepts',
  robots: { index: false, follow: false },
}

export default function AuthPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return children
}
