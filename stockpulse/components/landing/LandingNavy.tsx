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
import DashboardShot, { productTokens, type Palette } from '@/components/product/DashboardShot'
import FadeIn from '@/components/landing/FadeIn'
import ExpiryTag from '@/components/ui/ExpiryTag'
import Badge from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EXPIRING, SNAPSHOT_DATE, TOTALS, WARNING_DAYS } from '@/components/landing/snapshot'
import { fillShot, type ProductShotCopy } from '@/lib/i18n/productShot'
import { resolveProductShot } from '@/lib/i18n/productShotResolve'
import { landingSans, landingScript } from './fonts'
import { ExpiringPanel, ExpiringTile, LotsTile, LowStockPanel, LowStockTile, ProductsTile } from './panels'
import StockPulseMark from '@/components/brand/StockPulseMark'
import MobileMenuDark from './MobileMenuDark'
import LanguageSelector from './LanguageSelector'
import { DEFAULT_LOCALE, landingCopy, type Locale } from '@/lib/i18n'

/**
 * THE LANDING PAGE — app/page.tsx renders this for every signed-out visitor.
 *
 * Approved as /design-exploration/3/full and promoted here unchanged in
 * design: deep navy, Inter Tight, hairline rules, periwinkle index numbers,
 * one soft-purple dot, and the product shown as the real dashboard rather
 * than a drawing of one. That preview route still exists and now renders THIS
 * file, so the two cannot drift.
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

/**
 * Structure only. Every label on this page now comes from lib/i18n/landing in
 * the visitor's language; what stays here is the thing that does not
 * translate — ids, hrefs, icons and order.
 */
const NAV = [
  { key: 'product', href: '#product' },
  { key: 'how', href: '#how-it-works' },
  { key: 'pricing', href: '#pricing' },
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

const CHAPTERS: ReadonlyArray<{ id: 'inventory' | 'sales' | 'alerts'; visual: Visual }> = [
  { id: 'inventory', visual: 'inventory' },
  { id: 'sales', visual: 'sales' },
  { id: 'alerts', visual: 'alerts' },
]

/** The feature strip under the hero — the modules, each linking to where the page explains it. */
const STRIP = [
  { icon: Archive, key: 'inventory', href: '#inventory' },
  { icon: ReceiptText, key: 'sales', href: '#sales' },
  { icon: CalendarClock, key: 'expiry', href: '#alerts' },
  { icon: Truck, key: 'suppliers', href: '#also' },
  { icon: Users, key: 'staff', href: '#also' },
  { icon: BarChart3, key: 'reports', href: '#also' },
] as const

/** Icons only, in the order the dictionary lists the items. */
const ALSO_ICONS = [ScanBarcode, Truck, UserSquare2, FileText, Users, Bot, Smartphone, History]

const FOOTER_LINKS = [
  { key: 'login', h: ROUTES.login },
  { key: 'getStarted', h: ROUTES.signup },
  { key: 'demo', h: ROUTES.demo },
  { key: 'privacy', h: ROUTES.privacy },
  { key: 'terms', h: ROUTES.terms },
] as const

/* ───────────────────────── page ───────────────────────── */

export default function LandingNavy({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  // Resolved once, on the server. The prop defaults to English so the preview
  // route (/design-exploration/3/full) keeps rendering without knowing about
  // locales at all.
  const t = landingCopy(locale)
  // The product previews' words — the dashboard picture, its panels, the hero
  // cards and the scan card — in the same language as the prose around them.
  const shot = resolveProductShot(locale)

  return (
    <div
      className={`${landingSans.variable} min-h-screen bg-[#0A0F1F] font-[family-name:var(--font-landing-sans)] text-[#EEF0F6] antialiased`}
      style={{ ['--border' as string]: 'rgba(255,255,255,0.10)' } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b bg-[#0A0F1F]">
        <div className={`relative flex h-20 items-center justify-between ${WRAP}`}>
          <Link href="/" aria-label={shot.ariaHome} className={`inline-flex items-center gap-3 rounded-md ${focus}`}>
            <StockPulseMark uid="landing-nav" className="h-8 w-8" />
            <span className="text-[17px] font-semibold tracking-[-0.01em]">StockPulse</span>
          </Link>
          {/* Telugu and Hindi labels are too long for the inline nav to fit a
              768px tablet (measured: 15px of horizontal overflow and the logo
              touching the first link), so those two languages keep the menu
              button up to lg. English fits and keeps its approved md layout. */}
          <nav
            aria-label={shot.ariaPrimary}
            className={`hidden items-center gap-10 text-[14px] text-[#A7AFC4] ${locale === 'en' ? 'md:flex' : 'lg:flex'}`}
          >
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`hover:text-white ${focus}`}>
                {t.nav[n.key]}
              </a>
            ))}
            <Link href={ROUTES.login} className={`hover:text-white ${focus}`}>
              {t.nav.login}
            </Link>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            {/* The language control sits with the other header actions and
                stays visible at every width — on a phone the rest of this
                group collapses into the menu, and a setting nobody can find
                is not a setting. */}
            <LanguageSelector locale={locale} label={t.nav.languageLabel} />
            <Link
              href={ROUTES.signup}
              className={`hidden h-10 items-center gap-1.5 rounded-full bg-[#4F6BFF] px-5 text-[14px] font-medium text-white hover:bg-[#6580FF] sm:inline-flex ${focus}`}
            >
              {t.nav.getStarted} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.demo}
              className={`hidden items-center gap-1.5 text-[14px] text-[#EEF0F6] hover:text-white lg:inline-flex ${focus}`}
            >
              {t.nav.demoShort} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <MobileMenuDark
              openLabel={shot.ariaOpenMenu}
              closeLabel={shot.ariaCloseMenu}
              collapseBelow={locale === 'en' ? 'md' : 'lg'}
              links={NAV.map((n) => ({ label: t.nav[n.key], href: n.href }))}
              cta={[
                { label: t.nav.getStarted, href: ROUTES.signup, className: `${btnPrimary} w-full` },
                { label: t.nav.demoLong, href: ROUTES.demo, className: `${btnQuiet} w-full rounded-full border` },
                { label: t.nav.login, href: ROUTES.login, className: `py-2 text-center text-[15px] text-[#8A93AB] ${focus}` },
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

          <HeroPhoto variant="desktop" caption={t.captions.figures} shot={shot} />
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
                {t.hero.badge}
              </p>
              <h1
                id="hero-h"
                className="mt-7 text-[clamp(2.6rem,4.1vw,4rem)] font-semibold leading-[1.04] tracking-[-0.045em]"
              >
                {t.hero.titleA}
                <br />
                <span className="text-[#A9B4FF]">{t.hero.titleAccent}</span>
                <span className="relative inline-block whitespace-nowrap">
                  <span className="bg-gradient-to-r from-[#5B8CFF] to-[#B08CFF] bg-clip-text text-transparent">
                    {t.hero.titleHighlight}
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
                {/* Empty in English. Telugu and Hindi put the negation after
                    the noun, and it sits OUTSIDE the nowrap span so a long
                    phrase can still wrap on a narrow screen. */}
                <span className="text-[#A9B4FF]">{t.hero.titleTail}</span>
              </h1>
              <p className="mt-8 max-w-lg text-[17px] leading-[1.65] text-[#A7AFC4] sm:text-[18px]">
                {t.hero.body}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={ROUTES.signup} className={btnPrimary}>
                  {t.nav.getStarted} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={ROUTES.demo}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] font-medium text-[#EEF0F6] transition-colors hover:bg-white/5 ${focus}`}
                  style={{ borderColor: 'rgba(255,255,255,0.18)' }}
                >
                  {t.nav.demoLong} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-5 text-[13px] text-[#8A93AB]">{t.hero.note}</p>
            </div>

            <HeroPhoto variant="mobile" caption={t.captions.figures} shot={shot} />
          </div>
        </section>

        {/* ─── Feature strip: the modules, one line ─── */}
        <nav aria-label={shot.ariaFeatures} className="relative border-y">
          <ul className={`${WRAP} grid grid-cols-2 gap-y-1 py-4 sm:grid-cols-3 lg:grid-cols-6`}>
            {STRIP.map(({ icon: Icon, key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] text-[#C4CADB] transition-colors hover:text-white ${focus}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#4F6BFF]/12 text-[#8FA2FF] ring-1 ring-[#4F6BFF]/25">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {t.strip[key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─── The product: the real dashboard, with its caption beside it ─── */}
        <section id="product" aria-labelledby="product-h" className="relative scroll-mt-20">
          <div className={`${WRAP} grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:gap-14`}>
            <figure className="min-w-0">
              <DashboardShot palette={PALETTE} shot={shot} />
              <figcaption className="mt-4 text-[12.5px] text-[#6B7489]">
                {t.product.caption}, {shot.snapshotLabel}
              </figcaption>
            </figure>
            <FadeIn>
              <p className={LABEL}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A898FF]" aria-hidden="true" />
                {t.product.label}
              </p>
              <h2 id="product-h" className={`mt-5 ${H2_SMALL}`}>
                {t.product.titleA}
                <span className="text-[#A9B4FF]">{t.product.titleB}</span>
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-[#A7AFC4]">{t.product.body}</p>
              <a href="#inventory" className={`mt-7 inline-flex items-center gap-1.5 text-[15px] text-[#EEF0F6] hover:text-white ${focus}`}>
                {t.product.cta} <ArrowRight className="h-4 w-4 text-[#8FA2FF]" aria-hidden="true" />
              </a>
            </FadeIn>
          </div>
        </section>

        {/* ─── Three numbered chapters ─── */}
        <section aria-label={shot.ariaWhat} className="border-t">
          {CHAPTERS.map((c, i) => {
            const flip = i % 2 === 1
            const copy = t.chapters[c.id]
            return (
              <article key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className={`scroll-mt-20 ${WRAP}`}>
                <FadeIn
                  className={`grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-16 ${i > 0 ? 'border-t' : ''}`}
                >
                  <div className={`lg:col-span-5 ${flip ? 'lg:order-2' : ''}`}>
                    <p className="text-[13px] tabular-nums text-[#8FA2FF]">
                      0{i + 1}
                      <span className="ml-3 text-[#8A93AB]">{copy.kicker}</span>
                    </p>
                    <h3
                      id={`${c.id}-h`}
                      className="mt-5 text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.035em]"
                    >
                      {copy.title}
                    </h3>
                    <p className="mt-5 text-[16.5px] leading-[1.7] text-[#A7AFC4]">{copy.body}</p>
                    <ul className="mt-8 border-t">
                      {copy.points.map((p) => (
                        <li key={p} className="border-b py-3.5 text-[14.5px] leading-[1.55] text-[#C4CADB]">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <figure className={`lg:col-span-7 ${flip ? 'lg:order-1' : ''}`}>
                    <ChapterVisual kind={c.visual} shot={shot} />
                    <figcaption className="mt-4 text-[12.5px] text-[#6B7489]">
                      {c.visual === 'sales' ? t.captions.sales : t.captions.standard}{' '}
                      {t.captions.demoStore}, {shot.snapshotLabel}.
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
                <p className={LABEL}>{t.also.label}</p>
                <h2 id="also-h" className={`mt-6 ${H2_SMALL}`}>
                  {t.also.titleA}
                  <span className="text-[#A9B4FF]">{t.also.titleB}</span>
                </h2>
              </div>
              <ul className="grid border-l border-t sm:grid-cols-2 lg:col-span-8 xl:grid-cols-4">
                {t.also.items.map((item, i) => {
                  const Icon = ALSO_ICONS[i]
                  return (
                    <li key={item.title} className="border-b border-r p-6">
                      <Icon className="h-5 w-5 text-[#8FA2FF]" strokeWidth={1.5} aria-hidden="true" />
                      <h3 className="mt-6 text-[15.5px] font-medium tracking-[-0.01em]">{item.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-[1.55] text-[#7F88A1]">{item.body}</p>
                    </li>
                  )
                })}
              </ul>
            </div>
          </FadeIn>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-20 border-t">
          <FadeIn className={`${WRAP} py-20 sm:py-24`}>
            <p className={LABEL}>{t.how.label}</p>
            <h2 id="how-h" className={`mt-6 max-w-3xl ${H2}`}>
              {t.how.titleA}
              <span className="text-[#A9B4FF]">{t.how.titleB}</span>
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {t.how.steps.map((s, i) => (
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
                <p className={LABEL}>{t.trust.label}</p>
                <h2 id="trust-h" className={`mt-6 ${H2_SMALL}`}>
                  {t.trust.titleA}
                  <span className="text-[#A9B4FF]">{t.trust.titleB}</span>
                </h2>
              </div>
              <ul className="grid gap-10 sm:grid-cols-3 lg:col-span-8 lg:gap-8">
                {t.trust.items.map((c) => (
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
              {t.pricing.label}
            </p>
            <h2 id="pricing-h" className="mt-8 text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              {t.pricing.title}
            </h2>
            <div className="mt-12 grid gap-10 border-t pt-10 lg:grid-cols-12">
              <p className="text-[17px] leading-[1.65] text-[#A7AFC4] lg:col-span-5">
                {t.pricing.body}
              </p>
              <div className="flex flex-wrap items-center gap-6 lg:col-span-7 lg:justify-end">
                <Link href={ROUTES.signup} className={btnPrimary}>
                  {t.nav.getStarted} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href={ROUTES.demo} className={btnQuiet}>
                  {t.nav.demoLong} <ArrowUpRight className="h-4 w-4 text-[#8FA2FF]" aria-hidden="true" />
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
              <StockPulseMark uid="landing-footer" className="h-7 w-7" />
              <span className="text-[15px] font-medium">StockPulse</span>
            </span>
            <span>© 2026</span>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-[#8A93AB]">
            {FOOTER_LINKS.map((x) => (
              <li key={x.key}>
                <Link href={x.h} className={`inline-block py-1 hover:text-white ${focus}`}>
                  {t.footer[x.key]}
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
function ChapterVisual({ kind, shot }: { kind: Visual; shot: ProductShotCopy }) {
  return (
    <div
      aria-hidden="true"
      className="select-none rounded-[20px] border bg-[#10162B] p-4 sm:p-8"
      style={{ ...productTokens(PALETTE), borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {kind === 'inventory' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ProductsTile className={`p-4 ${LIFT}`} shot={shot} />
            <LotsTile className={`p-4 ${LIFT}`} shot={shot} />
          </div>
          <ExpiringPanel line={PALETTE.line} className={LIFT} shot={shot} />
        </div>
      )}

      {kind === 'alerts' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <LowStockTile className={`p-4 ${LIFT}`} shot={shot} />
            <ExpiringTile className={`p-4 ${LIFT}`} shot={shot} />
          </div>
          <LowStockPanel line={PALETTE.line} className={LIFT} shot={shot} />
        </div>
      )}

      {kind === 'sales' && (
        <div className="mx-auto max-w-md py-2 sm:py-6">
          <ScanResult shot={shot} />
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

function HeroPhoto({
  variant,
  caption,
  shot,
}: {
  variant: 'desktop' | 'mobile'
  caption: string
  shot: ProductShotCopy
}) {
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
          alt={shot.photoAlt}
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
        {desktop && <Annotation className="absolute left-[30%] top-[8%]" lines={shot.annotation} />}
        {desktop && <NoteCard className="absolute right-[4%] top-[9%]" shot={shot} />}
        <FloatStat
          icon={AlertTriangle}
          tone="blue"
          label={shot.lowStock}
          value={fillShot(shot.heroItems, { n: TOTALS.lowStock })}
          className={desktop ? 'left-[27%] top-[47%]' : 'bottom-[5.25rem] left-4'}
        />
        <FloatStat
          icon={CalendarClock}
          tone="purple"
          label={shot.expiringSoon}
          value={fillShot(shot.heroLots, { n: TOTALS.expiringSoonLots })}
          className={desktop ? 'left-[32%] top-[61%]' : 'bottom-4 left-4'}
        />
        {desktop && (
          <FloatStat
            icon={Archive}
            tone="blue"
            label={shot.productsTracked}
            value={`${TOTALS.products}`}
            className="bottom-[16%] right-[5%]"
          />
        )}
      </div>
      <p className={`absolute text-[11.5px] text-[#8A93AB] ${desktop ? 'bottom-6 right-10' : 'bottom-4 right-4'}`}>
        {caption}
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

function NoteCard({ className, shot }: { className: string; shot: ProductShotCopy }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_24px_48px_-18px_rgba(0,0,0,0.6)] ${className}`}>
      <span className="leading-snug">
        <span className="block text-[13px] font-medium text-[#111827]">{shot.noteA}</span>
        <span className="block text-[13px] text-[#4B5563]">{shot.noteB}</span>
      </span>
      <Heart className="mt-0.5 h-4 w-4 text-[#7A5AF8]" />
    </div>
  )
}

/** The reference's handwritten aside, with its arrow curling down toward the grocer. */
function Annotation({ className, lines }: { className: string; lines: readonly string[] }) {
  return (
    <div
      className={`${landingScript.variable} -rotate-6 font-[family-name:var(--font-landing-script)] text-[27px] font-medium leading-[1.02] text-[#E6E9FF] ${className}`}
    >
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
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
function ScanResult({ shot }: { shot: ProductShotCopy }) {
  const item = EXPIRING[2]
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 ${LIFT}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEF0FF] text-[#4F6BFF]">
          <ScanBarcode className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 text-[13px] text-[#4B5563]">
          <span className="block font-semibold text-[#111827]">{shot.scanFound}</span>
          {shot.scanMatched}
        </span>
      </div>
      <Card className={LIFT}>
        <CardHeader title={item.name} subtitle={fillShot(shot.unitsInStock, { n: item.quantity })} />
        <CardBody>
          <div className="flex items-center justify-between gap-3 border-t pt-3.5">
            <ExpiryTag date={item.expiry} today={SNAPSHOT_DATE} warningDays={WARNING_DAYS} copy={shot.expiry} />
            <Badge tone="neutral" className="shrink-0 whitespace-nowrap">
              {shot.discount}
            </Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
