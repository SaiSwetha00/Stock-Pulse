import { Geist, Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google'

/**
 * One display face per concept, so the three samples differ in voice and not
 * only in colour. Body text in Concept 1 is the Inter the root layout already
 * loads (`--font-inter`), which costs nothing extra.
 *
 * Declared here rather than reusing `components/marketing/fonts.ts`: that
 * module instantiates five families for the live landing page, and importing
 * one named export from it would still evaluate all five.
 */

/** Concept 1 — Premium Minimal: an editorial serif for the headline only. */
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-lp-serif',
  display: 'swap',
})

/** Concept 2 — Modern Grocery Operations: warm, rounded geometric sans. */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-lp-jakarta',
  display: 'swap',
})

/** Concept 3 — High-End B2B SaaS: a precise neo-grotesk plus its mono. */
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-lp-geist',
  display: 'swap',
})

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-lp-geist-mono',
  display: 'swap',
})
