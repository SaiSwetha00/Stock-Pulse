import { Cinzel, Cinzel_Decorative, JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google'

/**
 * The landing/auth type system. `display: 'swap'` throughout so headlines
 * paint in the fallback immediately rather than holding the hero blank.
 */

export const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
})

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
})

export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
