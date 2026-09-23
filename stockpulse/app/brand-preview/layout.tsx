import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Brand explorations — PREVIEWS ONLY. The production mark is still
 * components/marketing/StockPulseLogo.tsx, app/favicon.ico, app/apple-icon.png
 * and public/icons/*, none of which this route touches.
 *
 * Same guards as the other preview routes: notFound() on a Vercel PRODUCTION
 * deployment, noindex/nofollow elsewhere, and behind the auth proxy.
 */
export const metadata: Metadata = {
  title: 'Brand preview',
  robots: { index: false, follow: false },
}

export default function BrandPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return children
}
