import Link from 'next/link'
import { Archive, ArrowRight, BellRing, ReceiptText } from 'lucide-react'
import FadeIn from './FadeIn'
import StockPulseMark from '@/components/brand/StockPulseMark'
import MobileMenu from './MobileMenu'
import { DashboardPreview, SNAPSHOT_LABEL, themeStyle, type LandingTheme } from './ProductUI'

/**
 * The public landing page — deliberately simple.
 *
 * Five parts and nothing else: a hero with the real dashboard, three
 * features, three steps, one line of pricing with the call to action, and a
 * footer. One accent colour, no gradients, no floating cards, one product
 * visual. The only motion is a short fade as sections scroll in.
 *
 * Two options share this component and differ only in the props app/page.tsx
 * passes: `theme` (black-and-white, or white with one deep green) and
 * `layout` (hero text centred above the dashboard, or beside it).
 *
 * Every capability named exists in the app, and the dashboard shows the demo
 * store's real data (./snapshot.ts). No statistics, testimonials or logos.
 */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
] as const

const ROUTES = { login: '/login', signup: '/signup', demo: '/login?demo=1', privacy: '/privacy', terms: '/terms' }

const PAGE_STYLES = `
html, body { background: #FFFFFF; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-accent)]'
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--lp-accent)] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--lp-accent-hover)] ${focus}`
const btnSecondary = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-6 text-[15px] font-semibold text-[#111827] transition-colors hover:border-[#111827] ${focus}`

const FEATURES = [
  { icon: Archive, title: 'Inventory', body: 'Every product and delivery, each with its own expiry date.' },
  { icon: ReceiptText, title: 'Sales', body: 'Sell at the counter — even offline. Stock updates by itself.' },
  { icon: BellRing, title: 'Alerts', body: 'Know what to reorder and what to sell first.' },
]

const STEPS = [
  { n: '1', title: 'Add your stock', body: 'Type it in or import a spreadsheet.' },
  { n: '2', title: 'Sell as usual', body: 'Log sales at the counter, or scan a barcode.' },
  { n: '3', title: 'Check the dashboard', body: 'See what’s low and what’s expiring, every morning.' },
]

export default function LandingPage({
  theme = 'mono',
  layout = 'centered',
}: {
  theme?: LandingTheme
  layout?: 'centered' | 'split'
}) {
  const split = layout === 'split'

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#111827] antialiased" style={themeStyle(theme)}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-[#F0F0F2] bg-white/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="StockPulse home" className={`rounded-md ${focus}`}>
            <Logo uid="nav" />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`inline-block py-1.5 text-[14.5px] text-[#4B5563] hover:text-[#111827] ${focus}`}>
                {n.label}
              </a>
            ))}
            <Link href={ROUTES.login} className={`inline-block py-1.5 text-[14.5px] text-[#4B5563] hover:text-[#111827] ${focus}`}>
              Login
            </Link>
            <Link href={ROUTES.signup} className={`${btnPrimary} !h-10 !px-4 !text-[14px]`}>
              Get Started
            </Link>
          </nav>
          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Get Started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
              { label: 'Try the demo', href: ROUTES.demo, className: `${btnSecondary} w-full` },
              { label: 'Login', href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#4B5563] ${focus}` },
            ]}
          />
        </div>
      </header>

      <main>
        {/* ─── Hero ─── */}
        <section aria-labelledby="hero-h">
          <div
            className={`mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 ${
              split ? 'grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]' : 'text-center'
            }`}
          >
            <div>
              <h1
                id="hero-h"
                className={`text-balance text-[clamp(2.5rem,5.4vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em] ${
                  split ? '' : 'mx-auto max-w-3xl'
                }`}
              >
                Run your grocery store from one screen.
              </h1>
              <p className={`mt-5 max-w-xl text-[17px] leading-relaxed text-[#4B5563] sm:text-[18px] ${split ? '' : 'mx-auto'}`}>
                Stock, sales and expiry dates in one simple dashboard.
              </p>
              <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${split ? '' : 'sm:justify-center'}`}>
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href={ROUTES.demo} className={btnSecondary}>
                  Try the demo
                </Link>
              </div>
              <p className="mt-4 text-[13.5px] text-[#6B7280]">Free while in beta · No card required</p>
            </div>

            <figure className={split ? '' : 'mx-auto mt-14 max-w-5xl sm:mt-16'}>
              <DashboardPreview sidebar={!split} compact={split} />
              <figcaption className="mt-3 text-center text-[12.5px] text-[#6B7280]">
                The real StockPulse dashboard · demo store, {SNAPSHOT_LABEL}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-16 border-t border-[#F0F0F2] bg-[var(--lp-tint)] py-20 sm:py-24">
          <FadeIn className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 id="features-h" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.025em]">
              What it does
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--lp-accent-soft)] text-[var(--lp-accent-ink)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#4B5563]">{body}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-[14.5px] text-[#6B7280]">
              Also: barcode scanning, suppliers, staff shifts, reports and an AI assistant.
            </p>
          </FadeIn>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-16 py-20 sm:py-24">
          <FadeIn className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 id="how-h" className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.025em]">
              How it works
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t-2 border-[var(--lp-accent)] pt-5">
                  <p className="text-[13px] font-semibold text-[var(--lp-accent-ink)]">Step {s.n}</p>
                  <h3 className="mt-1 text-[17px] font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#4B5563]">{s.body}</p>
                </li>
              ))}
            </ol>
          </FadeIn>
        </section>

        {/* ─── Pricing + call to action (the only pricing on the page) ─── */}
        <section aria-labelledby="cta-h" className="border-t border-[#F0F0F2] bg-[var(--lp-tint)] py-20 text-center sm:py-24">
          <FadeIn className="mx-auto max-w-2xl px-5">
            <h2 id="cta-h" className="text-balance text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em]">
              Free while we’re in beta.
            </h2>
            <p className="mt-3 text-[16.5px] text-[#4B5563]">Every feature, for every store. No card required.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={ROUTES.signup} className={btnPrimary}>
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.demo} className={btnSecondary}>
                Try the demo
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#F0F0F2] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 text-[14px] text-[#6B7280] sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Logo uid="footer" />
            <span>© 2026</span>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {[
              { l: 'Login', h: ROUTES.login },
              { l: 'Get Started', h: ROUTES.signup },
              { l: 'Demo', h: ROUTES.demo },
              { l: 'Privacy', h: ROUTES.privacy },
              { l: 'Terms', h: ROUTES.terms },
            ].map((x) => (
              <li key={x.h}>
                <Link href={x.h} className={`inline-block py-1 hover:text-[#111827] ${focus}`}>
                  {x.l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  )
}

/** The StockPulse mark (Icon A) with a plain wordmark. */
function Logo({ uid = 'lp' }: { uid?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <StockPulseMark uid={uid} className="h-8 w-8" />
      <span className="text-[18px] font-bold tracking-[-0.02em] text-[#111827]">StockPulse</span>
    </span>
  )
}
