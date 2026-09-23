import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { archivo } from './fonts'
import ProductShot, { type Palette } from './ProductShot'

/**
 * Direction B, re-coloured — blue / purple / white.
 *
 * This is NOT a fourth direction. It is Direction B (components/design-preview
 * /Directions.tsx#DirectionB) with one thing changed: the colour system. The
 * layout, the Archivo face and its weights, the two-column hero, the cropped
 * colour block, the eyebrow pill, the button placement and the product window
 * beside the words are copied verbatim, so a side-by-side with /design-preview/b
 * shows a palette swap and nothing else.
 *
 * It is a copy rather than a `palette` prop added to DirectionB because the
 * brief was "leave the existing previews untouched" — B must keep rendering
 * green with no edit to its file at all.
 *
 * Green's three roles map one-to-one onto the new system:
 *   #16231C dark green ink   -> #0E1533  deep navy  (headline, outline button)
 *   #2F5D44 mid green accent -> #2563EB  the one blue (mark, buttons, product)
 *   #EEF3EF pale green wash  -> #F2F5FD  cool near-white block behind the hero
 * Purple (#5B45D6 on #EDEAFD) appears in exactly ONE place, the eyebrow pill.
 * Used anywhere else it stops being a secondary accent. Note the pill also
 * changed from solid-fill to soft-fill: a solid purple block that size reads as
 * a second primary. Its size, position and type are otherwise B's.
 *
 * Every colour is written as a literal Tailwind arbitrary value or an inline
 * style — never interpolated into a class string, which Tailwind's scanner
 * cannot see and would silently drop.
 */

const B_BLUE_PALETTE: Palette = {
  tint: '#F7F9FD',
  line: '#E5E9F2',
  accent: '#2563EB',
  accentSoft: '#E6EDFD',
  radius: '14px',
  shadow: '0 30px 60px -30px rgba(14,21,51,0.38)',
}

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

function Mark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#2563EB" />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DirectionBBlue() {
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'
  return (
    <div
      className={`${archivo.variable} min-h-screen bg-white font-[family-name:var(--font-dp-archivo)] text-[#0E1533] antialiased`}
      /* globals.css carries an UNLAYERED `* { border-color: var(--border) }`,
         and unlayered CSS beats Tailwind v4's @layer utilities whatever the
         specificity — so every `border-[#hex]` class in this subtree is
         silently overridden by the app's warm tan token. (Direction B has the
         same tan outline button for exactly this reason; measured, not
         guessed.) Re-pointing the token here fixes every border in the preview
         at once, scoped to this tree, with no edit to the shared stylesheet. */
      style={{ ['--border' as string]: '#E5E9F2' } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: 'html, body { background: #FFFFFF; color-scheme: light; }' }} />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5">
          <Mark />
          <span className="text-[18px] font-extrabold tracking-[-0.03em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-[14.5px] font-medium text-[#4D5675] md:flex">
          {COPY.nav.map((n) => (
            <a key={n.label} href={n.href} className={`py-1.5 transition-colors hover:text-[#0E1533] ${focus}`}>
              {n.label}
            </a>
          ))}
          <Link href={COPY.login.href} className={`py-1.5 transition-colors hover:text-[#0E1533] ${focus}`}>
            {COPY.login.label}
          </Link>
          <Link
            href={COPY.primary.href}
            className={`inline-flex h-10 items-center rounded-lg bg-[#2563EB] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] ${focus}`}
          >
            {COPY.primary.label}
          </Link>
        </nav>
      </header>

      {/* One colour block, cropped by the section — Direction B's whole
          personality, now a cool near-white instead of the pale green. */}
      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[#F2F5FD]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div>
            {/* The one place purple appears. */}
            <p className="inline-flex items-center gap-2 rounded-md bg-[#EDEAFD] px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#5B45D6]">
              For independent grocers
            </p>
            <h1 className="mt-6 text-balance text-[clamp(2.7rem,5.6vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.045em]">
              {COPY.headline}
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#4D5675] sm:text-[18px]">{COPY.sub}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={COPY.primary.href}
                className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-7 py-3.5 text-[15.5px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] ${focus}`}
              >
                {COPY.primary.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={COPY.secondary.href}
                className={`inline-flex items-center justify-center rounded-lg border-2 bg-transparent px-7 py-3 text-[15.5px] font-semibold text-[#0E1533] transition-colors hover:bg-[#0E1533] hover:text-white ${focus}`}
                /* Inline, not `border-[#0E1533]`: this one border must be the
                   navy ink rather than the hairline token set on the root. */
                style={{ borderColor: '#0E1533' }}
              >
                {COPY.secondary.label}
              </Link>
            </div>
            <p className="mt-5 text-[13.5px] font-medium text-[#4D5675]">{COPY.note}</p>
          </div>

          <div className="lg:-mr-24">
            <ProductShot palette={B_BLUE_PALETTE} sidebar={false} />
          </div>
        </div>
      </main>
    </div>
  )
}
