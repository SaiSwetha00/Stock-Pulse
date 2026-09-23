import Link from 'next/link'
import { ArrowRight, Bot, Check, ScanBarcode, Truck, UserSquare2 } from 'lucide-react'
import MobileMenu from '../MobileMenu'
import FadeIn from '../final/FadeIn'
import { PAGE_STYLES, PRICE, ROUTES, Wordmark } from './shared'
import {
  APP_LIGHT_TOKENS,
  AppWindow,
  CategoryBars,
  DASHBOARD_LABEL,
  DashboardScreen,
  ExpiringCard,
  FefoCard,
  LotsCard,
  LowStockCard,
  OfflineCard,
  SNAPSHOT_LABEL,
  StockHealthCard,
} from './ProductUI'

/**
 * NEW CONCEPT 1 — Clean Premium SaaS.
 *
 * White page, one typeface (Inter), ink for action and the brand gold used
 * only as a thin accent. The hero has exactly ONE filled button; the demo is a
 * quiet secondary link. The real dashboard is the main visual, and the four
 * core jobs — Inventory, Sales, Alerts, Reports — each get one calm row with
 * real product cards beside two lines of text.
 */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
] as const

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14100c]'
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#14100c] px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 ${focus}`
const quietLink = `inline-block py-2 text-[15px] font-medium text-[#14100c] underline decoration-[#d9ccb4] underline-offset-[6px] hover:decoration-[#14100c] ${focus}`

const ROWS = [
  {
    id: 'inventory',
    tag: 'Inventory',
    title: 'Every delivery, with its own date.',
    body: 'Stock is held per delivery lot, so two batches of the same product keep two expiry dates.',
    a: <LotsCard />,
    b: null,
  },
  {
    id: 'sales',
    tag: 'Sales',
    title: 'Sell at the counter — online or off.',
    body: 'Each sale takes stock from the lot that expires first. Without signal, sales wait on the device and sync once you’re back.',
    a: <FefoCard />,
    b: <OfflineCard />,
  },
  {
    id: 'alerts',
    tag: 'Alerts',
    title: 'Know what to reorder and what to sell first.',
    body: 'Every product has its own reorder level, and every lot its own expiry date.',
    a: <LowStockCard />,
    b: <ExpiringCard limit={3} />,
  },
  {
    id: 'reports',
    tag: 'Reports',
    title: 'The whole store, at a glance.',
    body: 'See your range and the health of your stock without building a spreadsheet.',
    a: <CategoryBars />,
    b: <StockHealthCard />,
  },
]

const ALSO = [
  { icon: ScanBarcode, label: 'Barcode scanning with the device camera' },
  { icon: Truck, label: 'Suppliers and purchase orders' },
  { icon: UserSquare2, label: 'Staff roles, shifts and an audit log' },
  { icon: Bot, label: 'An AI assistant that answers from your store’s data' },
]

export default function ConceptClean() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#14100c] antialiased" style={APP_LIGHT_TOKENS}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES('#ffffff') }} />

      <header className="sticky top-0 z-50 border-b border-[#EFEAE1] bg-white/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" aria-label="StockPulse, back to top" className={`rounded-md ${focus}`}>
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`inline-block py-1.5 text-[14.5px] text-[#4a4139] hover:text-[#14100c] ${focus}`}>
                {n.label}
              </a>
            ))}
            <Link href={ROUTES.login} className={`inline-block py-1.5 text-[14.5px] text-[#4a4139] hover:text-[#14100c] ${focus}`}>
              Log in
            </Link>
            <Link href={ROUTES.signup} className={`${btnPrimary} !h-10 !px-5 !text-[14px]`}>
              Get started
            </Link>
          </nav>
          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Get started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
              { label: 'View the demo store', href: ROUTES.demo, className: `py-2 text-center text-[15px] font-medium text-[#14100c] ${focus}` },
              { label: 'Log in', href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#4a4139] ${focus}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-full border border-[#EFEAE1] ${focus}`}
            panelClass="absolute inset-x-0 top-16 border-b border-[#EFEAE1] bg-white px-5 pb-6 pt-2"
            linkClass={`block border-b border-[#F4F0E8] py-3.5 text-[16px] ${focus}`}
          />
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section aria-labelledby="hero-h" className="mx-auto max-w-6xl px-5 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a6206]">For independent grocery stores</p>
          <h1
            id="hero-h"
            className="mx-auto mt-5 max-w-3xl text-balance text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.04em]"
          >
            The simple way to run your grocery store.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-[17px] leading-relaxed text-[#4a4139] sm:text-[18px]">
            Stock, expiry dates, sales and suppliers in one place — so you always know what to reorder and what to sell first.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={ROUTES.signup} className={`${btnPrimary} w-full sm:w-auto`}>
              Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.demo} className={quietLink}>
              View the demo store
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-[#6b6157]">Free while in beta · No card required</p>

          <div className="mx-auto mt-16 max-w-5xl pb-20 sm:mt-20 sm:pb-28">
            <AppWindow label={DASHBOARD_LABEL}>
              <DashboardScreen />
            </AppWindow>
            <p className="mt-4 text-[12.5px] text-[#6b6157]">
              The real StockPulse dashboard, showing the demo store on {SNAPSHOT_LABEL}.
            </p>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          aria-labelledby="features-h"
          className="scroll-mt-16 border-t border-[#EFEAE1] bg-[#fbfaf8] py-20 sm:py-28"
        >
          {/* Wider than the hero: two real product cards need ~380px each to show their rows untruncated. */}
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 id="features-h" className="max-w-xl text-balance text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
              Four jobs, one place.
            </h2>
            <div className="mt-14 space-y-16 sm:space-y-24">
              {ROWS.map((r) => (
                <FadeIn key={r.id} className="grid items-center gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-12">
                  <div>
                    <p className="text-[13px] font-semibold text-[#8a6206]">{r.tag}</p>
                    <h3 className="mt-2 text-balance text-[clamp(1.4rem,2.4vw,1.8rem)] font-semibold leading-[1.2] tracking-[-0.02em]">
                      {r.title}
                    </h3>
                    <p className="mt-3 max-w-md text-[16px] leading-relaxed text-[#4a4139]">{r.body}</p>
                  </div>
                  <div aria-hidden="true" className={`grid gap-4 ${r.b ? 'sm:grid-cols-2' : 'sm:max-w-md'}`}>
                    {r.a}
                    {r.b}
                  </div>
                </FadeIn>
              ))}
            </div>

            <ul className="mt-20 grid gap-x-8 gap-y-4 border-t border-[#EFEAE1] pt-10 sm:grid-cols-2">
              {ALSO.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-[15px] text-[#4a4139]">
                  <Icon className="h-5 w-5 shrink-0 text-[#8a6206]" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing — the only one */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-16 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 id="pricing-h" className="text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold tracking-[-0.03em]">
              Free while we’re in beta.
            </h2>
            <p className="mt-3 text-[16.5px] text-[#4a4139]">{PRICE.line}</p>
            <div className="mt-10 rounded-3xl border border-[#EFEAE1] p-8 text-left shadow-[0_24px_50px_-34px_rgba(20,16,12,0.35)] sm:p-10">
              <p className="flex items-baseline gap-2">
                <span className="text-[56px] font-semibold leading-none tracking-[-0.04em]">{PRICE.amount}</span>
                <span className="text-[15px] text-[#6b6157]">{PRICE.period}</span>
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {PRICE.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#4a4139]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3f6b2b]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={ROUTES.signup} className={`${btnPrimary} mt-8 w-full`}>
                Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section aria-labelledby="cta-h" className="border-t border-[#EFEAE1] bg-[#fbfaf8] py-20 text-center sm:py-24">
          <div className="mx-auto max-w-2xl px-5">
            <h2 id="cta-h" className="text-balance text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold tracking-[-0.03em]">
              See it with a real store in it.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={ROUTES.signup} className={`${btnPrimary} w-full sm:w-auto`}>
                Get started free
              </Link>
              <Link href={ROUTES.demo} className={quietLink}>
                View the demo store
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#EFEAE1] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 text-[14px] text-[#6b6157] sm:px-8 md:flex-row md:items-center md:justify-between">
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
                <Link href={x.h} className={`inline-block py-1 hover:text-[#14100c] ${focus}`}>
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
