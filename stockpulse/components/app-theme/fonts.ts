import { Inter_Tight } from 'next/font/google'

/**
 * The preview theme's typeface, in a module of its own.
 *
 * It lives here rather than inside BrandPreviewTheme because two things now
 * need the generated class name and they run on opposite sides: the client
 * component that keeps the theme applied across navigations, and the
 * server-rendered boot script that applies it before the first paint. A
 * `'use client'` module cannot be read from a server component — every export
 * becomes a client reference — so the font has to sit in a plain module both
 * can import. Same arrangement as components/landing/fonts.ts.
 *
 * Loaded here rather than in app/layout.tsx so the signed-in app keeps
 * shipping only Inter until this design is approved.
 */
export const appBrandSans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-app-brand-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
