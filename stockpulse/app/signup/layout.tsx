import type { Metadata } from 'next'

/**
 * Exists only to give this segment a title.
 *
 * signup/page.tsx is a client component, and a client component cannot export
 * `metadata` — Next resolves it on the server, and 'use client' has to be the
 * file's first statement regardless. A layout is a server component by
 * default, so the title lives here and the page is left exactly as it was.
 */
export const metadata: Metadata = {
  title: "Create Your Store",
  description: "Set up StockPulse for your shop in a couple of minutes.",
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
