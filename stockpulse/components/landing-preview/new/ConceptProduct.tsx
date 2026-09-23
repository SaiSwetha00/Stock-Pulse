import Link from 'next/link'
import { AlertTriangle, ArrowRight, CalendarClock, Check, RefreshCw } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import MobileMenu from '../MobileMenu'
import FadeIn from '../final/FadeIn'
import { OFFLINE_UI, SNAPSHOT_DATE, WARNING_DAYS } from '../final/snapshot'
import { PAGE_STYLES, PRICE, ROUTES, Wordmark } from './shared'
import {
  APP_LIGHT_TOKENS,
  AppWindow,
  CategoryBars,
  ExpiringCard,
  FefoCard,
  INVENTORY_LABEL,
  InventoryScreen,
  LotsCard,
  LowStockCard,
  OfflineCard,
  RolesCard,
  SNAPSHOT_LABEL,
  StockHealthCard,
  SupplierStages,
} from './ProductUI'

/**
 * NEW CONCEPT 2 — Product-first.
 *
 * The first screen is mostly product. One line of headline, one line of
 * support, two buttons — then the real Inventory screen at full width with
 * three small callouts pinned to it. The callouts are the SAME products as
 * the table (Butter 500g is low in the table and in the alert; Brinjal is
 * expired in both), so it reads as one product, not a collage.
 *
 * Below, a single grid of the product's other real screens, each with a
 * one-line caption. Almost no marketing prose anywhere.
 */

const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '#pricing' },
] as const

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14100c]'
const btnPrimary = `inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#14100c] px-5 text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90 ${focus}`
const btnSecondary = `inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DDD3C2] bg-white px-5 text-[14.5px] font-semibold text-[#14100c] transition-colors hover:bg-[#f4f2ee] ${focus}`

const TILES = [
  { cap: 'Low-stock alerts, per product', el: <LowStockCard /> },
  { cap: 'Expiry dates, per delivery lot', el: <ExpiringCard limit={3} /> },
  { cap: 'Sales take the earliest-expiring lot first', el: <FefoCard /> },
  { cap: 'Offline sales sync when you’re back', el: <OfflineCard /> },
  { cap: 'Two deliveries, two lots', el: <LotsCard /> },
  { cap: 'Purchase orders, stage by stage', el: <SupplierStages /> },
  { cap: 'Roles for owner, manager and staff', el: <RolesCard /> },
  { cap: 'Your range by category', el: <CategoryBars /> },
  { cap: 'Stock health at a glance', el: <StockHealthCard /> },
]

/** A small callout pinned to the hero screen. */
function Callout({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof AlertTriangle
  title: string
  children: React.ReactNode
  className: string
}) {
  return (
    <div
      className={`w-full rounded-2xl border border-[#E7DDCB] bg-white p-4 shadow-[0_18px_40px_-20px_rgba(20,16,12,0.35)] lg:absolute lg:w-64 ${className}`}
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6157]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

export default function ConceptProduct() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] font-[family-name:var(--font-inter)] text-[#14100c] antialiased" style={APP_LIGHT_TOKENS}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES('#F5F3EF') }} />

      <header className="sticky top-0 z-50 border-b border-[#E7E1D6] bg-[#F5F3EF]/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" aria-label="StockPulse, back to top" className={`rounded-md ${focus}`}>
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`inline-block py-1.5 text-[14px] text-[#4a4139] hover:text-[#14100c] ${focus}`}>
                {n.label}
              </a>
            ))}
            <Link href={ROUTES.demo} className={`inline-block py-1.5 text-[14px] text-[#4a4139] hover:text-[#14100c] ${focus}`}>
              Demo
            </Link>
            <Link href={ROUTES.login} className={`inline-block py-1.5 text-[14px] text-[#4a4139] hover:text-[#14100c] ${focus}`}>
              Log in
            </Link>
            <Link href={ROUTES.signup} className={`${btnPrimary} !h-9 !px-4 !text-[13.5px]`}>
              Get started
            </Link>
          </nav>
          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Get started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
              { label: 'Explore the demo store', href: ROUTES.demo, className: `${btnSecondary} w-full` },
              { label: 'Log in', href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#4a4139] ${focus}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-lg border border-[#E7E1D6] bg-white ${focus}`}
            panelClass="absolute inset-x-0 top-16 border-b border-[#E7E1D6] bg-[#F5F3EF] px-5 pb-6 pt-2"
            linkClass={`block border-b border-[#E7E1D6] py-3.5 text-[16px] ${focus}`}
          />
        </div>
      </header>

      <main id="top">
        {/* Hero: one line of words, then the product */}
        <section aria-labelledby="hero-h" className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="hero-h" className="text-balance text-[clamp(2.1rem,4.4vw,3.4rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
                Store management for independent grocers.
              </h1>
              <p className="mt-3 text-[16.5px] text-[#4a4139]">Stock, expiry, sales and suppliers — in one screen.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.signup} className={btnPrimary}>
                Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.demo} className={btnSecondary}>
                Explore the demo store
              </Link>
            </div>
          </div>

          {/* The product, with callouts pinned to it. Callouts sit level with the row they
              describe (measured: Brinjal centred at 323px, Butter 500g at 369px). */}
          <div className="relative mt-10 sm:mt-12 lg:px-14 lg:pb-10">
            <AppWindow active="/inventory" label={INVENTORY_LABEL}>
              <InventoryScreen />
            </AppWindow>

            <div aria-hidden="true" className="mt-4 grid gap-3 sm:grid-cols-3 lg:mt-0 lg:block">
              <Callout icon={AlertTriangle} title="Low stock" className="lg:-left-2 lg:top-[322px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] font-semibold">Butter 500g</span>
                  <Badge tone="warning">2 / 5</Badge>
                </div>
                <p className="mt-1 text-[12px] text-[#6b6157]">Below its reorder level</p>
              </Callout>
              <Callout icon={CalendarClock} title="Expired" className="lg:-right-2 lg:top-[276px]">
                <p className="text-[13.5px] font-semibold">Brinjal · 14 units</p>
                <ExpiryTag date="2026-09-09" today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} />
              </Callout>
              <Callout icon={RefreshCw} title="Offline sales" className="lg:bottom-0 lg:right-24">
                <Badge tone="success">{OFFLINE_UI.synced}</Badge>
                <p className="mt-1.5 text-[12px] text-[#6b6157]">Synced once the signal came back</p>
              </Callout>
            </div>
          </div>
          <p className="pb-16 pt-5 text-center text-[12.5px] text-[#6b6157] sm:pb-20">
            Real StockPulse screens · demo store data from {SNAPSHOT_LABEL}
          </p>
        </section>

        {/* The rest of the product, as one grid */}
        <section id="product" aria-labelledby="product-h" className="scroll-mt-16 border-t border-[#E7E1D6] bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 id="product-h" className="text-balance text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.03em]">
              One product, every job in the shop.
            </h2>
            <p className="mt-2 text-[15.5px] text-[#4a4139]">Plus barcode scanning, staff shifts and an AI assistant.</p>
            <FadeIn className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {TILES.map((t) => (
                <figure key={t.cap} className="mb-5 break-inside-avoid">
                  <div aria-hidden="true">{t.el}</div>
                  <figcaption className="mt-2.5 px-1 text-[13.5px] font-medium text-[#4a4139]">{t.cap}</figcaption>
                </figure>
              ))}
            </FadeIn>
          </div>
        </section>

        {/* Pricing — the only one */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-16 border-t border-[#E7E1D6] py-16 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="pricing-h" className="text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.03em]">
                {PRICE.amount} <span className="text-[#6b6157]">{PRICE.period}</span>
              </h2>
              <p className="mt-2 text-[15.5px] text-[#4a4139]">{PRICE.line}</p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {PRICE.includes.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[14px] text-[#4a4139]">
                    <Check className="h-4 w-4 text-[#3f6b2b]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.signup} className={btnPrimary}>
                Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.demo} className={btnSecondary}>
                Explore the demo store
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E7E1D6] bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-[14px] text-[#6b6157] sm:px-8 md:flex-row md:items-center md:justify-between">
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
