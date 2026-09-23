import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarClock,
  FileText,
  Heart,
  History,
  ReceiptText,
  ScanBarcode,
  Smartphone,
  Store,
  Truck,
  UserSquare2,
  Users,
} from 'lucide-react'
import ProductShot, { productTokens, type Palette } from '@/components/design-preview/ProductShot'
import FadeIn from '@/components/landing/FadeIn'
import ExpiryTag from '@/components/ui/ExpiryTag'
import Badge from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EXPIRING, SNAPSHOT_DATE, SNAPSHOT_LABEL, TOTALS, WARNING_DAYS } from '@/components/landing/snapshot'
import { caveat, interTight } from '../fonts'
import { ExpiringPanel, ExpiringTile, LotsTile, LowStockPanel, LowStockTile, ProductsTile } from '../shared'
import BrandMark from './BrandMark'
import MobileMenuDark from './MobileMenuDark'

/**
 * The full landing page in Exploration 3's language — PREVIEW ONLY.
 *
 * Not wired into app/page.tsx; the live landing page is untouched. This is the
 * approved first screen (Exploration 3: deep navy, Inter Tight Light at
 * display size, hairline rules, periwinkle index numbers, one soft-purple
 * dot) carried through a whole page.
 *
 * Content is the live page's content, extended — never invented:
 *   - every capability named exists in the app (lib/nav.ts routes, and the
 *     behaviour documented in CLAUDE.md: lots with their own expiry, the
 *     offline sale queue, per-store isolation, the shared-phone cache rule);
 *   - every product visual is the app's own component (StatCard, Card, Badge,
 *     ExpiryTag) filled with the demo store's real snapshot;
 *   - no statistics, testimonials, customer logos or revenue figures.
 *
 * Rhythm: hero → three numbered chapters (text beside a real product panel,
 * alternating sides) → the rest of the product as a hairline index → three
 * steps → three commitments → pricing → footer. The only motion is the live
 * page's FadeIn, which leaves content visible without JavaScript and does
 * nothing under prefers-reduced-motion.
 *
 * `--border` is re-pointed on the root because globals.css's UNLAYERED
 * `* { border-color: var(--border) }` otherwise paints every hairline on this
 * page in the app's warm tan. Product panels re-point it again, to a light
 * grey, through productTokens().
 */

const ROUTES = { login: '/login', signup: '/signup', demo: '/login?demo=1', privacy: '/privacy', terms: '/terms' }

const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
] as const

const PALETTE: Palette = {
  tint: '#F6F7FA',
  line: '#E6E8EE',
  accent: '#4F6BFF',
  accentSoft: '#EEF0FF',
  radius: '12px',
  shadow: '0 0 0 1px rgba(255,255,255,0.06), 0 50px 100px -40px rgba(0,0,0,0.7)',
}

const PAGE_STYLES = `
html, body { background: #0A0F1F; color-scheme: dark; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8FA2FF]'
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#4F6BFF] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#6580FF] ${focus}`
const btnQuiet = `inline-flex h-12 items-center justify-center gap-1.5 text-[15px] text-[#EEF0F6] transition-colors hover:text-white ${focus}`

/** Section rhythm, shared so every section starts on the same grid. */
const WRAP = 'mx-auto max-w-[1360px] px-6 sm:px-12'
const LABEL = 'inline-flex items-center gap-2.5 text-[13px] tracking-[0.02em] text-[#8A93AB]'
const H2 = 'text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold leading-[1.06] tracking-[-0.04em]'
const H2_SMALL = 'text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.04em]'

/* ───────────────────────── content ───────────────────────── */

type Visual = 'inventory' | 'sales' | 'alerts'

const CHAPTERS: ReadonlyArray<{
  id: string
  kicker: string
  title: string
  body: string
  points: readonly string[]
  visual: Visual
}> = [
  {
    id: 'inventory',
    kicker: 'Inventory',
    title: 'Every delivery keeps its own expiry date.',
    body: 'Stock is kept lot by lot, so two deliveries of the same product never have to share one date. The nearest expiry is always the one you see.',
    points: [
      'Add products by hand, or import the spreadsheet you already keep',
      'Export back to Excel with every column intact',
      'A blank expiry is fine — most of a grocery shop does not perish',
    ],
    visual: 'inventory',
  },
  {
    id: 'sales',
    kicker: 'Sales',
    title: 'A till that keeps selling when the internet drops.',
    body: 'Log a sale by search or by scanning a barcode with the phone’s camera, and stock comes off by itself. With no signal, sales wait safely on the device and are sent when it returns.',
    points: [
      'A sale queued offline is checked on the device before it is called saved',
      'The price charged is the price recorded — even if it changes later',
      'A scan shows the product’s nearest expiry before it goes in the basket',
    ],
    visual: 'sales',
  },
  {
    id: 'alerts',
    kicker: 'Alerts',
    title: 'Know what to reorder, and what to sell first.',
    body: 'Each product has its own reorder level, and the dashboard lists what has fallen to it. Lots near their date are listed too — expired ones kept apart from the ones you can still sell.',
    points: [
      'Your own warning window, from one day to three months',
      'Low stock and expiry on the first screen you open each morning',
    ],
    visual: 'alerts',
  },
]

/** The feature strip under the hero — the modules, each linking to where the page explains it. */
const STRIP = [
  { icon: Archive, label: 'Inventory', href: '#inventory' },
  { icon: ReceiptText, label: 'Sales / POS', href: '#sales' },
  { icon: CalendarClock, label: 'Expiry alerts', href: '#alerts' },
  { icon: Truck, label: 'Suppliers', href: '#also' },
  { icon: Users, label: 'Staff & shifts', href: '#also' },
  { icon: BarChart3, label: 'Reports', href: '#also' },
]

const ALSO = [
  { icon: ScanBarcode, title: 'Barcode scanning', body: 'The phone’s camera is the scanner, at the shelf or at the till.' },
  { icon: Truck, title: 'Suppliers', body: 'Every supplier’s details in one list.' },
  { icon: UserSquare2, title: 'Staff and shifts', body: 'Invite your team and keep track of shifts.' },
  { icon: FileText, title: 'Reports', body: 'Sales over any period, set against the one before.' },
  { icon: Users, title: 'Customers', body: 'A record of the people who shop with you.' },
  { icon: Bot, title: 'AI assistant', body: 'Ask about your own store in plain words.' },
  { icon: Smartphone, title: 'Installs on a phone', body: 'Add it to the home screen like an app.' },
  { icon: History, title: 'Activity log', body: 'See what changed in the store, and who changed it.' },
]

const STEPS = [
  { title: 'Add your stock', body: 'Type it in, or import the spreadsheet you already keep.' },
  { title: 'Sell as usual', body: 'Log sales at the counter, or scan a barcode.' },
  { title: 'Open the dashboard', body: 'See what is low and what is expiring, every morning.' },
]

const COMMITMENTS = [
  {
    title: 'Your store’s data stays your store’s.',
    body: 'Every record belongs to one store, and the database itself refuses to show it to anyone else.',
  },
  {
    title: 'A shared phone is safe to share.',
    body: 'The counter phone never keeps a signed-in page, so the next person cannot see the last person’s takings.',
  },
  {
    title: 'Owners decide who can do what.',
    body: 'Staff work the till. Prices, stock levels and reports stay with the owner and managers.',
  },
]

const FOOTER_LINKS = [
  { l: 'Log in', h: ROUTES.login },
  { l: 'Get started', h: ROUTES.signup },
  { l: 'Demo', h: ROUTES.demo },
  { l: 'Privacy', h: ROUTES.privacy },
  { l: 'Terms', h: ROUTES.terms },
]

/* ───────────────────────── page ───────────────────────── */

export default function LandingNavy() {
  return (
    <div
      className={`${interTight.variable} min-h-screen bg-[#0A0F1F] font-[family-name:var(--font-dx-inter-tight)] text-[#EEF0F6] antialiased`}
      style={{ ['--border' as string]: 'rgba(255,255,255,0.10)' } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b bg-[#0A0F1F]">
        <div className={`relative flex h-20 items-center justify-between ${WRAP}`}>
          <Link href="/" aria-label="StockPulse home" className={`inline-flex items-center gap-3 rounded-md ${focus}`}>
            <BrandMark id="sp-mark-nav" className="h-8 w-8" />
            <span className="text-[17px] font-semibold tracking-[-0.01em]">StockPulse</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-10 text-[14px] text-[#A7AFC4] md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`hover:text-white ${focus}`}>
                {n.label}
              </a>
            ))}
            <Link href={ROUTES.login} className={`hover:text-white ${focus}`}>
              Log in
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href={ROUTES.signup}
              className={`hidden h-10 items-center gap-1.5 rounded-full bg-[#4F6BFF] px-5 text-[14px] font-medium text-white hover:bg-[#6580FF] sm:inline-flex ${focus}`}
            >
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.demo}
              className={`hidden items-center gap-1.5 text-[14px] text-[#EEF0F6] hover:text-white lg:inline-flex ${focus}`}
            >
              Explore demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <MobileMenuDark
              links={NAV}
              cta={[
                { label: 'Get started', href: ROUTES.signup, className: `${btnPrimary} w-full` },
                { label: 'Explore the demo store', href: ROUTES.demo, className: `${btnQuiet} w-full rounded-full border` },
                { label: 'Log in', href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#8A93AB] ${focus}` },
              ]}
            />
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero: words left, the grocer and her store right ─── */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden">
          {/* The blue/purple glow from the reference: two soft radial lights, no hard shapes. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-48 -top-48 h-[720px] w-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(79,107,255,0.26),transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[28%] top-[35%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(150,110,255,0.16),transparent)]"
          />

          <HeroPhoto variant="desktop" />
          {/* One more soft light straddling where words meet photo, drawn above
              the photo so the two halves share the same glow. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[34%] top-[10%] hidden h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] lg:block"
          />

          <div className={`relative ${WRAP} grid items-center gap-10 pb-14 pt-12 sm:pt-16 lg:min-h-[660px] lg:grid-cols-2 lg:pb-20`}>
            <div className="relative z-10 max-w-[640px]">
              <p
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] text-[#C4CADB]"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Store className="h-3.5 w-3.5 text-[#A898FF]" aria-hidden="true" />
                Store management for independent grocers
              </p>
              <h1
                id="hero-h"
                className="mt-7 text-[clamp(2.6rem,4.1vw,4rem)] font-semibold leading-[1.04] tracking-[-0.045em]"
              >
                Run the store.
                <br />
                <span className="text-[#A9B4FF]">Not the </span>
                <span className="relative inline-block whitespace-nowrap">
                  <span className="bg-gradient-to-r from-[#5B8CFF] to-[#B08CFF] bg-clip-text text-transparent">
                    spreadsheets.
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-[0.12em] left-0 h-[0.16em] w-[92%]"
                  >
                    <defs>
                      <linearGradient id="hero-swoosh" x1="0" x2="1">
                        <stop offset="0" stopColor="#5B8CFF" />
                        <stop offset="1" stopColor="#B08CFF" />
                      </linearGradient>
                    </defs>
                    <path d="M3 10 C 80 2, 200 2, 297 7" fill="none" stroke="url(#hero-swoosh)" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 max-w-lg text-[17px] leading-[1.65] text-[#A7AFC4] sm:text-[18px]">
                Inventory, sales, suppliers, staff, expiry dates and more — all in one simple app, so you spend less time
                on paperwork and more time with your customers.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={ROUTES.demo}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] font-medium text-[#EEF0F6] transition-colors hover:bg-white/5 ${focus}`}
                  style={{ borderColor: 'rgba(255,255,255,0.18)' }}
                >
                  Explore the demo store <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-5 text-[13px] text-[#8A93AB]">Free while in beta · No card required</p>
            </div>

            <HeroPhoto variant="mobile" />
          </div>
        </section>

        {/* ─── Feature strip: the modules, one line ─── */}
        <nav aria-label="Features" className="relative border-y">
          <ul className={`${WRAP} grid grid-cols-2 gap-y-1 py-4 sm:grid-cols-3 lg:grid-cols-6`}>
            {STRIP.map(({ icon: Icon, label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] text-[#C4CADB] transition-colors hover:text-white ${focus}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#4F6BFF]/12 text-[#8FA2FF] ring-1 ring-[#4F6BFF]/25">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─── The product: the real dashboard, with its caption beside it ─── */}
        <section id="product" aria-labelledby="product-h" className="relative scroll-mt-20">
          <div className={`${WRAP} grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:gap-14`}>
            <figure className="min-w-0">
              <ProductShot palette={PALETTE} />
              <figcaption className="mt-4 text-[12.5px] text-[#6B7489]">
                The real StockPulse dashboard · demo store, {SNAPSHOT_LABEL}
              </figcaption>
            </figure>
            <FadeIn>
              <p className={LABEL}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A898FF]" aria-hidden="true" />
                The product
              </p>
              <h2 id="product-h" className={`mt-5 ${H2_SMALL}`}>
                Everything you need,
                <span className="text-[#A9B4FF]"> in one place.</span>
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-[#A7AFC4]">
                One dashboard for the whole store — what is running low, what is close to its date, and everything from
                stock and sales to suppliers, staff and reports.
              </p>
              <a href="#inventory" className={`mt-7 inline-flex items-center gap-1.5 text-[15px] text-[#EEF0F6] hover:text-white ${focus}`}>
                See what it does <ArrowRight className="h-4 w-4 text-[#8FA2FF]" aria-hidden="true" />
              </a>
            </FadeIn>
          </div>
        </section>

        {/* ─── Three numbered chapters ─── */}
        <section aria-label="What StockPulse does" className="border-t">
          {CHAPTERS.map((c, i) => {
            const flip = i % 2 === 1
            return (
              <article key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className={`scroll-mt-20 ${WRAP}`}>
                <FadeIn
                  className={`grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-16 ${i > 0 ? 'border-t' : ''}`}
                >
                  <div className={`lg:col-span-5 ${flip ? 'lg:order-2' : ''}`}>
                    <p className="text-[13px] tabular-nums text-[#8FA2FF]">
                      0{i + 1}
                      <span className="ml-3 text-[#8A93AB]">{c.kicker}</span>
                    </p>
                    <h3
                      id={`${c.id}-h`}
                      className="mt-5 text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.035em]"
                    >
                      {c.title}
                    </h3>
                    <p className="mt-5 text-[16.5px] leading-[1.7] text-[#A7AFC4]">{c.body}</p>
                    <ul className="mt-8 border-t">
                      {c.points.map((p) => (
                        <li key={p} className="border-b py-3.5 text-[14.5px] leading-[1.55] text-[#C4CADB]">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <figure className={`lg:col-span-7 ${flip ? 'lg:order-1' : ''}`}>
                    <ChapterVisual kind={c.visual} />
                    <figcaption className="mt-4 text-[12.5px] text-[#6B7489]">
                      {c.visual === 'sales'
                        ? 'What a barcode scan shows: the product and its nearest expiry.'
                        : 'From the StockPulse dashboard.'}{' '}
                      Demo store, {SNAPSHOT_LABEL}.
                    </figcaption>
                  </figure>
                </FadeIn>
              </article>
            )
          })}
        </section>

        {/* ─── The rest of the product, as a hairline index ─── */}
        <section id="also" aria-labelledby="also-h" className="scroll-mt-20 border-t">
          <FadeIn className={`${WRAP} py-20 sm:py-24`}>
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className={LABEL}>Also in StockPulse</p>
                <h2 id="also-h" className={`mt-6 ${H2_SMALL}`}>
                  Suppliers, staff and reports,
                  <span className="text-[#A9B4FF]"> in the same app.</span>
                </h2>
              </div>
              <ul className="grid border-l border-t sm:grid-cols-2 lg:col-span-8 xl:grid-cols-4">
                {ALSO.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="border-b border-r p-6">
                    <Icon className="h-5 w-5 text-[#8FA2FF]" strokeWidth={1.5} aria-hidden="true" />
                    <h3 className="mt-6 text-[15.5px] font-medium tracking-[-0.01em]">{title}</h3>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-[#7F88A1]">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-20 border-t">
          <FadeIn className={`${WRAP} py-20 sm:py-24`}>
            <p className={LABEL}>How it works</p>
            <h2 id="how-h" className={`mt-6 max-w-3xl ${H2}`}>
              From your spreadsheet
              <span className="text-[#A9B4FF]"> to your first sale.</span>
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="border-t pt-8">
                  <span className="block text-[clamp(3rem,5vw,4.5rem)] font-light leading-none tracking-[-0.04em] text-[#8FA2FF]">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 text-[18px] font-medium tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-[15px] leading-[1.6] text-[#A7AFC4]">{s.body}</p>
                </li>
              ))}
            </ol>
          </FadeIn>
        </section>

        {/* ─── Commitments ─── */}
        <section aria-labelledby="trust-h" className="border-t bg-[#0D1326]">
          <FadeIn className={`${WRAP} py-20 sm:py-24`}>
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className={LABEL}>Built for the counter</p>
                <h2 id="trust-h" className={`mt-6 ${H2_SMALL}`}>
                  Private to your store.
                  <span className="text-[#A9B4FF]"> Safe on a shared phone.</span>
                </h2>
              </div>
              <ul className="grid gap-10 sm:grid-cols-3 lg:col-span-8 lg:gap-8">
                {COMMITMENTS.map((c) => (
                  <li key={c.title} className="border-t pt-6">
                    <h3 className="text-[17px] font-medium leading-[1.35] tracking-[-0.01em]">{c.title}</h3>
                    <p className="mt-3 text-[14.5px] leading-[1.65] text-[#8A93AB]">{c.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </section>

        {/* ─── Pricing + call to action (the only pricing on the page) ─── */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 border-t">
          <FadeIn className={`${WRAP} py-20 sm:py-28`}>
            <p className={LABEL}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#A898FF]" aria-hidden="true" />
              Pricing
            </p>
            <h2 id="pricing-h" className="mt-8 text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              Free while we’re in beta.
            </h2>
            <div className="mt-12 grid gap-10 border-t pt-10 lg:grid-cols-12">
              <p className="text-[17px] leading-[1.65] text-[#A7AFC4] lg:col-span-5">
                Every feature, for every store. No card required — and nothing to install.
              </p>
              <div className="flex flex-wrap items-center gap-6 lg:col-span-7 lg:justify-end">
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href={ROUTES.demo} className={btnQuiet}>
                  Explore the demo store <ArrowUpRight className="h-4 w-4 text-[#8FA2FF]" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t">
        <div className={`${WRAP} flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-center gap-4 text-[14px] text-[#6B7489]">
            <span className="inline-flex items-center gap-3 text-[#EEF0F6]">
              <BrandMark id="sp-mark-foot" className="h-7 w-7" />
              <span className="text-[15px] font-medium">StockPulse</span>
            </span>
            <span>© 2026</span>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-[#8A93AB]">
            {FOOTER_LINKS.map((x) => (
              <li key={x.l}>
                <Link href={x.h} className={`inline-block py-1 hover:text-white ${focus}`}>
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

/* ───────────────────────── chapter visuals ───────────────────────── */

const LIFT = 'shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]'

/**
 * Each chapter's picture: the app's real components on a slightly lifted navy
 * panel. `productTokens` re-points the theme for this subtree only, so the
 * shared components render in the light product palette without being edited.
 * Decorative to assistive tech — the chapter text and figcaption carry it.
 */
function ChapterVisual({ kind }: { kind: Visual }) {
  return (
    <div
      aria-hidden="true"
      className="select-none rounded-[20px] border bg-[#10162B] p-4 sm:p-8"
      style={{ ...productTokens(PALETTE), borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {kind === 'inventory' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ProductsTile className={`p-4 ${LIFT}`} />
            <LotsTile className={`p-4 ${LIFT}`} />
          </div>
          <ExpiringPanel line={PALETTE.line} className={LIFT} />
        </div>
      )}

      {kind === 'alerts' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LowStockTile className={`p-4 ${LIFT}`} />
            <ExpiringTile className={`p-4 ${LIFT}`} />
          </div>
          <LowStockPanel line={PALETTE.line} className={LIFT} />
        </div>
      )}

      {kind === 'sales' && (
        <div className="mx-auto max-w-md py-2 sm:py-6">
          <ScanResult />
        </div>
      )}
    </div>
  )
}

/**
 * The page's ONE human visual, in the hero as the approved reference places
 * it: a grocery store owner managing stock on a tablet, filling the right half
 * of the first screen and fading into the navy on its left and bottom edges so
 * the words and the photo read as one composition.
 *
 * The cards over it carry the demo store's REAL figures (low stock, expiring
 * lots, products) from snapshot.ts, and say so. The reference also showed a
 * "Today's Sales ₹12,480" card; it is deliberately not reproduced — the demo
 * has no real current sales figure, and an invented one would be a fake
 * statistic on a public page.
 *
 * The photograph is `public/landing/store-owner.webp`. Until that file exists
 * the frame renders a labelled placeholder rather than a broken image, so the
 * composition can be judged now and the photo dropped in with no code change.
 * Checked on the server at render time.
 *
 * Two variants because the composition differs, not just the size: on desktop
 * the photo bleeds to the page edge behind the hero; on a phone it is a
 * rounded block under the words, with two cards instead of four.
 */
const STORE_PHOTO = '/landing/store-owner.webp'
const STORE_PHOTO_ALT = 'A grocery store owner checking stock on a tablet in the aisle of her store'

function HeroPhoto({ variant }: { variant: 'desktop' | 'mobile' }) {
  const hasPhoto = existsSync(join(process.cwd(), 'public', STORE_PHOTO))
  const desktop = variant === 'desktop'
  return (
    <div
      className={
        desktop
          ? 'absolute inset-y-0 right-0 hidden w-[60%] lg:block'
          : 'relative aspect-[4/5] overflow-hidden rounded-[24px] border sm:aspect-[4/3] lg:hidden'
      }
      style={desktop ? undefined : { borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {/* The photograph itself fades to TRANSPARENT (a mask, not a navy overlay),
          so it dissolves into the same glowing background the words sit on.
          A navy overlay left a darker band between the two halves — the glow is
          lighter than #0A0F1F — which is what made the hero read as two
          sections. Two NESTED elements with one mask each (left edge, then
          bottom edge): nested masks multiply in every browser, whereas one
          element with two layers needs mask-composite, and Chrome let the
          prefixed -webkit-mask-composite override it and blank the photo. */}
      <div className="absolute inset-0" style={desktop ? fadeMask('to right', 42) : undefined}>
      <div className="absolute inset-0" style={desktop ? fadeMask('to top', 22) : undefined}>
      {hasPhoto ? (
        <Image
          src={STORE_PHOTO}
          alt={STORE_PHOTO_ALT}
          fill
          priority={desktop}
          sizes={desktop ? '52vw' : '100vw'}
          className="object-cover object-center"
        />
      ) : (
        <PhotoPlaceholder />
      )}
      </div>
      </div>

      {/* Blend the photograph into the page rather than pasting a rectangle on it. */}
      {desktop ? (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0A0F1F]/60 to-transparent" />
      ) : (
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0F1F]/85 to-transparent" />
      )}

      <div aria-hidden="true" className="select-none">
        {desktop && <Annotation className="absolute left-[30%] top-[8%]" />}
        {desktop && <NoteCard className="absolute right-[4%] top-[9%]" />}
        <FloatStat
          icon={AlertTriangle}
          tone="blue"
          label="Low Stock"
          value={`${TOTALS.lowStock} items`}
          className={desktop ? 'left-[27%] top-[47%]' : 'bottom-[5.25rem] left-4'}
        />
        <FloatStat
          icon={CalendarClock}
          tone="purple"
          label="Expiring Soon"
          value={`${TOTALS.expiringSoonLots} lots`}
          className={desktop ? 'left-[32%] top-[61%]' : 'bottom-4 left-4'}
        />
        {desktop && (
          <FloatStat
            icon={Archive}
            tone="blue"
            label="Products tracked"
            value={`${TOTALS.products}`}
            className="bottom-[16%] right-[5%]"
          />
        )}
      </div>
      <p className={`absolute text-[11.5px] text-[#8A93AB] ${desktop ? 'bottom-6 right-10' : 'bottom-4 right-4'}`}>
        Figures from the demo store
      </p>
    </div>
  )
}

/** A single-layer linear fade mask: transparent at the edge, opaque from `solidAt` percent. */
function fadeMask(direction: string, solidAt: number): React.CSSProperties {
  const g = `linear-gradient(${direction}, transparent 0%, #000 ${solidAt}%)`
  return { maskImage: g, WebkitMaskImage: g }
}

function PhotoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[#10162B]">
      <div className="absolute inset-6 rounded-[18px] border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.14)' }} />
      <p className="absolute inset-x-10 top-[32%] text-center text-[13px] leading-[1.6] text-[#6B7489]">
        Photo: a grocery store owner checking stock on a tablet in her store.
        <span className="mt-1 block text-[#4A5270]">Image to be added — public{STORE_PHOTO}</span>
      </p>
    </div>
  )
}

const TONES = {
  blue: 'bg-[#EEF0FF] text-[#4F6BFF]',
  purple: 'bg-[#F1EDFF] text-[#7A5AF8]',
} as const

/** A solid white card, as in the reference — no blur, no translucency. */
function FloatStat({
  icon: Icon,
  tone,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: keyof typeof TONES
  label: string
  value: string
  className: string
}) {
  return (
    <div
      className={`absolute flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-5 shadow-[0_24px_48px_-18px_rgba(0,0,0,0.6)] ${className}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] text-[#4B5563]">{label}</span>
        <span className="block text-[15px] font-semibold text-[#111827]">{value}</span>
      </span>
    </div>
  )
}

function NoteCard({ className }: { className: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_24px_48px_-18px_rgba(0,0,0,0.6)] ${className}`}>
      <span className="leading-snug">
        <span className="block text-[13px] font-medium text-[#111827]">Less manual work</span>
        <span className="block text-[13px] text-[#4B5563]">More time for customers</span>
      </span>
      <Heart className="mt-0.5 h-4 w-4 text-[#7A5AF8]" />
    </div>
  )
}

/** The reference's handwritten aside, with its arrow curling down toward the grocer. */
function Annotation({ className }: { className: string }) {
  return (
    <div
      className={`${caveat.variable} -rotate-6 font-[family-name:var(--font-dx-caveat)] text-[27px] font-medium leading-[1.02] text-[#E6E9FF] ${className}`}
    >
      A simpler
      <br />
      way to run
      <br />
      your store
      <svg viewBox="0 0 60 50" className="ml-16 mt-1 h-10 w-12 text-[#E6E9FF]" fill="none">
        <path d="M4 4 C 30 6, 44 18, 48 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 34 L48 42 L54 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/**
 * The Sales chapter's scan card. A scan answers with the product and ExpiryTag's
 * nearest at-risk date — the behaviour both scan flows share. Built from the
 * real Card, ExpiryTag and Badge; the product shown (Cheese Slices 100g, 18
 * units, expiring 24 Sep) is a real row of the demo snapshot, and "Discount"
 * is the badge the dashboard gives it.
 */
function ScanResult() {
  const item = EXPIRING[2]
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 ${LIFT}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEF0FF] text-[#4F6BFF]">
          <ScanBarcode className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 text-[13px] text-[#4B5563]">
          <span className="block font-semibold text-[#111827]">Barcode found</span>
          Matched in this store’s products
        </span>
      </div>
      <Card className={LIFT}>
        <CardHeader title={item.name} subtitle={`${item.quantity} units in stock`} />
        <CardBody>
          <div className="flex items-center justify-between gap-3 border-t pt-3.5">
            <ExpiryTag date={item.expiry} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} />
            <Badge tone="neutral" className="shrink-0 whitespace-nowrap">
              Discount
            </Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
