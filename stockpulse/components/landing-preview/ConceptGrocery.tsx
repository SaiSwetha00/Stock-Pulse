import Link from 'next/link'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { jakarta } from './fonts'
import { FAQ, HERO, LINKS, NAV, PRICING, STEPS, TRUST, moduleByKey } from './content'
import DashboardMock from './DashboardMock'
import MobileMenu from './MobileMenu'
import PulseMark from './PulseMark'

/**
 * CONCEPT 2 — Modern Grocery Operations.
 *
 * Warm, but a business tool: cream paper, a deep grocer's green for action,
 * and three small status colours (saffron, leaf, tomato) that ONLY ever mean
 * what they mean inside the app — expiring, fine, expired. No produce
 * illustrations; the "grocery" feeling comes from the content of the little
 * UI fragments (lots with expiry dates, a receipt, a delivery pipeline), each
 * of which is a faithful miniature of a real screen.
 *
 * Contrast against cream #FBF8F2: ink #1B2620 15.6:1, body #3E4A43 9.3:1,
 * muted #56615A 6.2:1. White on green #1E5B3F is 7.9:1.
 */

const PAGE_STYLES = `
html, body { background: #FBF8F2; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const THEME = {
  '--border': '#E8E2D6',
  '--dm-bg': '#FFFFFF',
  '--dm-canvas': '#FDFBF7',
  '--dm-surface': '#FFFFFF',
  '--dm-border': '#EEE8DC',
  '--dm-dot': '#E5DED0',
  '--dm-ink': '#1B2620',
  '--dm-muted': '#56615A',
  '--dm-accent': '#1E5B3F',
  '--dm-accent-ink': '#FFFFFF',
  '--dm-accent-soft': '#E4EFE7',
  '--dm-accent-strong': '#1E5B3F',
  '--dm-bar': '#CBE0D2',
  '--dm-warn': '#875200',
  '--dm-warn-soft': '#FCF0D6',
  '--dm-danger': '#A3341B',
  '--dm-up': '#1E5B3F',
  '--dm-radius': '18px',
  '--dm-shadow': '0 2px 4px rgba(27,38,32,0.04), 0 30px 60px -30px rgba(30,91,63,0.35)',
} as React.CSSProperties

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E5B3F]'
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5B3F] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#174A33] ${focus}`
const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D0BF] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#1B2620] transition-colors hover:border-[#1E5B3F] ${focus}`

/** The three status tones, mirroring the app: leaf = fine, saffron = soon, tomato = expired. */
const chip = {
  leaf: 'bg-[#E4EFE7] text-[#1E5B3F]',
  saffron: 'bg-[#FCF0D6] text-[#7A4A00]',
  tomato: 'bg-[#FBE7E1] text-[#9A2F17]',
  neutral: 'bg-[#F3EEE4] text-[#3E4A43]',
}

export default function ConceptGrocery() {
  return (
    <div
      className={`${jakarta.variable} min-h-screen bg-[#FBF8F2] font-[family-name:var(--font-lp-jakarta)] text-[#1B2620] antialiased`}
      style={THEME}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-[#E8E2D6] bg-[#FBF8F2]/95 backdrop-blur">
        <div className="relative mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" className={`inline-flex items-center gap-2.5 rounded-md ${focus}`}>
            <PulseMark className="h-8 w-8 text-[#1E5B3F]" />
            <span className="text-[17px] font-bold tracking-tight">StockPulse</span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1 text-[14.5px] font-medium text-[#3E4A43]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`rounded-lg px-3.5 py-2 hover:bg-[#F1ECE1] hover:text-[#1B2620] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={LINKS.signin}
              className={`rounded-lg px-3.5 py-2 text-[14.5px] font-medium text-[#3E4A43] hover:text-[#1B2620] ${focus}`}
            >
              Sign in
            </Link>
            <Link href={LINKS.demo} className={`${btnPrimary} !rounded-lg !px-4 !py-2.5 !text-[14px]`}>
              Explore Demo Store
            </Link>
          </div>

          <MobileMenu
            hideAt="lg"
            links={NAV}
            cta={[
              { label: 'Explore Demo Store', href: LINKS.demo, className: `${btnPrimary} w-full` },
              { label: 'Get Started', href: LINKS.signup, className: `${btnSecondary} w-full` },
              {
                label: 'Sign in',
                href: LINKS.signin,
                className: `py-2 text-center text-[15px] font-medium text-[#3E4A43] ${focus}`,
              },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-xl border border-[#E8E2D6] bg-white text-[#1B2620] ${focus}`}
            panelClass="absolute inset-x-0 top-[68px] border-b border-[#E8E2D6] bg-[#FBF8F2] px-5 pb-6 pt-2 shadow-[0_20px_40px_-20px_rgba(27,38,32,0.2)]"
            linkClass={`block border-b border-[#EEE8DC] py-3.5 text-[16px] font-medium text-[#1B2620] ${focus}`}
          />
        </div>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:gap-12 lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#E4EFE7] px-3 py-1.5 text-[12.5px] font-semibold text-[#1E5B3F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E5B3F]" aria-hidden="true" />
              For kirana stores and independent grocers
            </p>
            {/* -0.02em, not tighter: Jakarta's comma and full stop keep their
                side-bearings, so heavier negative tracking pulled the letters
                together and left visible gaps before the punctuation. */}
            <h1 className="mt-6 text-[clamp(2.4rem,4vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.02em]">
              <Tuck>{HERO.headline[0]}</Tuck>
              <br />
              <span className="text-[#1E5B3F]"><Tuck>{HERO.headline[1]}</Tuck></span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#3E4A43] sm:text-[18px]">{HERO.sub}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={LINKS.demo} className={btnPrimary}>
                Explore Demo Store <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={LINKS.signup} className={btnSecondary}>
                Get Started
              </Link>
            </div>
            <p className="mt-4 text-[13.5px] font-medium text-[#56615A]">{HERO.reassurance}</p>

            {/* What the morning dashboard tells a shopkeeper, as chips. */}
            <ul className="mt-9 flex flex-wrap gap-2 text-[13px] font-semibold" aria-label="Things StockPulse surfaces">
              <li className={`rounded-full px-3 py-1.5 ${chip.saffron}`}>6 items below reorder level</li>
              <li className={`rounded-full px-3 py-1.5 ${chip.tomato}`}>1 lot expired</li>
              <li className={`rounded-full px-3 py-1.5 ${chip.leaf}`}>Delivery at dock</li>
              <li className={`rounded-full px-3 py-1.5 ${chip.neutral}`}>Works offline</li>
            </ul>
          </div>

          <div className="relative">
            <DashboardMock />
            {/* The app's real sale-logged toast, as the one floating element. */}
            <div
              aria-hidden="true"
              className="absolute -bottom-3 left-4 hidden items-center gap-3 rounded-xl border border-[#E8E2D6] bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(27,38,32,0.3)] sm:flex lg:-left-8"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E4EFE7] text-[#1E5B3F]">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-[13px]">
                <span className="block font-semibold">Sale logged</span>
                <span className="text-[#56615A]">3 line items · ₹412.00</span>
              </span>
            </div>
          </div>
        </section>

        {/* ─── Core operations ─── */}
        <section id="features" className="scroll-mt-20 border-t border-[#E8E2D6] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#1E5B3F]">Features</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,2.9rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance">
                <Tuck>One counter. Every job behind it.</Tuck>
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-[#3E4A43]">
                The six things a shop does every day, each on its own screen and all sharing the same numbers.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <OpsCard k="inventory" title="Inventory">
                <Row left="Fresh Curd 400g · lot 1" right={<Chip tone="saffron">exp 30 Sep</Chip>} sub="12 units" />
                <Row left="Fresh Curd 400g · lot 2" right={<Chip tone="leaf">exp 14 Oct</Chip>} sub="29 units" />
              </OpsCard>

              <OpsCard k="sales" title="Sales & POS">
                <Row left="Toned Milk 1L × 2" right="₹120.00" />
                <Row left="Basmati Rice 5kg × 1" right="₹245.00" />
                <div className="flex items-center justify-between border-t border-[#EEE8DC] pt-2 text-[13px] font-bold">
                  <span>Total · Cash</span>
                  <span className="tabular-nums">₹365.00</span>
                </div>
              </OpsCard>

              <OpsCard k="suppliers" title="Suppliers">
                <ol className="flex items-start justify-between gap-1 pt-1 text-[11.5px] font-semibold">
                  {['Ordered', 'Shipped', 'In transit', 'At dock'].map((s, i) => (
                    <li key={s} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                      <span
                        className={`h-3 w-3 rounded-full ${i < 3 ? 'bg-[#1E5B3F]' : 'border-2 border-[#BDB39F] bg-white'}`}
                      />
                      <span className={i < 3 ? 'text-[#1B2620]' : 'text-[#56615A]'}>{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="pt-2 text-[12.5px] text-[#56615A]">PO-0142 · Dairy supplier · due Monday</p>
              </OpsCard>

              <OpsCard k="staff" title="Staff">
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone="leaf">Owner</Chip>
                  <Chip tone="neutral">Manager</Chip>
                  <Chip tone="neutral">Staff</Chip>
                </div>
                <Row left="Morning shift" right="7:00 – 15:00" sub="2 on the floor" />
              </OpsCard>

              <OpsCard k="analytics" title="Analytics">
                <div className="flex h-16 items-end gap-1.5">
                  {[48, 40, 55, 46, 62, 88, 70].map((h, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-t ${i === 5 ? 'bg-[#1E5B3F]' : 'bg-[#CBE0D2]'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <Row left="Best day this week" right="Friday" />
              </OpsCard>

              <OpsCard k="offline" title="Offline mode">
                {/* The app's real banner and toast copy, before and after. */}
                <p className={`rounded-lg px-3 py-2 text-[12.5px] font-semibold ${chip.saffron}`}>
                  1 sale waiting to sync · ₹165.00
                </p>
                <p className={`rounded-lg px-3 py-2 text-[12.5px] font-semibold ${chip.leaf}`}>
                  Offline sales synced · 1 sent
                </p>
              </OpsCard>
            </div>

            {/* The other four, lighter weight. */}
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(['alerts', 'customers', 'scanning', 'assistant'] as const).map((k) => {
                const m = moduleByKey(k)
                const Icon = m.icon
                return (
                  <li key={k} className="rounded-2xl border border-[#E8E2D6] bg-[#FBF8F2] p-5">
                    <Icon className="h-5 w-5 text-[#1E5B3F]" aria-hidden="true" />
                    <h3 className="mt-3 text-[15.5px] font-bold tracking-tight">{m.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-[#3E4A43]">{m.detail}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-[#E8E2D6] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#1E5B3F]">How it works</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,2.9rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance">
                <Tuck>Open the shutter, open StockPulse.</Tuck>
              </h2>
            </div>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl border border-[#E8E2D6] bg-white p-7">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full bg-[#1E5B3F] text-[14px] font-bold text-white"
                    aria-hidden="true"
                  >
                    {Number(s.n)}
                  </span>
                  <h3 className="mt-5 text-[18px] font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#3E4A43]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Trust band ─── */}
        <section aria-labelledby="trust-h" className="bg-[#1E5B3F] py-20 text-[#F6F1E6] sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 id="trust-h" className="max-w-2xl text-[clamp(1.8rem,3.5vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-balance">
              <Tuck>Your numbers stay yours — and stay right.</Tuck>
            </h2>
            <dl className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map((t) => (
                <div key={t.title} className="border-t border-white/25 pt-5">
                  <dt className="text-[16px] font-bold">{t.title}</dt>
                  <dd className="mt-2 text-[14.5px] leading-relaxed text-[#D9E7DE]">{t.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Pricing — the only one on the page ─── */}
        <section id="pricing" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#1E5B3F]">Pricing</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,2.9rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance">
                <Tuck>Free while we’re in beta.</Tuck>
              </h2>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-[#3E4A43]">{PRICING.blurb}</p>
            </div>
            <div className="rounded-3xl border border-[#E8E2D6] bg-white p-7 shadow-[0_24px_50px_-30px_rgba(27,38,32,0.35)] sm:p-9">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-bold">{PRICING.plan}</p>
                <Chip tone="leaf">Everything included</Chip>
              </div>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-[56px] font-extrabold leading-none tracking-[-0.04em]">{PRICING.price}</span>
                <span className="text-[15px] font-medium text-[#56615A]">{PRICING.period}</span>
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {PRICING.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-[#3E4A43]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E5B3F]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={LINKS.signup} className={`${btnPrimary} mt-8 w-full`}>
                {PRICING.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="scroll-mt-20 border-t border-[#E8E2D6] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <p className="text-center text-[13px] font-bold uppercase tracking-[0.12em] text-[#1E5B3F]">FAQ</p>
            <h2 className="mt-3 text-center text-[clamp(2rem,4vw,2.9rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance">
              <Tuck>Questions shopkeepers ask.</Tuck>
            </h2>
            <div className="mt-12 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-[#E8E2D6] bg-[#FBF8F2] open:bg-white">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-6 rounded-2xl px-6 py-5 text-[16px] font-semibold [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    {f.q}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-[#56615A] transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-6 pb-6 text-[15px] leading-relaxed text-[#3E4A43]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl rounded-3xl border border-[#E8E2D6] bg-[#F3EEE4] px-6 py-14 text-center sm:px-12">
            <h2 className="text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance">
              <Tuck>Walk through a real store first.</Tuck>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16.5px] text-[#3E4A43]">
              The demo store has stock, lots, sales and suppliers already in it. No sign-up needed to look around.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={LINKS.demo} className={btnPrimary}>
                Explore Demo Store <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={LINKS.signup} className={btnSecondary}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E8E2D6] pb-24 pt-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <PulseMark className="h-7 w-7 text-[#1E5B3F]" />
            <span className="text-[16px] font-bold tracking-tight">StockPulse</span>
            <span className="ml-2 text-[13px] text-[#56615A]">© 2026</span>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium text-[#3E4A43]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`inline-block py-1 hover:text-[#1E5B3F] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href={LINKS.help} className={`inline-block py-1 hover:text-[#1E5B3F] ${focus}`}>Help</Link>
              </li>
              <li>
                <Link href={LINKS.privacy} className={`inline-block py-1 hover:text-[#1E5B3F] ${focus}`}>Privacy</Link>
              </li>
              <li>
                <Link href={LINKS.terms} className={`inline-block py-1 hover:text-[#1E5B3F] ${focus}`}>Terms</Link>
              </li>
              <li>
                <Link href={LINKS.signin} className={`inline-block py-1 hover:text-[#1E5B3F] ${focus}`}>Sign in</Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function OpsCard({ k, title, children }: { k: string; title: string; children: React.ReactNode }) {
  const m = moduleByKey(k)
  const Icon = m.icon
  return (
    <article className="flex flex-col rounded-2xl border border-[#E8E2D6] bg-[#FBF8F2] p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#1E5B3F] ring-1 ring-[#E8E2D6]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-[18px] font-bold tracking-tight">{title}</h3>
      </div>
      {/* flex-1 so the miniatures line up along the bottom of a row of cards. */}
      <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-[#3E4A43]">{m.detail}</p>
      {/* A miniature of the real screen. Decorative — the sentence above says it. */}
      <div aria-hidden="true" className="mt-5 space-y-2 rounded-xl border border-[#EEE8DC] bg-white p-4">
        {children}
      </div>
    </article>
  )
}

function Row({ left, right, sub }: { left: string; right: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="min-w-0">
        <span className="block truncate font-semibold">{left}</span>
        {sub && <span className="text-[12px] text-[#56615A]">{sub}</span>}
      </span>
      <span className="shrink-0 font-semibold tabular-nums">{right}</span>
    </div>
  )
}

/**
 * Pulls a heading's trailing comma or full stop back against its word.
 *
 * Measured in the browser: at 62px, Jakarta's comma has a 6px left
 * side-bearing against ~1px on the right of the "e" before it, so in a tightly
 * tracked display heading "store," reads as "store ,". -0.08em closes most of
 * that. Only the LAST character is touched; a mid-heading full stop is always
 * followed by a space, where the extra room is invisible.
 */
function Tuck({ children }: { children: string }) {
  const last = children.slice(-1)
  if (last !== '.' && last !== ',') return <>{children}</>
  return (
    <>
      {children.slice(0, -1)}
      <span className="ml-[-0.08em]">{last}</span>
    </>
  )
}

function Chip({ tone, children }: { tone: keyof typeof chip; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${chip[tone]}`}>{children}</span>
  )
}
