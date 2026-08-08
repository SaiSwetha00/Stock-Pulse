import type { Metadata } from 'next'

/**
 * Exists only to give this segment a title.
 *
 * forgot-password/page.tsx is a client component, and a client component cannot export
 * `metadata` — Next resolves it on the server, and 'use client' has to be the
 * file's first statement regardless. A layout is a server component by
 * default, so the title lives here and the page is left exactly as it was.
 */
export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Send yourself a link to set a new password.",
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
