import { Caveat, Inter_Tight } from 'next/font/google'

/**
 * The landing page's faces.
 *
 * Loaded here rather than in app/layout.tsx: the signed-in app stays on Inter,
 * and pulling these into every dashboard route to style one public page would
 * be a cost paid on every page load for nothing. The auth screens load the
 * same Inter Tight through components/auth/fonts under their own variable.
 */
export const landingSans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-landing-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

/** The one handwritten annotation in the hero. */
export const landingScript = Caveat({
  subsets: ['latin'],
  variable: '--font-landing-script',
  display: 'swap',
  weight: ['500'],
})
