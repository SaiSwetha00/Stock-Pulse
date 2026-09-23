import Link from 'next/link'
import { ArrowRight, Check, CloudOff, Fingerprint, History, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { geist, geistMono } from './fonts'
import { FAQ, HERO, LINKS, NAV, PRICING, STEPS, TRUST, moduleByKey } from './content'
import DashboardMock from './DashboardMock'
import MobileMenu from './MobileMenu'
import PulseMark from './PulseMark'

/**
 * CONCEPT 3 — High-End B2B SaaS.
 *
 * Built for the person evaluating the product rather than the one running a
 * till today: a recruiter, a client, an investor. So the hierarchy is explicit
 * — ten modules grouped into three pillars (Operate / Control / Understand) —
 * and the trust material is mechanisms, stated precisely, with the offline
 * sync shown as the three-step sequence the production QA actually verified.
 *
 * The only dark surfaces are the hero and the closing band; the product sits
 * across the seam between them and the white page, which is the one piece of
 * "staging" on the page. No motion beyond hover colour changes.
 *
 * Contrast: on #0A0D14, white 19.6:1 and #A7AFC0 8.6:1. On white, ink #0B0F19
 * 19.4:1, body #3A4150 10.4:1, muted #5A6272 6.2:1. White on #3B4BF0 6.7:1.
 */

const PAGE_STYLES = `
html, body { background: #FFFFFF; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const THEME = {
  '--border': '#E4E7EC',
  '--dm-bg': '#FFFFFF',
  '--dm-canvas': '#FAFBFC',
  '--dm-side': '#FAFBFC',
  '--dm-surface': '#FFFFFF',
  '--dm-border': '#E6E8EE',
  '--dm-dot': '#D9DCE4',
  '--dm-ink': '#0B0F19',
  '--dm-muted': '#5A6272',
  '--dm-caption': '#5A6272',
  '--dm-accent': '#3B4BF0',
  '--dm-accent-ink': '#FFFFFF',
  '--dm-accent-soft': '#EEF0FF',
  '--dm-accent-strong': '#2B38C2',
  '--dm-bar': '#D6DAFA',
  '--dm-warn': '#8A5200',
  '--dm-warn-soft': '#FDF2DC',
  '--dm-danger': '#B42318',
  '--dm-up': '#117A4A',
  '--dm-radius': '14px',
  '--dm-shadow': '0 0 0 1px rgba(11,15,25,0.04), 0 60px 120px -50px rgba(10,13,20,0.6)',
} as React.CSSProperties

const focusDark =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B4BF0]'
const mono = 'font-[family-name:var(--font-lp-geist-mono)]'

const btnAccent =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#3B4BF0] px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#2F3DD6]'
const btnGhostDark = `inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-[15px] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5 ${focusDark}`

const PILLARS = [
  { n: '01', name: 'Operate', line: 'The daily work of the shop floor.', keys: ['inventory', 'sales', 'scanning', 'offline'] },
  { n: '02', name: 'Control', line: 'Who can do what, and what needs doing.', keys: ['alerts', 'suppliers', 'staff'] },
  { n: '03', name: 'Understand', line: 'How the store is really doing.', keys: ['analytics', 'customers', 'assistant'] },
] as const

const TRUST_ICONS = [ShieldCheck, Users, History, Fingerprint]

/** The three states of an offline sale, each with the app's real on-screen copy. */
const SYNC = [
  {
    icon: CloudOff,
    state: 'Offline',
    title: 'Sale saved on the device',
    body: 'The cashier completes the sale as normal. It is written to the device and read back before success is shown.',
    ui: '1 sale waiting to sync · ₹165.00',
  },
  {
    icon: RefreshCw,
    state: 'Reconnect',
    title: 'Sent once, never twice',
    body: 'Each sale carries its own ID, so a retry or a second tap can never record it a second time.',
    ui: 'Offline sales synced · 1 sent',
  },
  {
    icon: ShieldCheck,
    state: 'Reconciled',
    title: 'Stock stays honest',
    body: 'Lots are drawn earliest-expiry first. If the shelf ran short meanwhile, stock stops at zero and the gap is logged.',
    ui: 'Stock did not add up on 1 item',
  },
]

export default function ConceptEnterprise() {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} min-h-screen bg-white font-[family-name:var(--font-lp-geist)] text-[#0B0F19] antialiased`}
      style={THEME}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0D14]/95 text-white backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" className={`inline-flex items-center gap-2.5 rounded-md ${focusDark}`}>
            <PulseMark className="h-7 w-7 text-[#3B4BF0]" />
            <span className="text-[16px] font-semibold tracking-tight">StockPulse</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-7 text-[14px] text-[#C3C9D6]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`rounded-sm hover:text-white ${focusDark}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href={LINKS.signin} className={`rounded-sm text-[14px] text-[#C3C9D6] hover:text-white ${focusDark}`}>
              Sign in
            </Link>
            <Link
              href={LINKS.demo}
              className={`inline-flex items-center rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-[#0B0F19] hover:bg-[#E9ECF2] ${focusDark}`}
            >
              Explore Demo Store
            </Link>
          </div>

          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Explore Demo Store', href: LINKS.demo, className: `${btnAccent} ${focusDark} w-full` },
              { label: 'Get Started', href: LINKS.signup, className: `${btnGhostDark} w-full` },
              { label: 'Sign in', href: LINKS.signin, className: `py-2 text-center text-[15px] text-[#C3C9D6] ${focusDark}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-lg border border-white/15 text-white ${focusDark}`}
            panelClass="absolute inset-x-0 top-16 border-b border-white/10 bg-[#0A0D14] px-5 pb-6 pt-2"
            linkClass={`block border-b border-white/10 py-3.5 text-[16px] text-white ${focusDark}`}
          />
        </div>
      </header>

      <main id="top">
        {/* ─── Hero (dark) ─── */}
        <section className="relative overflow-hidden bg-[#0A0D14] pb-40 pt-20 text-white sm:pb-64 sm:pt-28">
          {/* A faint 64px grid — the page's only background texture. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          />
          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <p
              className={`${mono} inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11.5px] uppercase tracking-[0.14em] text-[#C3C9D6]`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" aria-hidden="true" />
              For independent grocers · Beta
            </p>
            <h1 className="mt-8 text-[clamp(2.7rem,7vw,5rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              {HERO.headline[0]}
              <br />
              <span className="text-[#A7AFC0]">{HERO.headline[1]}</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-[#C3C9D6] sm:text-[19px]">{HERO.sub}</p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href={LINKS.demo} className={`${btnAccent} ${focusDark}`}>
                Explore Demo Store <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={LINKS.signup} className={btnGhostDark}>
                Get Started
              </Link>
            </div>
            <p className={`${mono} mt-6 text-[12px] uppercase tracking-[0.12em] text-[#A7AFC0]`}>{HERO.reassurance}</p>
          </div>
        </section>

        {/* ─── Product, straddling the seam ─── */}
        <div className="relative mx-auto -mt-28 max-w-6xl px-4 sm:-mt-48 sm:px-8">
          <DashboardMock variant="full" />
        </div>

        {/* ─── Trust strip ─── */}
        <section aria-label="Security and reliability" className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-4 border-y border-[#E4E7EC] py-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <li key={t.title} className="flex items-center gap-2.5 text-[14px] font-medium text-[#3A4150]">
                  <Icon className="h-4 w-4 shrink-0 text-[#3B4BF0]" aria-hidden="true" />
                  {t.title}
                </li>
              )
            })}
          </ul>
        </section>

        {/* ─── Features: three pillars ─── */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>Platform</p>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                One system for the whole shop.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-[#3A4150]">
                Ten modules on one database. A sale updates stock, stock drives alerts, alerts drive orders — without an
                export in between.
              </p>
            </div>

            <div className="mt-16 divide-y divide-[#E4E7EC] border-y border-[#E4E7EC]">
              {PILLARS.map((p) => (
                <div key={p.n} className="grid gap-8 py-12 lg:grid-cols-[0.75fr_2fr] lg:gap-14">
                  <div>
                    <p className={`${mono} text-[12px] text-[#5A6272]`}>{p.n}</p>
                    <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">{p.name}</h3>
                    <p className="mt-2 text-[15px] text-[#3A4150]">{p.line}</p>
                  </div>
                  <ul className={`grid gap-4 sm:grid-cols-2 ${p.keys.length === 3 ? 'xl:grid-cols-3' : ''}`}>
                    {p.keys.map((k) => {
                      const m = moduleByKey(k)
                      const Icon = m.icon
                      return (
                        <li
                          key={k}
                          className="rounded-xl border border-[#E4E7EC] bg-white p-5 transition-colors hover:border-[#C9CEDA]"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EEF0FF] text-[#2B38C2]">
                            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                          </span>
                          <h4 className="mt-4 text-[15.5px] font-semibold tracking-tight">{m.title}</h4>
                          <p className="mt-1.5 text-[14px] leading-relaxed text-[#3A4150]">{m.detail}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Spotlight: offline sync ─── */}
        <section aria-labelledby="sync-h" className="border-y border-[#E4E7EC] bg-[#F7F8FA] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>Resilience</p>
              <h2 id="sync-h" className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                Built for the day the internet drops.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-[#3A4150]">
                Offline sales, reconnection and stock reconciliation — each step with the message the cashier actually sees.
              </p>
            </div>
            <ol className="mt-14 grid gap-5 lg:grid-cols-3">
              {SYNC.map((s, i) => {
                const Icon = s.icon
                return (
                  <li key={s.state} className="flex flex-col rounded-xl border border-[#E4E7EC] bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0B0F19] text-white">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className={`${mono} text-[11.5px] uppercase tracking-[0.12em] text-[#5A6272]`}>
                        Step {i + 1} · {s.state}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-[#3A4150]">{s.body}</p>
                    <p
                      className={`${mono} mt-5 rounded-md border border-[#E4E7EC] bg-[#FAFBFC] px-3 py-2 text-[12px] text-[#0B0F19]`}
                    >
                      <span className="sr-only">On screen: </span>
                      {s.ui}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>How it works</p>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                Live the same day.
              </h2>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t-2 border-[#0B0F19] pt-6">
                  <p className={`${mono} text-[13px] text-[#5A6272]`}>{s.n}</p>
                  <h3 className="mt-3 text-[19px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#3A4150]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Security ─── */}
        <section aria-labelledby="sec-h" className="border-t border-[#E4E7EC] bg-[#F7F8FA] py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>Security</p>
              <h2 id="sec-h" className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                Enforced in the database, not just hidden in the UI.
              </h2>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {TRUST.map((t, i) => {
                const Icon = TRUST_ICONS[i]
                return (
                  <div key={t.title} className="rounded-xl border border-[#E4E7EC] bg-white p-6">
                    <Icon className="h-5 w-5 text-[#3B4BF0]" aria-hidden="true" />
                    <dt className="mt-4 text-[16px] font-semibold tracking-tight">{t.title}</dt>
                    <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[#3A4150]">{t.body}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </section>

        {/* ─── Pricing — the only one on the page ─── */}
        <section id="pricing" className="scroll-mt-20 border-t border-[#E4E7EC] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>Pricing</p>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                One plan. Everything in it.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-[#3A4150]">{PRICING.blurb}</p>
            </div>
            <div className="mx-auto mt-14 grid max-w-4xl overflow-hidden rounded-2xl border border-[#E4E7EC] md:grid-cols-[1fr_1.3fr]">
              <div className="bg-[#0A0D14] p-8 text-white sm:p-10">
                <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#A7AFC0]`}>{PRICING.plan}</p>
                <p className="mt-5 text-[64px] font-semibold leading-none tracking-[-0.05em]">{PRICING.price}</p>
                <p className="mt-2 text-[15px] text-[#C3C9D6]">{PRICING.period}</p>
                <Link href={LINKS.signup} className={`${btnAccent} ${focusDark} mt-10 w-full`}>
                  {PRICING.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={LINKS.demo}
                  className={`mt-2 block rounded-sm py-2 text-center text-[14px] text-[#C3C9D6] underline-offset-4 hover:text-white hover:underline ${focusDark}`}
                >
                  or explore the demo store first
                </Link>
              </div>
              <ul className="grid content-center gap-3.5 bg-white p-8 sm:p-10">
                {PRICING.includes.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-[#3A4150]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3B4BF0]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── FAQ — open, for scanning ─── */}
        <section id="faq" className="scroll-mt-20 border-t border-[#E4E7EC] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className={`${mono} text-[12px] uppercase tracking-[0.14em] text-[#3B4BF0]`}>FAQ</p>
              <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-balance">
                Common questions.
              </h2>
            </div>
            <dl className="mt-14 grid gap-x-14 gap-y-10 md:grid-cols-2">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="text-[17px] font-semibold tracking-tight">{f.q}</dt>
                  <dd className="mt-2.5 text-[15px] leading-relaxed text-[#3A4150]">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Closing CTA (dark) ─── */}
        <section className="bg-[#0A0D14] py-24 text-white sm:py-28">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-balance">
              See the product, not a pitch.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] text-[#C3C9D6]">
              The demo store is the real application with sample data in it. Open it in one click.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href={LINKS.demo} className={`${btnAccent} ${focusDark}`}>
                Explore Demo Store <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={LINKS.signup} className={btnGhostDark}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E4E7EC] pb-24 pt-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <PulseMark className="h-7 w-7 text-[#3B4BF0]" />
              <span className="text-[16px] font-semibold tracking-tight">StockPulse</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#5A6272]">Store management for independent grocers.</p>
            <p className={`${mono} mt-6 text-[12px] text-[#5A6272]`}>© 2026 StockPulse</p>
          </div>
          <FooterCol title="Product" items={NAV.map((n) => ({ label: n.label, href: n.href, anchor: true }))} />
          <FooterCol
            title="Get started"
            items={[
              { label: 'Explore demo store', href: LINKS.demo },
              { label: 'Create an account', href: LINKS.signup },
              { label: 'Sign in', href: LINKS.signin },
            ]}
          />
          <FooterCol
            title="Support"
            items={[
              { label: 'Help centre', href: LINKS.help },
              { label: 'Privacy', href: LINKS.privacy },
              { label: 'Terms', href: LINKS.terms },
            ]}
          />
        </div>
      </footer>
    </div>
  )
}

function FooterCol({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; href: string; anchor?: boolean }>
}) {
  return (
    <nav aria-label={title}>
      <p className="text-[13px] font-semibold text-[#0B0F19]">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[14px] text-[#3A4150]">
        {items.map((i) => (
          <li key={i.href}>
            {i.anchor ? (
              <a href={i.href} className={`inline-block py-1 hover:text-[#0B0F19] ${focus}`}>
                {i.label}
              </a>
            ) : (
              <Link href={i.href} className={`inline-block py-1 hover:text-[#0B0F19] ${focus}`}>
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
