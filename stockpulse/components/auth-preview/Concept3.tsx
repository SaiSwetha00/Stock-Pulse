'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarClock, PackageSearch, WifiOff } from 'lucide-react'
import ProductShot, { type Palette } from '@/components/design-preview/ProductShot'
import { TOTALS } from '@/components/landing/snapshot'
import { authSans } from '@/components/auth/fonts'
import {
  DEMO,
  InertNote,
  PrimaryButton,
  QuietButton,
  ScreenFields,
  ScreenTabs,
  TextLink,
  Wordmark,
  screenHead,
  submitLabel,
  type ScreenKey,
} from './kit'

/**
 * CONCEPT 3 — Product-first / immersive, refined.
 *
 * The real dashboard fills the left of the screen as the environment you are
 * signing into; the form sits on the right as a solid, elevated panel.
 *
 * WHAT THE REFINEMENT CHANGED, and why each one was a real fault:
 *
 *   ALIGNMENT. Everything now hangs off ONE 1400px container with one padding
 *   scale, as a three-row grid (header / content / footer) with a 12-column
 *   content row. Before, the header sat in page padding, the chips were pushed
 *   out with `mr-auto` and the card was positioned with a percentage inset, so
 *   the three had no shared edge: the card's right gutter drifted with the
 *   viewport while the header's did not. The card is now col 8-12, which makes
 *   its right edge the container's right edge — the same line the wordmark
 *   starts from on the left — and the content row is vertically centred, so
 *   the chips and the card share a centre line.
 *
 *   NO AMBER OR RED. The dashboard's own Reorder badges are amber and its
 *   expiry rows are red — correct in the product, wrong as the only warm
 *   colour on a navy brand page. The backdrop re-points those semantic tokens
 *   to periwinkle (the rule below), rather than the badges being edited, so
 *   the real components stay real components. Nothing else on the page carries
 *   a non-brand colour.
 *
 *   DEPTH. The flat 62% scrim became four layers that each do one job: a blue
 *   light behind the product, a periwinkle light low-left, a vignette that
 *   darkens the corners, and a right-hand scrim that takes the ground to solid
 *   navy under the card. The product itself is blurred 7px at 38% and carries
 *   its own shadow, so it reads as an environment behind glass rather than a
 *   screenshot pasted on.
 *
 * Mobile drops the backdrop entirely (not scaled down) and the form becomes
 * the page.
 *
 * INERT: no Server Action, no Supabase client, nothing submits. The real auth
 * pages are untouched.
 */

const PALETTE: Palette = {
  tint: '#F6F7FA',
  line: '#E6E8EE',
  accent: '#4F6BFF',
  accentSoft: '#EEF0FF',
  radius: '16px',
  shadow: '0 70px 120px -50px rgba(0,0,0,0.95)',
}

/**
 * The backdrop's semantic tokens, re-pointed to the brand. `*` with
 * `!important` because ProductShot sets these inline on its own root, and an
 * inline custom property is otherwise the winner.
 */
const BACKDROP_TOKENS = `
.sp-auth-backdrop, .sp-auth-backdrop * {
  --warning: #8FA2FF !important;
  --warning-bg: rgba(143,162,255,0.16) !important;
  --danger: #A9B4FF !important;
  --danger-bg: rgba(169,180,255,0.16) !important;
  --success: #8FA2FF !important;
  --success-bg: rgba(143,162,255,0.16) !important;
  --accent: #4F6BFF !important;
  --accent-ink: #4F6BFF !important;
  --accent-soft: rgba(79,107,255,0.14) !important;
}
`

const CHIPS = [
  { icon: PackageSearch, label: 'Inventory', value: `${TOTALS.products} products` },
  { icon: CalendarClock, label: 'Expiry alerts', value: `${TOTALS.expiringSoonLots} lots expiring` },
  { icon: WifiOff, label: 'Offline till', value: 'Sales queue on the device' },
]

/** One container, one padding scale — every row aligns to this. */
const WRAP = 'mx-auto w-full max-w-[1400px] px-6 sm:px-10 lg:px-14'

export default function Concept3() {
  const [screen, setScreen] = useState<ScreenKey>('login')
  const [step, setStep] = useState(0)
  const head = screenHead(screen, step)
  const isSignup = screen === 'signup'

  function pick(next: ScreenKey) {
    setScreen(next)
    setStep(0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSignup && step < 2) setStep((s) => s + 1)
  }

  return (
    <div
      className={`${authSans.variable} relative min-h-dvh w-full overflow-hidden bg-[#0A0F1F] font-[family-name:var(--font-auth-sans)] text-[#EEF0F6] antialiased`}
    >
      <style dangerouslySetInnerHTML={{ __html: `html,body{background:#0A0F1F;color-scheme:dark}${BACKDROP_TOKENS}` }} />

      {/* ─── The environment ─── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none lg:block">
        {/* the light behind the product, so it sits IN the room */}
        <div
          className="absolute -left-[12%] top-[6%] h-[820px] w-[820px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(79,107,255,0.30), transparent)' }}
        />
        <div
          className="absolute -left-[4%] bottom-[-14%] h-[620px] w-[620px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(150,110,255,0.20), transparent)' }}
        />

        {/* the product itself: blurred, dimmed, and shadowed like an object */}
        <div className="sp-auth-backdrop absolute left-[-7%] top-1/2 w-[1000px] -translate-y-1/2">
          <div
            className="opacity-[0.26] blur-[10px]"
            style={{ filter: 'saturate(0.85)', boxShadow: '0 80px 140px -60px rgba(0,0,0,1)' }}
          >
            <ProductShot palette={PALETTE} />
          </div>
        </div>

        {/* ground under the left column, so the headline never sits on a number */}
        <div
          className="absolute inset-y-0 left-0 w-[52%]"
          style={{ background: 'linear-gradient(to right, rgba(10,15,31,0.94) 12%, rgba(10,15,31,0.55) 58%, transparent)' }}
        />
        {/* vignette — corners fall away so the middle keeps the eye */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 85% 80% at 34% 50%, transparent 20%, rgba(10,15,31,0.86) 100%)' }}
        />
        {/* and solid ground under the card */}
        <div
          className="absolute inset-y-0 right-0 w-[58%]"
          style={{ background: 'linear-gradient(to left, #0A0F1F 42%, rgba(10,15,31,0.72) 72%, transparent)' }}
        />
      </div>

      {/* ─── Content: one grid, three rows ─── */}
      <div className="relative grid min-h-dvh grid-rows-[auto_1fr_auto]">
        <header className={`${WRAP} flex flex-wrap items-center justify-between gap-4 py-6 lg:py-8`}>
          <Wordmark />
          <ScreenTabs screen={screen} onChange={pick} />
        </header>

        <main className={`${WRAP} grid items-center gap-10 py-6 lg:grid-cols-12 lg:gap-8 lg:py-4`}>
          {/* Left: what the room is. Shares the content row's centre line with the card. */}
          <div className="hidden lg:col-span-6 lg:block">
            <h2 className="max-w-[16ch] text-[clamp(1.8rem,2.4vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
              Sign in to your store.
            </h2>
            <p className="mt-3 max-w-md text-[15.5px] leading-[1.6] text-[#A7AFC4]">
              Stock, sales, suppliers and every expiry date — the dashboard behind this form is the one you land on.
            </p>
            <ul className="mt-8 max-w-[19rem] space-y-2.5">
              {CHIPS.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.09] px-4 py-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
                  style={{ background: 'rgba(16,22,43,0.66)' }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#4F6BFF]/15 text-[#8FA2FF]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[12.5px] text-[#8A93AB]">{label}</span>
                    <span className="block text-[14px] font-medium">{value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: the card. Columns 8-12 put its right edge on the container's. */}
          <div className="lg:col-span-5 lg:col-start-8">
            <div
              className="w-full rounded-[24px] border border-white/[0.10] p-6 sm:p-8"
              style={{
                background: '#111830',
                boxShadow:
                  '0 0 0 1px rgba(143,162,255,0.06), 0 40px 90px -40px rgba(0,0,0,1), 0 0 80px -30px rgba(79,107,255,0.28)',
              }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-[23px] font-semibold tracking-[-0.025em]">{head.title}</h1>
                {isSignup && <span className="shrink-0 text-[12.5px] text-[#8FA2FF]">Step {step + 1} of 3</span>}
              </div>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-[#A7AFC4]">{head.blurb}</p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <ScreenFields screen={screen} step={step} tone="raised" />
                <PrimaryButton>
                  {submitLabel(screen, step)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              </form>

              {screen === 'login' && (
                <>
                  <div className="my-6 flex items-center gap-4">
                    <span className="h-px flex-1 bg-white/[0.10]" aria-hidden="true" />
                    <span className="text-[11.5px] uppercase tracking-[0.14em] text-[#6B7489]">or</span>
                    <span className="h-px flex-1 bg-white/[0.10]" aria-hidden="true" />
                  </div>
                  <QuietButton>{DEMO.cta}</QuietButton>
                  <p className="mt-3 text-center text-[12.5px] leading-[1.55] text-[#7B85A0]">{DEMO.body}</p>
                </>
              )}

              {isSignup && step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] text-[#8FA2FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back a step
                </button>
              )}

              <p className="mt-6 border-t border-white/[0.08] pt-5 text-[14px] text-[#A7AFC4]">
                {screen === 'login' ? (
                  <>
                    New store owner? <TextLink>Set up your store</TextLink>
                  </>
                ) : (
                  <TextLink>Back to login</TextLink>
                )}
              </p>
            </div>
          </div>
        </main>

        <footer className={`${WRAP} flex flex-wrap items-center justify-between gap-3 py-6 lg:py-8`}>
          <p className="text-[12px] text-[#6B7489]">The StockPulse dashboard · demo store</p>
          <InertNote />
        </footer>
      </div>
    </div>
  )
}
