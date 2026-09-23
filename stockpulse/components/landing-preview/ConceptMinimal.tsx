import Link from 'next/link'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { instrumentSerif } from './fonts'
import { FAQ, HERO, LINKS, MODULES, NAV, PRICING, STEPS, TRUST } from './content'
import DashboardMock from './DashboardMock'
import MobileMenu from './MobileMenu'
import PulseMark from './PulseMark'

/**
 * CONCEPT 1 — Premium Minimal SaaS.
 *
 * One idea carries the whole page: restraint. Off-white paper, near-black ink,
 * hairline rules instead of cards wherever a rule will do, and a single
 * editorial serif used for headlines only. There is no accent colour at all
 * outside the product preview — the primary button is ink — so the dashboard
 * mock is the most colourful thing on the page, which is the point.
 *
 * Contrast (measured against #FAF9F6): ink #16181D 17.4:1, body #3D414A
 * 10.0:1, muted #5C616B 6.1:1. Nothing lighter carries text.
 */

const PAGE_STYLES = `
html, body { background: #FAF9F6; color-scheme: light; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`

const THEME = {
  '--border': '#E6E4DE',
  '--dm-bg': '#FFFFFF',
  '--dm-canvas': '#FCFCFA',
  '--dm-surface': '#FFFFFF',
  '--dm-border': '#ECEAE4',
  '--dm-dot': '#E2E0DA',
  '--dm-ink': '#16181D',
  '--dm-muted': '#5C616B',
  '--dm-accent': '#16181D',
  '--dm-accent-ink': '#FFFFFF',
  '--dm-accent-soft': '#F0EFEA',
  '--dm-bar': '#DEDCD5',
  '--dm-warn': '#8F5500',
  '--dm-warn-soft': '#FBF1DE',
  '--dm-danger': '#B42318',
  '--dm-up': '#1D6B45',
  '--dm-radius': '16px',
  '--dm-shadow': '0 1px 2px rgba(22,24,29,0.04), 0 40px 80px -40px rgba(22,24,29,0.28)',
} as React.CSSProperties

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16181D]'
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-full bg-[#16181D] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#2B2E36] ${focus}`
const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-full border border-[#D9D6CE] bg-white px-6 py-3 text-[15px] font-medium text-[#16181D] transition-colors hover:border-[#16181D] ${focus}`
const serif = 'font-[family-name:var(--font-lp-serif)] font-normal'

export default function ConceptMinimal() {
  return (
    <div
      className={`${instrumentSerif.variable} min-h-screen bg-[#FAF9F6] font-[family-name:var(--font-inter)] text-[#16181D] antialiased`}
      style={THEME}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-[#E6E4DE]/80 bg-[#FAF9F6]/90 backdrop-blur">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" className={`inline-flex items-center gap-2.5 rounded-md ${focus}`}>
            <PulseMark className="h-7 w-7 text-[#16181D]" />
            <span className="text-[16px] font-semibold tracking-tight">StockPulse</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8 text-[14px] text-[#3D414A]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`rounded-sm hover:text-[#16181D] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link href={LINKS.signin} className={`rounded-sm text-[14px] text-[#3D414A] hover:text-[#16181D] ${focus}`}>
              Sign in
            </Link>
            <Link href={LINKS.demo} className={`${btnPrimary} !px-4 !py-2 !text-[14px]`}>
              Explore Demo Store
            </Link>
          </div>

          <MobileMenu
            links={NAV}
            cta={[
              { label: 'Explore Demo Store', href: LINKS.demo, className: `${btnPrimary} w-full` },
              { label: 'Get Started', href: LINKS.signup, className: `${btnSecondary} w-full` },
              { label: 'Sign in', href: LINKS.signin, className: `py-2 text-center text-[15px] text-[#3D414A] ${focus}` },
            ]}
            buttonClass={`grid h-11 w-11 place-items-center rounded-full text-[#16181D] hover:bg-[#EFEDE7] ${focus}`}
            panelClass="absolute inset-x-0 top-16 border-b border-[#E6E4DE] bg-[#FAF9F6] px-5 pb-6 pt-2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)]"
            linkClass={`block border-b border-[#ECEAE4] py-3.5 text-[16px] text-[#16181D] ${focus}`}
          />
        </div>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#E6E4DE] bg-white px-3.5 py-1.5 text-[12.5px] text-[#3D414A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1D6B45]" aria-hidden="true" />
            Store management for independent grocers
          </p>

          <h1 className={`${serif} mx-auto mt-7 max-w-[16ch] text-[clamp(2.9rem,8vw,5.6rem)] leading-[0.98] tracking-[-0.02em]`}>
            {HERO.headline[0]}
            <br />
            <em className="italic text-[#3D414A]">{HERO.headline[1]}</em>
          </h1>

          <p className="mx-auto mt-7 max-w-[34rem] text-[17px] leading-relaxed text-[#3D414A] sm:text-[18px]">
            {HERO.sub}
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href={LINKS.demo} className={btnPrimary}>
              Explore Demo Store <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href={LINKS.signup} className={btnSecondary}>
              Get Started
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-[#5C616B]">{HERO.reassurance} · The demo needs no sign-up</p>

          <DashboardMock className="mx-auto mt-16 max-w-5xl text-left sm:mt-20" />
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="scroll-mt-20 border-t border-[#E6E4DE] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              eyebrow="Features"
              title="Everything the shop runs on."
              body="Ten parts of one system, sharing one set of numbers — so the stock count, the till and the reorder list never disagree."
            />
            <ul className="mt-14 grid gap-x-12 sm:grid-cols-2">
              {MODULES.map(({ key, title, detail, icon: Icon }) => (
                <li key={key} className="flex gap-4 border-t border-[#E6E4DE] py-7">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#16181D]" strokeWidth={1.75} aria-hidden="true" />
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#3D414A]">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-[#E6E4DE] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              eyebrow="How it works"
              title="Set up in an evening."
              body="No hardware to install and nothing to integrate before the first sale."
            />
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <p className={`${serif} text-[44px] leading-none text-[#8C887C]`} aria-hidden="true">
                    {s.n}
                  </p>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#3D414A]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Reliability & trust ─── */}
        <section aria-labelledby="trust-h" className="border-t border-[#E6E4DE] py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#5C616B]">Built for the counter</p>
              <h2 id="trust-h" className={`${serif} mt-4 text-[clamp(2.1rem,4.5vw,3.1rem)] leading-[1.05] tracking-[-0.015em] text-balance`}>
                The till keeps going when the Wi-Fi doesn’t.
              </h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[#3D414A]">
                Sales made offline are saved on the device and sync the moment the connection returns. Each one lands
                exactly once — and if stock ran short in the meantime, the shortfall is recorded instead of hidden.
              </p>
              {/* The app's real pending-sync banner copy. */}
              <p className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#EBD9B3] bg-[#FBF3E3] px-4 py-2 text-[13.5px] font-medium text-[#6E4300]">
                <span className="h-2 w-2 rounded-full bg-[#B7791F]" aria-hidden="true" />1 sale waiting to sync · ₹165.00
              </p>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {TRUST.map((t) => (
                <div key={t.title} className="border-t border-[#E6E4DE] py-6">
                  <dt className="text-[15px] font-semibold tracking-tight">{t.title}</dt>
                  <dd className="mt-1.5 text-[14.5px] leading-relaxed text-[#3D414A]">{t.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Pricing — the only one on the page ─── */}
        <section id="pricing" className="scroll-mt-20 border-t border-[#E6E4DE] bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead eyebrow="Pricing" title="Free while we’re in beta." body={PRICING.blurb} />
            <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-[#E6E4DE] bg-[#FAF9F6] p-7 sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#5C616B]">{PRICING.plan}</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className={`${serif} text-[64px] leading-none tracking-tight`}>{PRICING.price}</span>
                    <span className="text-[15px] text-[#5C616B]">{PRICING.period}</span>
                  </p>
                </div>
                <Link href={LINKS.signup} className={btnPrimary}>
                  {PRICING.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <ul className="mt-8 grid gap-x-8 gap-y-3 border-t border-[#E6E4DE] pt-8 sm:grid-cols-2">
                {PRICING.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-[#3D414A]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D6B45]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="scroll-mt-20 border-t border-[#E6E4DE] py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHead
              eyebrow="FAQ"
              title="Straight answers."
              body="Including the ones about what StockPulse doesn’t do yet."
              align="left"
            />
            <div className="border-b border-[#E6E4DE]">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-t border-[#E6E4DE]">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16px] font-medium [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    {f.q}
                    <Plus className="h-4 w-4 shrink-0 text-[#5C616B] transition-transform group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className="-mt-1 pb-6 pr-10 text-[15px] leading-relaxed text-[#3D414A]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="border-t border-[#E6E4DE] bg-white py-24 text-center sm:py-32">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className={`${serif} text-[clamp(2.4rem,6vw,4rem)] leading-[1.02] tracking-[-0.02em] text-balance`}>
              See your store <em className="italic text-[#3D414A]">in one place.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] text-[#3D414A]">
              Open the demo store — real screens, sample stock, nothing to set up.
            </p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
      <footer className="border-t border-[#E6E4DE] pb-24 pt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <PulseMark className="h-6 w-6 text-[#16181D]" />
            <span className="text-[15px] font-semibold tracking-tight">StockPulse</span>
            <span className="ml-2 text-[13px] text-[#5C616B]">© 2026</span>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#3D414A]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`inline-block py-1 hover:text-[#16181D] ${focus}`}>
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href={LINKS.help} className={`inline-block py-1 hover:text-[#16181D] ${focus}`}>Help</Link>
              </li>
              <li>
                <Link href={LINKS.privacy} className={`inline-block py-1 hover:text-[#16181D] ${focus}`}>Privacy</Link>
              </li>
              <li>
                <Link href={LINKS.terms} className={`inline-block py-1 hover:text-[#16181D] ${focus}`}>Terms</Link>
              </li>
              <li>
                <Link href={LINKS.signin} className={`inline-block py-1 hover:text-[#16181D] ${focus}`}>Sign in</Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function SectionHead({
  eyebrow,
  title,
  body,
  align = 'center',
}: {
  eyebrow: string
  title: string
  body: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-md'}>
      <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#5C616B]">{eyebrow}</p>
      <h2 className={`${serif} mt-4 text-[clamp(2.1rem,4.5vw,3.1rem)] leading-[1.05] tracking-[-0.015em] text-balance`}>{title}</h2>
      <p className="mt-4 text-[16px] leading-relaxed text-[#3D414A]">{body}</p>
    </div>
  )
}
