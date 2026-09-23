import { Inter_Tight } from 'next/font/google'

/**
 * The auth screens' typeface — the same Inter Tight the approved landing
 * design uses, so sign-in reads as the same product as the page that sent the
 * visitor there.
 *
 * Loaded here rather than in app/layout.tsx on purpose: the signed-in app is
 * still on Inter, and pulling a second family into every dashboard route to
 * style four public pages would be a cost paid on every page load for nothing.
 * `--font-auth-sans` is what components/auth/auth-theme.css resolves.
 */
export const authSans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-auth-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})
