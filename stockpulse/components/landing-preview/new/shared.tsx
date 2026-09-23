import { Fraunces } from 'next/font/google'
import PulseMark from '../PulseMark'

/** The app's existing routes — nothing new is linked. */
export const ROUTES = {
  login: '/login',
  signup: '/signup',
  demo: '/login?demo=1',
  privacy: '/privacy',
  terms: '/terms',
} as const

/**
 * The ONE pricing statement, worded from the live landing page
 * (components/marketing/PricingPreviewSection + HeroSection): free, ₹0, no
 * tiers, no card, "free while we are in beta". Nothing here is new.
 */
export const PRICE = {
  amount: '₹0',
  period: 'while in beta',
  line: 'Every feature, for every store. No tiers and no card required.',
  includes: [
    'Unlimited products and delivery lots',
    'Sales, including offline sales that sync',
    'Low-stock and expiry alerts',
    'Suppliers and purchase orders',
    'Staff roles, shifts and audit log',
    'Reports, barcode scanning and AI assistant',
  ],
}

/** Concept 3's display face — an editorial serif with optical sizes. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-lp-fraunces',
  display: 'swap',
  // The italic is used in headlines; load the real one rather than let the browser slant the roman.
  style: ['normal', 'italic'],
  axes: ['opsz'],
})

/** The brand as the app already carries it: the pulse mark in gold, the Cinzel wordmark. */
export function Wordmark({ tone = 'ink' }: { tone?: 'ink' | 'light' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${tone === 'light' ? 'text-white' : 'text-[#14100c]'}`}>
      <PulseMark className="h-8 w-8 text-[#c9a227] [--pm-line:#14100c]" />
      <span className="font-[family-name:var(--font-cinzel-app)] text-[17px] font-semibold tracking-[0.02em]">
        StockPulse
      </span>
    </span>
  )
}

export const PAGE_STYLES = (bg: string) => `
html, body { background: ${bg}; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`
