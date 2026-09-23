import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { archivo, fraunces } from './fonts'
import ProductShot, { type Palette } from './ProductShot'

/**
 * Three visual directions for the StockPulse landing page — HERO ONLY.
 *
 * Same product, same words, same links in all three: one wordmark, one
 * headline, one supporting line, the same two calls to action, and the same
 * real dashboard (./ProductShot). Only the design language changes — surface,
 * type, composition, card and button style — so a comparison is a comparison
 * of look, not of content.
 *
 * These are mockups of the first screen, not pages: no sections below the
 * fold, and nothing here is wired into the live landing page.
 */

/** Identical across the three — the point of the exercise. */
const COPY = {
  nav: [
    { label: 'Features', href: '#' },
    { label: 'How it works', href: '#' },
  ],
  headline: 'Run your grocery store from one screen.',
  sub: 'Stock, sales and expiry dates in one simple dashboard — and the till keeps working when the internet drops.',
  primary: { label: 'Get Started', href: '/signup' },
  secondary: { label: 'Try the demo', href: '/login?demo=1' },
  login: { label: 'Login', href: '/login' },
  note: 'Free while in beta · No card required',
}

const pageStyles = (bg: string) => `html, body { background: ${bg}; color-scheme: light; }`

/** The same mark in all three; each direction colours it. */
function Mark({ className = 'h-8 w-8', fill, stroke = '#fff' }: { className?: string; fill: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill={fill} />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ══════════════════ DIRECTION A — light minimal product ══════════════════ */

const A_PALETTE: Palette = {
  tint: '#FAFAFA',
  line: '#ECECEC',
  accent: '#111111',
  accentSoft: '#F1F1F1',
  radius: '18px',
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 24px 60px -32px rgba(0,0,0,0.28)',
}

export function DirectionA() {
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]'
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#111111] antialiased">
      <style dangerouslySetInnerHTML={{ __html: pageStyles('#FFFFFF') }} />

      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-10">
        <span className="inline-flex items-center gap-2.5">
          <Mark fill="#111111" />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-9 text-[14.5px] text-[#6B6B6B] md:flex">
          {COPY.nav.map((n) => (
            <a key={n.label} href={n.href} className={`py-1.5 hover:text-[#111111] ${focus}`}>
              {n.label}
            </a>
          ))}
          <Link href={COPY.login.href} className={`py-1.5 hover:text-[#111111] ${focus}`}>
            {COPY.login.label}
          </Link>
        </nav>
        <Link
          href={COPY.primary.href}
          className={`inline-flex h-10 items-center rounded-full bg-[#111111] px-5 text-[14px] font-medium text-white hover:bg-[#2B2B2B] ${focus}`}
        >
          {COPY.primary.label}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center sm:px-10 sm:pt-24">
        <h1 className="mx-auto max-w-3xl text-balance text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
          {COPY.headline}
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-balance text-[17px] leading-relaxed text-[#6B6B6B] sm:text-[19px]">{COPY.sub}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={COPY.primary.href}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-7 text-[15px] font-medium text-white hover:bg-[#2B2B2B] sm:w-auto ${focus}`}
          >
            {COPY.primary.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={COPY.secondary.href}
            className={`inline-flex h-12 w-full items-center justify-center rounded-full border border-[#E0E0E0] px-7 text-[15px] font-medium text-[#111111] hover:border-[#111111] sm:w-auto ${focus}`}
          >
            {COPY.secondary.label}
          </Link>
        </div>
        <p className="mt-5 text-[13px] text-[#8A8A8A]">{COPY.note}</p>

        <div className="mx-auto mt-20 max-w-5xl">
          <ProductShot palette={A_PALETTE} />
        </div>
      </main>
    </div>
  )
}

/* ══════════════════ DIRECTION B — bold modern SaaS ══════════════════ */

const B_PALETTE: Palette = {
  tint: '#F7F8F6',
  line: '#E4E7E2',
  accent: '#2F5D44',
  accentSoft: '#E4EDE7',
  radius: '14px',
  shadow: '0 30px 60px -30px rgba(17,24,20,0.45)',
}

export function DirectionB() {
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16231C]'
  return (
    <div className={`${archivo.variable} min-h-screen bg-white font-[family-name:var(--font-dp-archivo)] text-[#16231C] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles('#FFFFFF') }} />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5">
          <Mark fill="#2F5D44" />
          <span className="text-[18px] font-extrabold tracking-[-0.03em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-[14.5px] font-medium text-[#4A5A50] md:flex">
          {COPY.nav.map((n) => (
            <a key={n.label} href={n.href} className={`py-1.5 hover:text-[#16231C] ${focus}`}>
              {n.label}
            </a>
          ))}
          <Link href={COPY.login.href} className={`py-1.5 hover:text-[#16231C] ${focus}`}>
            {COPY.login.label}
          </Link>
          <Link
            href={COPY.primary.href}
            className={`inline-flex h-10 items-center rounded-lg bg-[#16231C] px-4 text-[14px] font-semibold text-white hover:bg-[#25382D] ${focus}`}
          >
            {COPY.primary.label}
          </Link>
        </nav>
      </header>

      {/* One colour block, cropped by the section — the direction's whole personality. */}
      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[#EEF3EF]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-[#2F5D44] px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white">
              For independent grocers
            </p>
            <h1 className="mt-6 text-balance text-[clamp(2.7rem,5.6vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.045em]">
              {COPY.headline}
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#4A5A50] sm:text-[18px]">{COPY.sub}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={COPY.primary.href}
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#16231C] px-7 py-3.5 text-[15.5px] font-semibold text-white hover:bg-[#25382D] ${focus}`}
              >
                {COPY.primary.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={COPY.secondary.href}
                className={`inline-flex items-center justify-center rounded-lg border-2 border-[#16231C] bg-transparent px-7 py-3 text-[15.5px] font-semibold text-[#16231C] transition-colors hover:bg-[#16231C] hover:text-white ${focus}`}
              >
                {COPY.secondary.label}
              </Link>
            </div>
            <p className="mt-5 text-[13.5px] font-medium text-[#4A5A50]">{COPY.note}</p>
          </div>

          <div className="lg:-mr-24">
            <ProductShot palette={B_PALETTE} sidebar={false} />
          </div>
        </div>
      </main>
    </div>
  )
}

/* ══════════════════ DIRECTION C — premium editorial ══════════════════ */

const C_PALETTE: Palette = {
  tint: '#FBF9F5',
  line: '#E7E0D6',
  accent: '#7A5C34',
  accentSoft: '#F1E9DC',
  radius: '6px',
  shadow: '0 30px 70px -40px rgba(26,23,20,0.45)',
}

export function DirectionC() {
  const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1714]'
  const serif = 'font-[family-name:var(--font-dp-fraunces)]'
  return (
    <div className={`${fraunces.variable} min-h-screen bg-[#F6F2EB] font-[family-name:var(--font-inter)] text-[#1A1714] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles('#F6F2EB') }} />

      <header className="mx-auto flex h-20 max-w-[1400px] items-center justify-between border-b border-[#E2DAD0] px-6 sm:px-12">
        <span className="inline-flex items-center gap-3">
          <Mark fill="#1A1714" className="h-7 w-7" />
          <span className={`${serif} text-[19px] tracking-[-0.01em]`}>StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.14em] text-[#6B6257] md:flex">
          {COPY.nav.map((n) => (
            <a key={n.label} href={n.href} className={`py-1.5 hover:text-[#1A1714] ${focus}`}>
              {n.label}
            </a>
          ))}
          <Link href={COPY.login.href} className={`py-1.5 hover:text-[#1A1714] ${focus}`}>
            {COPY.login.label}
          </Link>
        </nav>
        <Link
          href={COPY.primary.href}
          className={`inline-flex h-10 items-center rounded-full border border-[#1A1714] px-5 text-[13px] uppercase tracking-[0.12em] transition-colors hover:bg-[#1A1714] hover:text-[#F6F2EB] ${focus}`}
        >
          {COPY.primary.label}
        </Link>
      </header>

      {/* Asymmetric: the headline runs across eight columns, the supporting
          line sits in the remaining four behind a hairline rule, and the
          product breaks the right margin. */}
      <main className="mx-auto max-w-[1400px] px-6 pb-24 pt-16 sm:px-12 sm:pt-20">
        <p className="text-[12px] uppercase tracking-[0.2em] text-[#8A7B69]">Store management for independent grocers</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
          <h1 className={`${serif} text-balance text-[clamp(2.9rem,7vw,5.6rem)] font-normal leading-[0.96] tracking-[-0.02em] lg:col-span-8`}>
            Run your grocery store <em className="italic text-[#7A5C34]">from one screen.</em>
          </h1>
          <div className="lg:col-span-4 lg:border-l lg:border-[#E2DAD0] lg:pb-2 lg:pl-8">
            <p className="text-[16.5px] leading-relaxed text-[#5B5248]">{COPY.sub}</p>
            <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href={COPY.primary.href}
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1A1714] px-7 text-[15px] font-medium text-[#F6F2EB] hover:bg-[#2E2924] sm:w-auto ${focus}`}
              >
                {COPY.primary.label}
              </Link>
              <Link
                href={COPY.secondary.href}
                className={`py-2 text-[15px] font-medium underline decoration-[#C9BBA6] underline-offset-[6px] hover:decoration-[#1A1714] ${focus}`}
              >
                {COPY.secondary.label}
              </Link>
            </div>
            <p className="mt-5 text-[12.5px] uppercase tracking-[0.12em] text-[#8A7B69]">{COPY.note}</p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-12 lg:items-start">
          <p className={`${serif} order-2 text-[17px] italic leading-relaxed text-[#6B6257] lg:order-1 lg:col-span-3 lg:pt-8`}>
            The demo store, exactly as it stands today.
          </p>
          <div className="order-1 lg:order-2 lg:col-span-9 lg:-mr-12">
            <ProductShot palette={C_PALETTE} />
          </div>
        </div>
      </main>
    </div>
  )
}
