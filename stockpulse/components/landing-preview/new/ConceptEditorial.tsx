import Link from 'next/link'
import MobileMenu from '../MobileMenu'
import FadeIn from '../final/FadeIn'
import { PAGE_STYLES, PRICE, ROUTES, Wordmark, fraunces } from './shared'
import {
  APP_LIGHT_TOKENS,
  AppWindow,
  CategoryBars,
  DASHBOARD_LABEL,
  DashboardScreen,
  ExpiringCard,
  FefoCard,
  INVENTORY_LABEL,
  InventoryScreen,
  LotsCard,
  LowStockCard,
  OfflineCard,
  SNAPSHOT_LABEL,
  StockHealthCard,
} from './ProductUI'

/**
 * NEW CONCEPT 3 — Modern Editorial / Premium.
 *
 * Reads like a well-set magazine feature about a shop, not a trading desk:
 * warm paper, an optical-size serif (Fraunces) for display type, Inter for
 * everything functional, hairline rules, and almost no icons. Layouts are
 * asymmetric on a 12-column grid — the product sits off-centre and chapters
 * alternate sides — but every chapter is still one idea in plain words.
 * The only motion is the shared fade-in.
 */

const NAV = [
  { label: 'The product', href: '#chapters' },
  { label: 'Pricing', href: '#pricing' },
] as const

const serif = 'font-[family-name:var(--font-lp-fraunces)]'
const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1612]'
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1a1612] px-7 text-[15px] font-medium text-[#F4EFE6] transition-opacity hover:opacity-90 ${focus}`
const textLink = `inline-block py-2 text-[15px] font-medium text-[#1a1612] underline decoration-[#C9B99B] underline-offset-[6px] hover:decoration-[#1a1612] ${focus}`

const CHAPTERS = [
  {
    n: 'I',
    title: 'The shelf',
    body: 'Every delivery is kept as its own lot, with its own expiry date — so two batches of curd are never mistaken for one.',
    // The table needs the chapter's full width: squeezed beside the lots card
    // (~400px) its expiry column wrapped one word per line. The lots card
    // overlaps only the window's bottom padding (-mt-5 = its 20px p-5), so it
    // touches the frame without covering the last row's data.
    ui: (
      <div className="relative">
        <AppWindow sidebar={false} active="/inventory" label={INVENTORY_LABEL}>
          <InventoryScreen rows={5} />
        </AppWindow>
        <div className="relative mt-4 sm:-mt-5 sm:ml-auto sm:mr-[-1.5rem] sm:w-[55%]">
          <LotsCard />
        </div>
      </div>
    ),
  },
  {
    n: 'II',
    title: 'The counter',
    body: 'A sale takes stock from the lot that expires first. If the signal drops, sales wait on the device and sync once you’re back.',
    ui: (
      <div className="grid gap-4 sm:grid-cols-2">
        <FefoCard />
        <div className="sm:pt-12">
          <OfflineCard />
        </div>
      </div>
    ),
  },
  {
    n: 'III',
    title: 'The warning',
    body: 'Each product has its own reorder level, and each lot its own date. What needs attention surfaces before it becomes a loss.',
    ui: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:pt-10">
          <LowStockCard />
        </div>
        <ExpiringCard limit={3} />
      </div>
    ),
  },
  {
    n: 'IV',
    title: 'The week',
    body: 'Your range and the health of your stock at a glance — plus an AI assistant you can simply ask.',
    ui: (
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryBars />
        <div className="sm:pt-14">
          <StockHealthCard />
        </div>
      </div>
    ),
  },
]

const ALSO = ['Barcode scanning', 'Suppliers & purchase orders', 'Staff roles & shifts', 'An audit log of every change']

export default function ConceptEditorial() {
  return (
    <div
      className={`${fraunces.variable} min-h-screen bg-[#F4EFE6] font-[family-name:var(--font-inter)] text-[#1a1612] antialiased`}
      style={APP_LIGHT_TOKENS}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES('#F4EFE6') }} />

      <header className="sticky top-0 z-50 border-b border-[#DDD2BF] bg-[#F4EFE6]/95 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-10">
          <Link href="#top" aria-label="StockPulse, back to top" className={`rounded-md ${focus}`}>
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-[14.5px] md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`inline-block py-1.5 text-[#4a4139] hover:text-[#1a1612] ${focus}`}>
                {n.label}
              </a>
            ))}
            <Link href={ROUTES.login} className={`inline-block py-1.5 text-[#4a4139] hover:text-[#1a1612] ${focus}`}>
              Log in
            </Link>
            <Link
              href={ROUTES.signup}
              className={`inline-flex h-10 items-center rounded-full border border-[#1a1612] px-5 font-medium transition-colors hover:bg-[#1a1612] hover:text-[#F4EFE6] ${focus}`}
            >
              Get started
            </Link>
          </nav>
          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Get started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
              { label: 'Explore the demo store', href: ROUTES.demo, className: `py-2 text-center text-[15px] font-medium ${focus}` },
              { label: 'Log in', href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#4a4139] ${focus}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-full border border-[#DDD2BF] ${focus}`}
            panelClass="absolute inset-x-0 top-16 border-b border-[#DDD2BF] bg-[#F4EFE6] px-5 pb-6 pt-2"
            linkClass={`block border-b border-[#DDD2BF] py-3.5 text-[16px] ${focus}`}
          />
        </div>
      </header>

      <main id="top">
        {/* Hero — asymmetric: headline across 8 columns, the working words in the last 4 */}
        <section aria-labelledby="hero-h" className="mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-10 sm:pt-24">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.18em] text-[#8a6206]">
            Store management for independent grocers
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <h1
              id="hero-h"
              className={`${serif} text-balance text-[clamp(3rem,8.4vw,7rem)] font-normal leading-[0.95] tracking-[-0.035em] lg:col-span-8`}
            >
              A calmer way to run <em className="italic text-[#8a6206]">the shop.</em>
            </h1>
            <div className="lg:col-span-4 lg:pb-3">
              <p className="text-[17px] leading-relaxed text-[#4a4139]">
                StockPulse keeps your stock, expiry dates, sales and suppliers in one place, so the morning starts with a list
                — not a guess.
              </p>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
                <Link href={ROUTES.signup} className={`${btnPrimary} w-full sm:w-auto`}>
                  Get started free
                </Link>
                <Link href={ROUTES.demo} className={textLink}>
                  Explore the demo store
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-[#6b6157]">Free while in beta · No card required</p>
            </div>
          </div>
        </section>

        {/* The product, set off-centre on the grid */}
        <section aria-label="The StockPulse dashboard" className="mx-auto max-w-7xl px-4 pb-20 sm:px-10 sm:pb-28">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="order-2 text-[13px] leading-relaxed text-[#6b6157] lg:order-1 lg:col-span-2 lg:pt-6">
              <span className={`${serif} block text-[22px] italic leading-tight text-[#1a1612]`}>The dashboard.</span>
              The demo store as it stood on {SNAPSHOT_LABEL} — real screens, real stock.
            </p>
            <div className="order-1 lg:order-2 lg:col-span-10">
              <AppWindow label={DASHBOARD_LABEL}>
                <DashboardScreen />
              </AppWindow>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section id="chapters" aria-labelledby="chapters-h" className="scroll-mt-16 border-t border-[#DDD2BF] bg-[#FBF8F2]">
          <h2 id="chapters-h" className="sr-only">
            What StockPulse does
          </h2>
          <div className="mx-auto max-w-7xl divide-y divide-[#E6DDCC] px-5 sm:px-10">
            {CHAPTERS.map((c, i) => (
              <FadeIn key={c.n} className="grid gap-10 py-20 sm:py-24 lg:grid-cols-12 lg:gap-8">
                <div className={`lg:col-span-4 ${i % 2 ? 'lg:order-2 lg:col-start-9' : ''}`}>
                  <p className={`${serif} text-[56px] leading-none text-[#b09a6c]`} aria-hidden="true">
                    {c.n}
                  </p>
                  <h3 className={`${serif} mt-5 text-[clamp(2rem,3.4vw,2.75rem)] font-normal leading-[1.05] tracking-[-0.02em]`}>
                    {c.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-[16.5px] leading-relaxed text-[#4a4139]">{c.body}</p>
                </div>
                <div aria-hidden="true" className={`lg:col-span-7 ${i % 2 ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-6'}`}>
                  {c.ui}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* And also */}
        <section aria-label="Also included" className="border-t border-[#DDD2BF] py-14">
          <p
            className={`${serif} mx-auto max-w-5xl px-5 text-center text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug text-[#4a4139] sm:px-10`}
          >
            {ALSO.map((a, i) => (
              <span key={a}>
                {a}
                {i < ALSO.length - 1 && <span className="mx-3 text-[#b09a6c]">·</span>}
              </span>
            ))}
          </p>
        </section>

        {/* Pricing — the only one */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-16 border-t border-[#DDD2BF] bg-[#FBF8F2] py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-[12.5px] font-medium uppercase tracking-[0.18em] text-[#8a6206]">Pricing</p>
              <h2 id="pricing-h" className={`${serif} mt-4 text-[clamp(4rem,10vw,8rem)] font-normal leading-none tracking-[-0.04em]`}>
                {/* Fraunces has no rupee glyph; the fallback drew a thin, mismatched ₹. Set it in Inter. */}
                <span className="font-[family-name:var(--font-inter)] font-light">₹</span>
                {PRICE.amount.replace('₹', '')}
              </h2>
              <p className={`${serif} mt-2 text-[24px] italic text-[#4a4139]`}>{PRICE.period}.</p>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-10">
              <p className="text-[17px] leading-relaxed text-[#4a4139]">{PRICE.line}</p>
              <ul className="mt-6 divide-y divide-[#E6DDCC] border-y border-[#E6DDCC]">
                {PRICE.includes.map((f) => (
                  <li key={f} className="py-2.5 text-[15px] text-[#4a4139]">
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={ROUTES.signup} className={`${btnPrimary} mt-8 w-full sm:w-auto`}>
                Get started free
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section aria-labelledby="cta-h" className="border-t border-[#DDD2BF] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-10">
            <h2 id="cta-h" className={`${serif} max-w-4xl text-balance text-[clamp(2.4rem,6vw,4.75rem)] font-normal leading-[1] tracking-[-0.03em]`}>
              See it with <em className="italic text-[#8a6206]">a real store</em> in it.
            </h2>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link href={ROUTES.demo} className={`${btnPrimary} w-full sm:w-auto`}>
                Explore the demo store
              </Link>
              <Link href={ROUTES.signup} className={textLink}>
                Or get started free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DDD2BF] py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-[14px] text-[#6b6157] sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Wordmark />
            <span>© 2026</span>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {[
              { l: 'Log in', h: ROUTES.login },
              { l: 'Get started', h: ROUTES.signup },
              { l: 'Demo', h: ROUTES.demo },
              { l: 'Privacy', h: ROUTES.privacy },
              { l: 'Terms', h: ROUTES.terms },
            ].map((x) => (
              <li key={x.h}>
                <Link href={x.h} className={`inline-block py-1 hover:text-[#1a1612] ${focus}`}>
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
