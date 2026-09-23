import Link from 'next/link'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BellRing,
  CalendarClock,
  ChartColumn,
  Check,
  Clock,
  CloudOff,
  Layers,
  Lightbulb,
  ReceiptText,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'
import { navItemsFor } from '@/lib/nav'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PRICING, TRUST } from '../content'
import MobileMenu from '../MobileMenu'
import PulseMark from '../PulseMark'
import FadeIn from './FadeIn'
import {
  BY_CATEGORY,
  EXPIRING,
  INVENTORY,
  LOW_STOCK,
  OFFLINE_UI,
  SNAPSHOT_DATE,
  SNAPSHOT_LABEL,
  TOTALS,
  WARNING_DAYS,
} from './snapshot'

/**
 * StockPulse landing page — single preview direction ("clean fintech SaaS").
 *
 * WHAT THIS IS BUILT FROM
 *  - Brand: the app's own light-theme tokens (warm off-white, ink #14100c,
 *    gold #c9a227 / #8a6206), Inter for text and the Cinzel wordmark the root
 *    layout already loads. Buttons mirror components/ui/Button: ink primary,
 *    bordered-white secondary.
 *  - Product imagery: REAL app components — StatCard, Card, Badge, ExpiryTag
 *    (with the app's own expiry-tone logic) and the sidebar's navItemsFor() —
 *    filled with a read-only snapshot of the demo store (./snapshot.ts). No
 *    screenshot, no invented figures, no revenue.
 *  - Copy: the brief's structure, mapped onto what StockPulse actually is.
 *    The brief's wording described a stock-market analytics product; the app
 *    has no market data, tickers or news, so "Understand the market" became
 *    "Understand your store" and every feature named here exists in code.
 *
 * The page pins the light-theme tokens on its wrapper, so the reused
 * components render light even when the visitor's system is dark — the app
 * applies `.dark` to <html> from prefers-color-scheme, and custom properties
 * set here win for everything inside.
 */

const LIGHT_TOKENS = {
  '--background': '#fbfaf8',
  '--surface': '#ffffff',
  '--surface-muted': '#f4f2ee',
  '--raised': '#ffffff',
  '--overlay': '#ffffff',
  '--foreground': '#14100c',
  '--muted-strong': '#4a4139',
  '--muted': '#6b6157',
  '--border': '#e3d7c1',
  '--border-strong': '#b99f76',
  '--accent': '#8a6206',
  '--accent-fill': '#c9a227',
  '--on-accent': '#14100c',
  '--accent-hover': '#6d4d04',
  '--accent-soft': '#f6e8c8',
  '--accent-ink': '#5a3f03',
  '--success': '#3f6b2b',
  '--success-bg': '#e4edd8',
  '--success-ink': '#2b4a1d',
  '--danger': '#8f2a1c',
  '--danger-bg': '#f7ded8',
  '--warning': '#8a5a06',
  '--warning-bg': '#f7e7c6',
  '--info': '#5c4a38',
  '--info-bg': '#ece0cd',
} as React.CSSProperties

const PAGE_STYLES = `
html, body { background: #ffffff; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
] as const

const ROUTES = { login: '/login', signup: '/signup', demo: '/login?demo=1', privacy: '/privacy', terms: '/terms' }

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14100c]'
// Mirrors components/ui/Button's primary / secondary variants, as links.
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#14100c] px-6 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(20,16,12,0.12)] transition-opacity hover:opacity-90 ${focus}`
const btnSecondary = `inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E3D7C1] bg-white px-6 text-[15px] font-semibold text-[#14100c] transition-colors hover:bg-[#f4f2ee] ${focus}`

const h2 = 'text-balance text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#14100c]'
const eyebrow = 'text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8a6206]'
const lead = 'text-[17px] leading-relaxed text-[#4a4139]'
const card =
  'rounded-2xl border border-[#EEE7DA] bg-white shadow-[0_1px_2px_rgba(20,16,12,0.04),0_12px_32px_-18px_rgba(20,16,12,0.18)]'

export default function LandingFinal() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#14100c] antialiased" style={LIGHT_TOKENS}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-[#14100c] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-[#EEE7DA] bg-white/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="#main" className={`rounded-md ${focus}`} aria-label="StockPulse, back to top">
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8 text-[14.5px] font-medium text-[#4a4139]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`inline-block rounded-sm py-1.5 transition-colors hover:text-[#14100c] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={ROUTES.login}
              className={`rounded-lg px-3 py-2 text-[14.5px] font-medium text-[#4a4139] transition-colors hover:text-[#14100c] ${focus}`}
            >
              Login
            </Link>
            <Link href={ROUTES.signup} className={`${btnPrimary} !h-10 !rounded-lg !px-4 !text-[14px]`}>
              Get Started
            </Link>
          </div>

          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Get Started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
              { label: 'Explore Stock Pulse', href: ROUTES.demo, className: `${btnSecondary} w-full` },
              { label: 'Login', href: ROUTES.login, className: `py-2 text-center text-[15px] font-medium text-[#4a4139] ${focus}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-xl border border-[#EEE7DA] text-[#14100c] ${focus}`}
            panelClass="absolute inset-x-0 top-16 border-b border-[#EEE7DA] bg-white px-5 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgba(20,16,12,0.25)]"
            linkClass={`block border-b border-[#F1EBE0] py-3.5 text-[16px] font-medium text-[#14100c] ${focus}`}
          />
        </div>
      </header>

      <main id="main">
        {/* ─── Hero ─── */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden">
          {/* One soft wash of the brand gold behind the headline — the page's only background colour effect. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,#f6e8c8_0%,rgba(246,232,200,0)_100%)] opacity-70"
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pt-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#EEE7DA] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#4a4139] shadow-[0_1px_2px_rgba(20,16,12,0.05)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" aria-hidden="true" />
              Store management for independent grocers
            </p>
            <h1
              id="hero-h"
              className="mx-auto mt-7 max-w-4xl text-balance text-[clamp(2.6rem,6.4vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
            >
              {/* nowrap keeps "your store." together: at 375px the line broke
                  as "Understand your / store." and orphaned the full stop's word. */}
              Understand <span className="whitespace-nowrap">your store.</span>
              <br />
              <span className="text-[#8a6206]">Make smarter decisions.</span>
            </h1>
            <p className={`mx-auto mt-6 max-w-2xl ${lead} sm:text-[18px]`}>
              StockPulse keeps your stock, sales, expiry dates and suppliers in one clear dashboard — so you can see what
              needs reordering, what to sell first, and how the week went.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href={ROUTES.signup} className={btnPrimary}>
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.demo} className={btnSecondary}>
                Explore Stock Pulse
              </Link>
            </div>
            <p className="mt-5 text-[13.5px] text-[#6b6157]">
              Free while in beta · No card required · The demo store opens without sign-up
            </p>
          </div>

          {/* ─── Product preview ─── */}
          <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-8 sm:pb-28">
            <ProductShot />
          </div>
        </section>

        {/* ─── Why StockPulse ─── */}
        <section
          id="features"
          aria-labelledby="features-h"
          className="scroll-mt-20 border-t border-[#F1EBE0] bg-[#fbfaf8] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>Why StockPulse</p>
              <h2 id="features-h" className={`mt-3 ${h2}`}>
                The whole shop, clearly in view.
              </h2>
              <p className={`mt-4 ${lead}`}>Four things StockPulse does every day, without a spreadsheet in sight.</p>
            </FadeIn>
            <FadeIn className="mt-14">
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Archive, title: 'Stock in one place', body: 'Every product and every delivery lot, each with its own expiry date.' },
                  { icon: ReceiptText, title: 'Sales that update stock', body: 'Each sale deducts from the earliest-expiring lot first, automatically.' },
                  { icon: BellRing, title: 'Alerts before it’s too late', body: 'Low-stock thresholds per product and an expiry window you choose.' },
                  { icon: ChartColumn, title: 'Clear reports', body: 'Daily takings, trends and CSV export — plus an AI assistant to ask.' },
                ].map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    className={`${card} p-6 transition-shadow hover:shadow-[0_1px_2px_rgba(20,16,12,0.04),0_18px_40px_-18px_rgba(20,16,12,0.24)]`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6e8c8] text-[#8a6206]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-[16.5px] font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#4a4139]">{body}</p>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>How it works</p>
              <h2 id="how-h" className={`mt-3 ${h2}`}>
                Three steps from question to answer.
              </h2>
            </FadeIn>
            <FadeIn className="mt-14">
              <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
                {/* The connector sits behind the step badges on desktop only. */}
                <span aria-hidden="true" className="absolute left-[16.5%] right-[16.5%] top-7 hidden h-px bg-[#E3D7C1] md:block" />
                {[
                  { n: '01', icon: ScanSearch, title: 'Search', body: 'Find any product by name, or scan its barcode with the device camera.' },
                  { n: '02', icon: Layers, title: 'Analyze', body: 'See its stock, delivery lots, expiry dates and how it has been selling.' },
                  { n: '03', icon: Lightbulb, title: 'Understand', body: 'Act on what surfaces — reorder, discount before expiry, or ask the AI assistant.' },
                ].map(({ n, icon: Icon, title, body }) => (
                  <li key={n} className="relative flex flex-col items-center text-center">
                    <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-[#EEE7DA] bg-white text-[#14100c] shadow-[0_8px_20px_-12px_rgba(20,16,12,0.3)]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-[13px] font-semibold tabular-nums text-[#8a6206]">{n}</p>
                    <h3 className="mt-1 text-[19px] font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-[#4a4139]">{body}</p>
                  </li>
                ))}
              </ol>
            </FadeIn>
          </div>
        </section>

        {/* ─── Feature showcase ─── */}
        <section aria-labelledby="showcase-h" className="border-t border-[#F1EBE0] bg-[#fbfaf8] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 id="showcase-h" className="sr-only">
              Features in detail
            </h2>
            <div className="space-y-20 sm:space-y-28">
              <ShowcaseRow
                eyebrowText="Inventory"
                title="Every delivery, tracked to its date."
                body="Stock is held per delivery lot, so two batches of the same product keep two expiry dates. Import your catalogue from a spreadsheet and export it back."
                points={['Lots with their own expiry dates', 'Per-product low-stock thresholds', 'CSV import and export']}
                panel={<InventoryPanel />}
              />
              <ShowcaseRow
                reverse
                eyebrowText="Sales & offline"
                title="The till keeps going when the Wi-Fi doesn’t."
                body="Sales made without a connection are saved on the device and sync the moment it returns — each one exactly once. These are the messages the cashier sees."
                points={['Stock deducted earliest-expiry first', 'Offline sales sync automatically', 'Camera barcode scanning at the till']}
                panel={<OfflinePanel />}
              />
              <ShowcaseRow
                eyebrowText="Suppliers & staff"
                title="Orders, roles and a record of every change."
                body="Track purchase orders from ordered to at dock, give each person the access their role needs, and keep an audit log of who changed what."
                points={['Four-stage purchase order tracking', 'Owner, manager and staff roles', 'Audit log with before-and-after values']}
                panel={<OperationsPanel />}
              />
            </div>
          </div>
        </section>

        {/* ─── Data visualization ─── */}
        <section aria-labelledby="viz-h" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>Insights</p>
              <h2 id="viz-h" className={`mt-3 ${h2}`}>
                See your store more clearly.
              </h2>
              <p className={`mt-4 ${lead}`}>
                Where your range sits and how healthy your stock is, at a glance — shown with the demo store’s real data
                from {SNAPSHOT_LABEL}.
              </p>
            </FadeIn>
            <FadeIn className="mt-14 grid gap-5 lg:grid-cols-2">
              <CategoryChart />
              <StockHealth />
            </FadeIn>
          </div>
        </section>

        {/* ─── About / simplicity ─── */}
        <section
          id="about"
          aria-labelledby="about-h"
          className="scroll-mt-20 border-t border-[#F1EBE0] bg-[#fbfaf8] py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <FadeIn>
              <p className={eyebrow}>About StockPulse</p>
              <h2 id="about-h" className={`mt-3 ${h2}`}>
                Everything you need to run the shop, in one place.
              </h2>
              <p className={`mt-5 ${lead}`}>
                StockPulse is built for independent grocers — the shops that know their regulars by name. It runs in the
                browser on the computer or phone you already have: no hardware to buy, nothing to install.
              </p>
            </FadeIn>
            <FadeIn>
              <dl className="grid gap-4 sm:grid-cols-2">
                {TRUST.map((t) => (
                  <div key={t.title} className={`${card} p-6`}>
                    <ShieldCheck className="h-5 w-5 text-[#8a6206]" aria-hidden="true" />
                    <dt className="mt-4 text-[15.5px] font-semibold tracking-tight">{t.title}</dt>
                    <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[#4a4139]">{t.body}</dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          </div>
        </section>

        {/* ─── Pricing — the only one on the page ─── */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>Pricing</p>
              <h2 id="pricing-h" className={`mt-3 ${h2}`}>
                Free while we’re in beta.
              </h2>
              <p className={`mt-4 ${lead}`}>{PRICING.blurb}</p>
            </FadeIn>
            <FadeIn className={`mx-auto mt-12 max-w-3xl ${card} p-7 sm:p-10`}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6b6157]">{PRICING.plan}</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-[56px] font-semibold leading-none tracking-[-0.04em]">{PRICING.price}</span>
                    <span className="text-[15px] text-[#6b6157]">{PRICING.period}</span>
                  </p>
                </div>
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-x-8 gap-y-3 border-t border-[#F1EBE0] pt-8 sm:grid-cols-2">
                {PRICING.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#4a4139]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3f6b2b]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section aria-labelledby="cta-h" className="px-4 pb-20 sm:px-8 sm:pb-28">
          <FadeIn className="mx-auto max-w-5xl rounded-3xl bg-[#14100c] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <h2 id="cta-h" className="text-balance text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
              Ready to see your store clearly?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-balance text-[16.5px] leading-relaxed text-[#D9D0C2]">
              Set up in an evening. Free while in beta, with no card required.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={ROUTES.signup}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-[#14100c] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={ROUTES.demo}
                className="inline-block rounded-sm py-2 text-[15px] font-medium text-[#E9E2D6] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                or explore the demo store
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#EEE7DA] bg-[#fbfaf8] pb-16 pt-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-[#4a4139]">
              Store management for independent grocers — inventory, sales, suppliers and staff in one place.
            </p>
          </div>
          <FooterCol
            title="Product"
            items={[...NAV.map((n) => ({ ...n, anchor: true })), { label: 'Pricing', href: '#pricing', anchor: true }]}
          />
          <FooterCol
            title="Account"
            items={[
              { label: 'Login', href: ROUTES.login },
              { label: 'Get Started', href: ROUTES.signup },
              { label: 'Explore the demo', href: ROUTES.demo },
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-[#EEE7DA] px-5 pt-6 text-[13.5px] text-[#6b6157] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 StockPulse</p>
          <ul className="flex gap-5">
            <li>
              <Link href={ROUTES.privacy} className={`inline-block py-1 hover:text-[#14100c] ${focus}`}>
                Privacy
              </Link>
            </li>
            <li>
              <Link href={ROUTES.terms} className={`inline-block py-1 hover:text-[#14100c] ${focus}`}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

/* ───────────────────────── pieces ───────────────────────── */

/** The flat pulse mark in the app's gold, with the Cinzel wordmark the brand already uses. */
function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[#14100c]">
      <PulseMark className="h-8 w-8 text-[#c9a227] [--pm-line:#14100c]" />
      <span className="font-[family-name:var(--font-cinzel-app)] text-[17px] font-semibold tracking-[0.02em]">StockPulse</span>
    </span>
  )
}

function FooterCol({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; href: string; anchor?: boolean }>
}) {
  const cls = `inline-block py-1 text-[14.5px] text-[#4a4139] hover:text-[#14100c] ${focus}`
  return (
    <nav aria-label={title}>
      <p className="text-[13px] font-semibold text-[#14100c]">{title}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i.href}>
            {i.anchor ? (
              <a href={i.href} className={cls}>
                {i.label}
              </a>
            ) : (
              <Link href={i.href} className={cls}>
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * The hero product shot: the app shell (real sidebar items from lib/nav) with
 * the dashboard's stat tiles and alert panels, built from the app's own
 * components and the demo store's real stock on the snapshot date.
 */
function ProductShot() {
  const nav = navItemsFor('owner').slice(0, 10)
  const alt = `The StockPulse dashboard for the demo store on ${SNAPSHOT_LABEL}: ${TOTALS.products} products, ${TOTALS.liveLots} stock lots, ${TOTALS.lowStock} items at or below their reorder level and ${TOTALS.expiringSoonLots} lots expiring soon, with ${TOTALS.expiredLots} already expired.`
  return (
    <figure>
      <div
        role="img"
        aria-label={alt}
        className="overflow-hidden rounded-[22px] border border-[#E7DDCB] bg-white shadow-[0_1px_2px_rgba(20,16,12,0.05),0_40px_90px_-40px_rgba(20,16,12,0.35)]"
      >
        <div aria-hidden="true" className="select-none text-left">
          <div className="flex items-center gap-2 border-b border-[#F1EBE0] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E7DDCB]" />
            <span className="ml-3 truncate text-[12px] font-medium text-[#6b6157]">StockPulse Demo Store</span>
          </div>
          <div className="flex">
            <aside className="hidden w-52 shrink-0 border-r border-[#F1EBE0] bg-[#fbfaf8] p-3 lg:block">
              <ul className="space-y-0.5">
                {nav.map(({ href, label, icon: Icon }) => (
                  <li
                    key={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${
                      href === '/dashboard' ? 'bg-[#f6e8c8] font-semibold text-[#5a3f03]' : 'text-[#6b6157]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="min-w-0 flex-1 bg-[#fbfaf8] p-4 sm:p-6">
              <p className="text-[12px] font-medium text-[#6b6157]">Saturday, 19 September</p>
              <p className="text-[18px] font-bold tracking-tight">Dashboard</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
                <StatCard label="Products" value={TOTALS.products} icon={Archive} className={STAT_FIT} />
                <StatCard label="Stock lots" value={TOTALS.liveLots} icon={Layers} className={STAT_FIT} />
                <StatCard label="Low Stock Items" value={TOTALS.lowStock} icon={AlertTriangle} className={STAT_FIT} />
                <StatCard label="Expiring Soon" value={TOTALS.expiringSoonLots} icon={CalendarClock} className={STAT_FIT} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader title="Low Stock Alerts" subtitle="At or below each product’s own threshold" />
                  <CardBody>
                    <ul className="divide-y divide-[#F1EBE0]">
                      {LOW_STOCK.map((p) => (
                        <li key={p.name} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                            <span className="text-[12px] capitalize text-[#6b6157]">{p.category}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="text-[13px] tabular-nums text-[#4a4139]">
                              {p.stock} <span className="text-[#6b6157]">/ {p.threshold}</span>
                            </span>
                            <Badge tone="warning" className="whitespace-nowrap">Reorder</Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Expiring Soon" subtitle={`${TOTALS.expiredLots} lots already expired`} />
                  <CardBody>
                    <ul className="divide-y divide-[#F1EBE0]">
                      {EXPIRING.map((e) => {
                        const expired = e.expiry < SNAPSHOT_DATE
                        return (
                          <li key={e.name} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold">
                                {e.name} <span className="font-normal text-[#6b6157]">· {e.quantity} units</span>
                              </span>
                              <ExpiryTag date={e.expiry} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} />
                            </span>
                            <Badge tone={expired ? 'danger' : 'neutral'} className="shrink-0 whitespace-nowrap">
                              {expired ? 'Write off' : 'Discount'}
                            </Badge>
                          </li>
                        )
                      })}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[13px] text-[#6b6157]">
        StockPulse’s own interface components, showing the demo store’s real stock on {SNAPSHOT_LABEL}.
      </figcaption>
    </figure>
  )
}

function ShowcaseRow({
  eyebrowText,
  title,
  body,
  points,
  panel,
  reverse = false,
}: {
  eyebrowText: string
  title: string
  body: string
  points: string[]
  panel: React.ReactNode
  reverse?: boolean
}) {
  return (
    <FadeIn className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className={eyebrow}>{eyebrowText}</p>
        <h3 className="mt-3 text-balance text-[clamp(1.6rem,2.8vw,2.15rem)] font-semibold leading-[1.15] tracking-[-0.025em]">
          {title}
        </h3>
        <p className={`mt-4 ${lead}`}>{body}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[15px] text-[#4a4139]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3f6b2b]" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      {/* Decorative for assistive tech: the text column says what it shows. */}
      <div aria-hidden="true" className={`select-none ${reverse ? 'lg:order-1' : ''}`}>
        {panel}
      </div>
    </FadeIn>
  )
}

/**
 * Passed through StatCard's own className prop — the shared component is not
 * edited. Below 640px a half-width tile is ~150px, and the icon tile beside
 * the label made "LOW STOCK ITEMS" wrap to three lines; the icon is hidden
 * there and the padding eased, from sm up the tile is exactly as the app has it.
 */
const STAT_FIT = 'p-4 sm:p-5 max-sm:[&_span.inline-flex]:hidden'

const fmtShort = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function InventoryPanel() {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Inventory" subtitle="Demo store · stock held per delivery lot" />
      <ul className="divide-y divide-[#F1EBE0] border-t border-[#F1EBE0]">
        {INVENTORY.map((p) => {
          const live = p.lots.filter((l) => l.quantity > 0)
          const dated = live
            .map((l) => l.expiry)
            .filter((d): d is string => d !== null)
            .sort()
          const low = p.stock <= p.threshold
          return (
            <li key={p.name} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{p.name}</p>
                  <ExpiryTag date={dated[0] ?? null} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} lots={live.length} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[14px] font-semibold tabular-nums">{p.stock}</span>
                  <Badge tone={low ? 'warning' : 'success'}>{low ? 'Low' : 'In stock'}</Badge>
                </div>
              </div>
              {live.length > 1 && (
                <ul className="mt-3 space-y-1.5 rounded-xl bg-[#fbfaf8] p-3">
                  {live.map((l, i) => (
                    <li key={i} className="flex justify-between text-[12.5px] text-[#4a4139]">
                      <span>
                        Lot {i + 1} · received {fmtShort(l.received)}
                      </span>
                      <span className="tabular-nums">{l.quantity} units</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function OfflinePanel() {
  const steps = [
    { icon: CloudOff, state: 'No connection', text: 'Saved on this device', tone: 'neutral' as const },
    { icon: Clock, state: 'Waiting to sync', text: OFFLINE_UI.pending, tone: 'warning' as const },
    { icon: RefreshCw, state: 'Back online', text: OFFLINE_UI.synced, tone: 'success' as const },
  ]
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-[13px] font-bold">What the cashier sees</p>
      <ol className="mt-4 space-y-3">
        {steps.map(({ icon: Icon, state, text, tone }) => (
          <li key={state} className="flex items-center gap-3 rounded-xl border border-[#F1EBE0] bg-white p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f4f2ee] text-[#4a4139]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#6b6157]">{state}</span>
              <span className="mt-1 block">
                <Badge tone={tone}>{text}</Badge>
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12.5px] text-[#6b6157]">The app’s own messages, as they appeared during production testing.</p>
    </Card>
  )
}

function OperationsPanel() {
  const stages = ['Ordered', 'Shipped', 'In transit', 'At dock']
  const roles = [
    { role: 'Owner', can: 'Everything, including settings and the audit log' },
    { role: 'Manager', can: 'Stock, suppliers, customers and reports' },
    { role: 'Staff', can: 'Sales, scanning and shifts' },
  ]
  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <p className="text-[13px] font-bold">Purchase order stages</p>
        <ol className="mt-5 flex items-start justify-between">
          {stages.map((s, i) => (
            <li key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && <span className="absolute right-1/2 top-[7px] h-0.5 w-full bg-[#E3D7C1]" />}
              <span className="relative h-4 w-4 rounded-full border-2 border-[#c9a227] bg-white" />
              <span className="mt-2 text-[12px] font-medium text-[#4a4139]">{s}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card className="p-5 sm:p-6">
        <p className="text-[13px] font-bold">Roles</p>
        <ul className="mt-3 divide-y divide-[#F1EBE0]">
          {roles.map((r) => (
            <li key={r.role} className="flex items-center justify-between gap-4 py-2.5">
              <Badge tone={r.role === 'Owner' ? 'warning' : 'neutral'}>{r.role}</Badge>
              <span className="text-right text-[13px] text-[#4a4139]">{r.can}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/** Styled after SalesTrendChart: grey bars, the largest in near-black, 4px top radius. */
function CategoryChart() {
  const max = Math.max(...BY_CATEGORY.map((c) => c.value))
  const total = BY_CATEGORY.reduce((a, c) => a + c.value, 0)
  return (
    <figure className={`${card} p-6 sm:p-7`}>
      <figcaption>
        <p className="text-[15px] font-semibold">Products by category</p>
        <p className="mt-0.5 text-[13px] text-[#6b6157]">
          {total} products · demo store · {SNAPSHOT_LABEL}
        </p>
      </figcaption>
      <div
        className="mt-6 flex h-52 items-end gap-2 sm:gap-5"
        role="img"
        aria-label={`Products by category: ${BY_CATEGORY.map((c) => `${c.label} ${c.value}`).join(', ')}`}
      >
        {BY_CATEGORY.map((c) => (
          <div key={c.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" aria-hidden="true">
            <span className="text-[12px] font-semibold tabular-nums text-[#4a4139]">{c.value}</span>
            <span
              className={`w-full max-w-16 rounded-t-[4px] ${c.value === max ? 'bg-[#18181b]' : 'bg-[#d4d4d8]'}`}
              style={{ height: `${(c.value / max) * 78}%` }}
            />
            <span className="max-w-full truncate text-[11px] text-[#6b6157] sm:text-[12px]">{c.label}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

function StockHealth() {
  const ok = TOTALS.liveLots - TOTALS.expiredLots - TOTALS.expiringSoonLots
  const segs = [
    { label: 'Fine', value: ok, cls: 'bg-[#d4d4d8]' },
    { label: `Expiring within ${WARNING_DAYS} days`, value: TOTALS.expiringSoonLots, cls: 'bg-[#c9a227]' },
    { label: 'Expired', value: TOTALS.expiredLots, cls: 'bg-[#8f2a1c]' },
  ]
  const healthy = TOTALS.products - TOTALS.lowStock
  return (
    <figure className={`${card} p-6 sm:p-7`}>
      <figcaption>
        <p className="text-[15px] font-semibold">Stock health</p>
        <p className="mt-0.5 text-[13px] text-[#6b6157]">Live delivery lots and reorder levels · {SNAPSHOT_LABEL}</p>
      </figcaption>

      <p className="mt-6 text-[13px] font-medium text-[#4a4139]">{TOTALS.liveLots} lots in stock</p>
      <div
        className="mt-2 flex h-4 overflow-hidden rounded-full bg-[#f4f2ee]"
        role="img"
        aria-label={`${TOTALS.liveLots} lots in stock — ${segs.map((s) => `${s.label}: ${s.value}`).join(', ')}`}
      >
        {segs.map((s) => (
          <span key={s.label} className={s.cls} style={{ width: `${(s.value / TOTALS.liveLots) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[#4a4139]" aria-hidden="true">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} />
            {s.label} <span className="font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>

      <p className="mt-7 text-[13px] font-medium text-[#4a4139]">{TOTALS.products} products</p>
      <div
        className="mt-2 flex h-4 overflow-hidden rounded-full bg-[#f4f2ee]"
        role="img"
        aria-label={`${TOTALS.products} products — above reorder level: ${healthy}, at or below reorder level: ${TOTALS.lowStock}`}
      >
        <span className="bg-[#d4d4d8]" style={{ width: `${(healthy / TOTALS.products) * 100}%` }} />
        <span className="bg-[#8a5a06]" style={{ width: `${(TOTALS.lowStock / TOTALS.products) * 100}%` }} />
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[#4a4139]" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4d8]" />
          Above reorder level <span className="font-semibold tabular-nums">{healthy}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8a5a06]" />
          At or below reorder level <span className="font-semibold tabular-nums">{TOTALS.lowStock}</span>
        </li>
      </ul>
    </figure>
  )
}
