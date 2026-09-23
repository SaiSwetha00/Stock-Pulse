'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { productTokens, type Palette } from '@/components/design-preview/ProductShot'
import { ExpiringPanel, ExpiringTile, LowStockTile } from '@/components/design-exploration/shared'
import { authSans } from '@/components/auth/fonts'
import {
  DEMO,
  InertNote,
  PrimaryButton,
  QuietButton,
  ScreenFields,
  ScreenTabs,
  SIGNUP_STEPS,
  TextLink,
  Wordmark,
  screenHead,
  submitLabel,
  type ScreenKey,
} from './kit'

/**
 * CONCEPT 1 — Product + auth split screen.
 *
 * The left half is the product: real dashboard panels (the app's own StatCard,
 * Card, Badge and ExpiryTag with the demo store's figures) stacked and cropped
 * by the panel's bottom edge, under one line about what the product does. The
 * right half is the form, on the same navy, with NO card around it — the split
 * itself is the container.
 *
 * What separates it from the other two: the product is shown as legible UI at
 * full contrast, beside the form. Concept 3 uses the product as a dimmed
 * backdrop behind the form; Concept 2 shows no product at all.
 *
 * Sign-up's three steps get a segmented rail above the form, so progress is
 * part of the layout rather than a bar stuck on top of a card.
 */

const PALETTE: Palette = {
  tint: '#F6F7FA',
  line: '#E6E8EE',
  accent: '#4F6BFF',
  accentSoft: '#EEF0FF',
  radius: '14px',
  shadow: '0 30px 60px -30px rgba(0,0,0,0.65)',
}

export default function Concept1() {
  const [screen, setScreen] = useState<ScreenKey>('login')
  const [step, setStep] = useState(0)
  const head = screenHead(screen, step)
  const isSignup = screen === 'signup'

  function pick(next: ScreenKey) {
    setScreen(next)
    setStep(0)
  }

  /** Inert: the only thing a submit does here is walk the sign-up steps. */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSignup && step < 2) setStep((s) => s + 1)
  }

  return (
    <div
      className={`${authSans.variable} flex min-h-dvh w-full flex-col bg-[#0A0F1F] font-[family-name:var(--font-auth-sans)] text-[#EEF0F6] antialiased lg:flex-row`}
    >
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#0A0F1F;color-scheme:dark}' }} />

      {/* ─── Left: the product ─── */}
      <aside className="relative hidden overflow-hidden border-r border-white/[0.08] lg:flex lg:w-[52%] lg:flex-col lg:px-14 lg:pt-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(79,107,255,0.22), transparent)' }}
        />
        <Wordmark className="relative" />

        <h2 className="relative mt-14 max-w-[15ch] text-[clamp(2rem,2.8vw,2.8rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
          The whole shop, on one screen.
        </h2>
        <p className="relative mt-4 max-w-sm text-[15.5px] leading-[1.6] text-[#A7AFC4]">
          Stock by lot and expiry date, a till that works offline, and the alerts that tell you what to reorder.
        </p>

        {/* Real product UI, cropped by the panel's bottom edge. */}
        <div className="relative mt-10 flex-1" style={productTokens(PALETTE)}>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 select-none space-y-3"
            style={{
              maskImage: 'linear-gradient(to top, transparent 2%, #000 34%)',
              WebkitMaskImage: 'linear-gradient(to top, transparent 2%, #000 34%)',
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <LowStockTile className="p-4 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)]" />
              <ExpiringTile className="p-4 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)]" />
            </div>
            <ExpiringPanel line={PALETTE.line} className="shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7)]" />
          </div>
        </div>
        <p className="relative pb-6 text-[12px] text-[#6B7489]">The StockPulse dashboard · demo store</p>
      </aside>

      {/* ─── Right: the form ─── */}
      <main className="relative flex flex-1 flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Wordmark className="lg:hidden" />
          <ScreenTabs screen={screen} onChange={pick} className="ml-auto" />
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[26rem] py-10 lg:py-0">
            {isSignup && (
              <ol className="mb-8 flex gap-2" aria-label="Sign-up progress">
                {SIGNUP_STEPS.map((s, i) => (
                  <li key={s.title} className="flex-1">
                    <span
                      className={`block h-[3px] rounded-full ${i <= step ? 'bg-[#4F6BFF]' : 'bg-white/[0.10]'}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`mt-2 flex items-center gap-1.5 text-[12px] ${
                        i <= step ? 'text-[#A9B4FF]' : 'text-[#6B7489]'
                      }`}
                    >
                      {i < step ? <Check className="h-3 w-3" aria-hidden="true" /> : <span>0{i + 1}</span>}
                      <span className="hidden sm:inline">{s.title}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <h1 className="text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold tracking-[-0.03em]">{head.title}</h1>
            <p className="mt-2 text-[15px] text-[#A7AFC4]">{head.blurb}</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <ScreenFields screen={screen} step={step} />
              <div className="pt-2">
                <PrimaryButton>
                  {submitLabel(screen, step)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              </div>
            </form>

            {screen === 'login' && (
              <div className="mt-6 rounded-2xl border border-[#4F6BFF]/25 bg-[#4F6BFF]/[0.08] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8FA2FF]">{DEMO.kicker}</p>
                <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#A7AFC4]">{DEMO.body}</p>
                <QuietButton className="mt-3">{DEMO.cta}</QuietButton>
              </div>
            )}

            <div className="mt-6 text-[14px] text-[#A7AFC4]">
              {screen === 'login' ? (
                <p>
                  New store owner? <TextLink>Set up your store</TextLink>
                </p>
              ) : isSignup && step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="inline-flex items-center gap-1.5 text-[#8FA2FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
                </button>
              ) : (
                <p>
                  <TextLink>Back to login</TextLink>
                </p>
              )}
            </div>

            <InertNote className="mt-8 max-w-sm" />
          </div>
        </div>
      </main>
    </div>
  )
}
