import { Bricolage_Grotesque, Caveat, Geist, Inter_Tight } from 'next/font/google'

/**
 * One typeface per exploration, so the three differ in voice and not only in
 * colour. None of them is a face any earlier preview used (Inter, Archivo,
 * Fraunces), which is the point: this round is a step back, not a re-tint.
 */

/** 1 — Clean product-first: a neutral, precise UI grotesk. */
export const geist = Geist({ subsets: ['latin'], variable: '--font-dx-geist', display: 'swap' })

/** 2 — Bold creative SaaS: a grotesk with character at heavy weights. */
export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-dx-bricolage',
  display: 'swap',
})

/** 3 — Premium minimal: a tight grotesk that stays elegant at light weights. */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-dx-inter-tight',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

/** The full page's one handwritten annotation ("A simpler way to run your store"), from the approved reference. */
export const caveat = Caveat({ subsets: ['latin'], variable: '--font-dx-caveat', display: 'swap', weight: ['500'] })
