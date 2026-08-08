import type { Metadata } from 'next'

/**
 * Exists only to give this segment a title.
 *
 * login/page.tsx is a client component, and a client component cannot export
 * `metadata` — Next resolves it on the server, and 'use client' has to be the
 * file's first statement regardless. A layout is a server component by
 * default, so the title lives here and the page is left exactly as it was.
 */
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your StockPulse store.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
