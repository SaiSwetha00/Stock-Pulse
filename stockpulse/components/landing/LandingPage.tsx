import Link from 'next/link'
import {
  AlertTriangle,
  CalendarClock,
  Archive,
  ArrowRight,
  BellRing,
  ChartColumn,
  Check,
  Layers,
  Lightbulb,
  ReceiptText,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import FadeIn from './FadeIn'
import MobileMenu from './MobileMenu'
import {
  AppWindow,
  CategoryBars,
  DASHBOARD_LABEL,
  DashboardScreen,
  ExpiringCard,
  FefoCard,
  INVENTORY_LABEL,
  InventoryScreen,
  LANDING_TOKENS,
  LotsCard,
  OfflineCard,
  RolesCard,
  SNAPSHOT_LABEL,
  StockHealthCard,
  SupplierStages,
} from './ProductUI'
import { OFFLINE_UI } from './snapshot'

/**
 * The public landing page.
 *
 * DIRECTION. A clean finance-dashboard SaaS composition (inspired by UXinity's
 * "modern finance dashboard" landing layout, not copied from it): minimal
 * navigation, a split hero whose largest element is the product, a few quiet
 * floating cards, spacious sections of rounded white cards, and one restrained
 * blue-to-purple treatment at the close. Palette: white base, blue #2563EB
 * for action, purple #7C3AED as the secondary accent, navy #0F172A text.
 *
 * CONTENT. Every capability named here exists in the app, and every figure in
 * the product imagery is the demo store's real data (./snapshot.ts). The brief
 * was written in stock-market language ("understand the market", "search a
 * company"); StockPulse manages a grocery store's stock, so the copy keeps the
 * brief's structure and tone but describes what the product actually does.
 *
 * WEIGHT. Server-rendered throughout. The only client JavaScript is the phone
 * menu and the scroll fade-in. The hero's entrance is pure CSS and switched
 * off under prefers-reduced-motion.
 */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
] as const

const ROUTES = { login: '/login', signup: '/signup', demo: '/login?demo=1', privacy: '/privacy', terms: '/terms' }

const PAGE_STYLES = `
html, body { background: #FFFFFF; color-scheme: light; }
html { scroll-behavior: smooth; }
@keyframes lp-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.lp-rise { animation: lp-rise 700ms cubic-bezier(.2,.7,.2,1) both; }
.lp-rise-1 { animation-delay: 120ms; } .lp-rise-2 { animation-delay: 260ms; } .lp-rise-3 { animation-delay: 380ms; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .lp-rise { animation: none; }
}
`

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'
const btnPrimary = `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-px hover:bg-[#1D4ED8] ${focus}`
const btnSecondary = `inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 text-[15px] font-semibold text-[#0F172A] transition-colors hover:border-[#C4B5FD] hover:text-[#6D28D9] ${focus}`

const eyebrow = 'text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6D28D9]'
const h2 = 'text-balance text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0F172A]'
const lead = 'text-[17px] leading-relaxed text-[#475569]'
const card =
  'rounded-2xl border border-[#E8ECF4] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_-18px_rgba(15,23,42,0.18)]'

const VALUE = [
  { icon: Archive, title: 'Inventory', body: 'Every product and every delivery lot, each with its own expiry date.' },
  { icon: ReceiptText, title: 'Sales & POS', body: 'Sell at the counter — stock is taken from the lot that expires first.' },
  { icon: BellRing, title: 'Alerts', body: 'Low-stock and expiry warnings before they turn into a loss.' },
  { icon: ChartColumn, title: 'Reports & AI', body: 'Clear reports, and an AI assistant that answers from your store’s data.' },
]

const STEPS = [
  { n: '01', icon: ScanSearch, title: 'Search', body: 'Find any product by name, or scan its barcode with the device camera.' },
  { n: '02', icon: Layers, title: 'Analyze', body: 'See its stock, delivery lots, expiry dates and how it has been selling.' },
  { n: '03', icon: Lightbulb, title: 'Understand', body: 'Act on what surfaces — reorder, discount before expiry, or ask the AI assistant.' },
]

const TRUST = [
  { title: 'Separate by store', body: 'Every record is scoped to its store and protected by row-level security in the database.' },
  { title: 'Role-based access', body: 'Owner, manager and staff permissions, checked on the server for every change.' },
  { title: 'A full audit trail', body: 'Changes are logged with who made them and the before-and-after values.' },
  { title: 'Sync that can’t double-count', body: 'Each offline sale carries its own ID, so a retry can never record it twice.' },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-clip bg-white font-[family-name:var(--font-inter)] text-[#0F172A] antialiased"
      style={LANDING_TOKENS}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-[#2563EB] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-[#EEF2F7] bg-white/85 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="StockPulse home" className={`rounded-md ${focus}`}>
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-9 text-[14.5px] font-medium text-[#475569]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`inline-block rounded-sm py-1.5 transition-colors hover:text-[#2563EB] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={ROUTES.login}
              className={`rounded-lg px-3 py-2 text-[14.5px] font-medium text-[#475569] transition-colors hover:text-[#2563EB] ${focus}`}
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
              { label: 'Explore the demo store', href: ROUTES.demo, className: `${btnSecondary} w-full` },
              { label: 'Login', href: ROUTES.login, className: `py-2 text-center text-[15px] font-medium text-[#475569] ${focus}` },
            ]}
          />
        </div>
      </header>

      <main id="main">
        {/* ─── Hero ─── */}
        <section aria-labelledby="hero-h" className="relative">
          {/* A single soft wash of the two brand colours behind the hero. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_85%_20%,rgba(124,58,237,0.10),transparent_70%),radial-gradient(45%_55%_at_60%_60%,rgba(37,99,235,0.10),transparent_70%)]"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 lg:pb-28">
            <div className="lp-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#E0E7FF] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3730A3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
                Store management for independent grocers
              </p>
              <h1
                id="hero-h"
                className="mt-6 text-balance text-[clamp(2.6rem,5vw,4.1rem)] font-semibold leading-[1.04] tracking-[-0.04em]"
              >
                Understand your store.{' '}
                <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                  Make smarter decisions.
                </span>
              </h1>
              <p className={`mt-6 max-w-lg ${lead} sm:text-[18px]`}>
                StockPulse brings your stock, sales, expiry dates and suppliers together in one simple dashboard.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#features" className={btnSecondary}>
                  Explore Features
                </a>
              </div>
              <p className="mt-5 text-[13.5px] text-[#64748B]">
                Free while in beta · No card required ·{' '}
                <Link href={ROUTES.demo} className={`inline-block py-1 font-medium text-[#2563EB] underline-offset-4 hover:underline ${focus}`}>
                  Open the demo store
                </Link>
              </p>
            </div>

            {/* The product is the largest thing on the page. */}
            <div className="relative lg:pl-6">
              {/* No sidebar here: in a 55% column it squeezed the alert cards until
                  product names truncated. The full-width showcase below keeps it. */}
              <div className="lp-rise lp-rise-1">
                <AppWindow sidebar={false} label={DASHBOARD_LABEL}>
                  <DashboardScreen />
                </AppWindow>
              </div>

              {/* Floating cards — desktop only, decorative, real data. Each sits on
                  the window's EDGE (chrome or bottom padding), never over its
                  content: placed inside, they hid the Products tile and a row of
                  the low-stock list. */}
              <div aria-hidden="true" className="hidden lg:block">
                <FloatCard className="lp-rise lp-rise-2 -bottom-9 -right-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#B45309]" /> Low stock
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-[13.5px] font-semibold">Butter 500g</span>
                    <Badge tone="warning">2 / 5</Badge>
                  </div>
                </FloatCard>
                <FloatCard className="lp-rise lp-rise-3 -bottom-9 left-0">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    <CalendarClock className="h-3.5 w-3.5 text-[#6D28D9]" /> Expiring soon
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-[13.5px] font-semibold">Cheese Slices 100g</span>
                    <span className="text-[12.5px] font-medium text-[#B45309]">in 5 days</span>
                  </div>
                </FloatCard>
                <FloatCard className="lp-rise lp-rise-3 -right-4 -top-6">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    <RefreshCw className="h-3.5 w-3.5 text-[#15803D]" /> Offline sales
                  </p>
                  <Badge tone="success" className="mt-2">
                    {OFFLINE_UI.synced}
                  </Badge>
                </FloatCard>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Product value ─── */}
        <section
          id="features"
          aria-labelledby="features-h"
          className="scroll-mt-20 border-t border-[#EEF2F7] bg-[#F8FAFF] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>Features</p>
              <h2 id="features-h" className={`mt-3 ${h2}`}>
                Everything a grocery store runs on.
              </h2>
            </FadeIn>
            <FadeIn className="mt-14">
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {VALUE.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className={`${card} p-6 transition-transform hover:-translate-y-0.5`}>
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-xl ${
                        i % 2 ? 'bg-[#F3E8FF] text-[#6D28D9]' : 'bg-[#EFF4FF] text-[#2563EB]'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">{body}</p>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </section>

        {/* ─── Large product showcase ─── */}
        {/* lg:pb-64: the overlapping cards hang 216px below the window, over its
            bottom padding only — placed higher they hid the table's last rows. */}
        <section aria-labelledby="showcase-h" className="py-20 sm:py-28 lg:pb-64">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <FadeIn className="max-w-2xl">
              <p className={eyebrow}>The product</p>
              <h2 id="showcase-h" className={`mt-3 ${h2}`}>
                Everything you need to run the shop.
              </h2>
              <p className={`mt-4 ${lead}`}>
                One inventory, kept by delivery lot. Scan to find a product, see what it has left and when it expires.
              </p>
            </FadeIn>
            <FadeIn className="relative mt-12 lg:pr-24">
              <AppWindow active="/inventory" label={INVENTORY_LABEL}>
                <InventoryScreen />
              </AppWindow>
              <div
                aria-hidden="true"
                className="mt-5 grid gap-4 sm:grid-cols-2 lg:absolute lg:-bottom-[216px] lg:right-0 lg:mt-0 lg:w-[560px]"
              >
                <LotsCard className="shadow-[0_24px_50px_-24px_rgba(15,23,42,0.35)]" />
                <ExpiringCard limit={2} className="shadow-[0_24px_50px_-24px_rgba(15,23,42,0.35)]" />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ─── Data visualisation ─── */}
        <section aria-labelledby="viz-h" className="border-t border-[#EEF2F7] bg-[#F8FAFF] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
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
            <FadeIn className="mt-14 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <CategoryBars tall />
              <StockHealthCard />
            </FadeIn>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" aria-labelledby="how-h" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <p className={eyebrow}>How it works</p>
              <h2 id="how-h" className={`mt-3 ${h2}`}>
                Three steps from question to answer.
              </h2>
            </FadeIn>
            <FadeIn className="mt-14">
              <ol className="grid gap-5 md:grid-cols-3">
                {STEPS.map(({ n, icon: Icon, title, body }) => (
                  <li key={n} className={`${card} relative overflow-hidden p-7`}>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-4 bg-gradient-to-br from-[#DBE4FF] to-[#EDE3FF] bg-clip-text text-[88px] font-bold leading-none text-transparent"
                    >
                      {n}
                    </span>
                    <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-[#2563EB] text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="relative mt-5 text-[13px] font-semibold text-[#6D28D9]">Step {n}</p>
                    <h3 className="relative mt-1 text-[19px] font-semibold tracking-tight">{title}</h3>
                    <p className="relative mt-2 text-[15px] leading-relaxed text-[#475569]">{body}</p>
                  </li>
                ))}
              </ol>
            </FadeIn>
          </div>
        </section>

        {/* ─── Feature showcase, alternating ─── */}
        <section aria-labelledby="more-h" className="border-t border-[#EEF2F7] bg-[#F8FAFF] py-20 sm:py-28">
          <h2 id="more-h" className="sr-only">
            Features in detail
          </h2>
          <div className="mx-auto max-w-7xl space-y-20 px-5 sm:space-y-28 sm:px-8">
            <ShowcaseRow
              tag="Sales & offline"
              title="Sell first what expires first."
              body="Each sale takes stock from the lot with the earliest date. If the signal drops, sales are saved on the device and sync once you’re back — each exactly once."
              points={['Earliest-expiry-first selling', 'Offline sales that sync automatically', 'Barcode scanning at the till']}
              panel={
                <div className="grid gap-4 sm:grid-cols-2">
                  <FefoCard />
                  <div className="sm:pt-10">
                    <OfflineCard />
                  </div>
                </div>
              }
            />
            <ShowcaseRow
              reverse
              tag="Suppliers & staff"
              title="Orders and people, organised."
              body="Follow each purchase order from ordered to at dock, give everyone the access their role needs, and keep a record of every change."
              points={['Four-stage purchase orders', 'Owner, manager and staff roles', 'Audit log with before-and-after values']}
              panel={
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:pt-10">
                    <SupplierStages />
                  </div>
                  <RolesCard />
                </div>
              }
            />
          </div>
        </section>

        {/* ─── About (and the one pricing statement) ─── */}
        <section id="about" aria-labelledby="about-h" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <FadeIn>
              <p className={eyebrow}>About</p>
              <h2 id="about-h" className={`mt-3 ${h2}`}>
                Built for independent grocers.
              </h2>
              <p className={`mt-5 ${lead}`}>
                StockPulse runs in the browser on the computer or phone you already have — no hardware to buy, nothing to
                install.
              </p>
              <div className={`${card} mt-8 flex flex-wrap items-center justify-between gap-5 p-6`}>
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">Pricing</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[34px] font-semibold tracking-[-0.03em]">₹0</span>
                    <span className="text-[15px] text-[#64748B]">while in beta · no card required</span>
                  </p>
                </div>
                <Link href={ROUTES.signup} className={btnPrimary}>
                  Get Started
                </Link>
              </div>
            </FadeIn>
            <FadeIn>
              <dl className="grid gap-4 sm:grid-cols-2">
                {TRUST.map((t, i) => (
                  <div key={t.title} className={`${card} p-6`}>
                    <ShieldCheck className={`h-5 w-5 ${i % 2 ? 'text-[#7C3AED]' : 'text-[#2563EB]'}`} aria-hidden="true" />
                    <dt className="mt-4 text-[15.5px] font-semibold tracking-tight">{t.title}</dt>
                    <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[#475569]">{t.body}</dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section aria-labelledby="cta-h" className="px-4 pb-20 sm:px-8 sm:pb-28">
          <FadeIn className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#E0E7FF] bg-gradient-to-br from-[#EEF3FF] via-[#F4F1FF] to-[#F6EEFF] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7C3AED]/10 blur-3xl"
            />
            <h2 id="cta-h" className={`relative mx-auto max-w-2xl ${h2}`}>
              Start running your store with StockPulse.
            </h2>
            <p className={`relative mx-auto mt-4 max-w-lg ${lead}`}>
              Stock, sales, expiry dates and suppliers in one simple experience.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={ROUTES.signup} className={`${btnPrimary} w-full sm:w-auto`}>
                Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.demo} className={`${btnSecondary} w-full sm:w-auto`}>
                Explore the demo store
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#EEF2F7] bg-[#FBFCFF] pb-14 pt-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-[#475569]">
              Store management for independent grocers — inventory, sales, suppliers and staff in one place.
            </p>
          </div>
          <FooterCol title="Product" items={NAV.map((n) => ({ ...n, anchor: true }))} />
          <FooterCol
            title="Account"
            items={[
              { label: 'Login', href: ROUTES.login },
              { label: 'Get Started', href: ROUTES.signup },
              { label: 'Explore the demo', href: ROUTES.demo },
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-[#EEF2F7] px-5 pt-6 text-[13.5px] text-[#64748B] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 StockPulse</p>
          <ul className="flex gap-5">
            <li>
              <Link href={ROUTES.privacy} className={`inline-block py-1 hover:text-[#2563EB] ${focus}`}>
                Privacy
              </Link>
            </li>
            <li>
              <Link href={ROUTES.terms} className={`inline-block py-1 hover:text-[#2563EB] ${focus}`}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

/* ───────────── pieces ───────────── */

/** The pulse mark, in the landing palette, with a sans wordmark. */
function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="sp-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#sp-mark)" />
        <path
          d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[18px] font-bold tracking-[-0.02em] text-[#0F172A]">StockPulse</span>
    </span>
  )
}

function FloatCard({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute rounded-2xl border border-[#E8ECF4] bg-white/95 p-4 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}

function ShowcaseRow({
  tag,
  title,
  body,
  points,
  panel,
  reverse = false,
}: {
  tag: string
  title: string
  body: string
  points: string[]
  panel: React.ReactNode
  reverse?: boolean
}) {
  return (
    <FadeIn className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className={eyebrow}>{tag}</p>
        <h3 className="mt-3 text-balance text-[clamp(1.6rem,2.8vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.025em]">
          {title}
        </h3>
        <p className={`mt-4 ${lead}`}>{body}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[15px] text-[#475569]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EFF4FF] text-[#2563EB]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
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

function FooterCol({ title, items }: { title: string; items: Array<{ label: string; href: string; anchor?: boolean }> }) {
  const cls = `inline-block py-1 text-[14.5px] text-[#475569] hover:text-[#2563EB] ${focus}`
  return (
    <nav aria-label={title}>
      <p className="text-[13px] font-semibold text-[#0F172A]">{title}</p>
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
