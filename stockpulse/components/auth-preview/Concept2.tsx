'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { authSans } from '@/components/auth/fonts'
import {
  DEMO,
  InertNote,
  Mark,
  PrimaryButton,
  QuietButton,
  ScreenFields,
  ScreenTabs,
  SIGNUP_STEPS,
  TextLink,
  screenHead,
  submitLabel,
  type ScreenKey,
} from './kit'

/**
 * CONCEPT 2 — Centred premium card.
 *
 * One column, nothing beside it: mark and wordmark stacked at the top, a card
 * centred under them with a soft blue light behind it, and a quiet footer. No
 * product UI anywhere — the supporting context is one line of plain text under
 * the wordmark, not a screenshot.
 *
 * What separates it from the other two: this is the only concept with a real
 * CARD (border, raised fill, deep shadow) and the only symmetrical one. It is
 * also the one that survives a narrow window untouched, because the phone
 * layout is the desktop layout with less padding.
 *
 * Sign-up shows "Step 2 of 3" in the card's own header rather than a rail, so
 * the card keeps its single-column rhythm.
 */

export default function Concept2() {
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
      className={`${authSans.variable} relative flex min-h-dvh w-full flex-col items-center overflow-hidden bg-[#0A0F1F] px-5 py-10 font-[family-name:var(--font-auth-sans)] text-[#EEF0F6] antialiased sm:px-8 sm:py-14`}
    >
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#0A0F1F;color-scheme:dark}' }} />

      {/* One light behind the card — the glow is the decoration, and the only one. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[8%] h-[720px] w-[900px] max-w-[130vw] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(79,107,255,0.20), transparent 72%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[34%] h-[420px] w-[520px] max-w-[110vw] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(150,110,255,0.16), transparent 70%)' }}
      />

      <ScreenTabs screen={screen} onChange={pick} className="relative mb-10 self-center" />

      <div className="relative flex w-full max-w-[27rem] flex-col items-center">
        <Mark className="h-12 w-12" />
        <p className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">StockPulse</p>
        <p className="mt-1 text-[13.5px] text-[#8A93AB]">Store operations for independent grocers</p>

        <div
          className="mt-8 w-full rounded-[26px] border border-white/[0.09] p-6 shadow-[0_50px_100px_-50px_rgba(0,0,0,0.95)] sm:p-8"
          style={{ background: 'rgba(17,23,43,0.92)' }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-[22px] font-semibold tracking-[-0.025em]">{head.title}</h1>
            {isSignup && <span className="text-[12.5px] text-[#8FA2FF]">Step {step + 1} of 3</span>}
          </div>
          <p className="mt-1.5 text-[14.5px] text-[#A7AFC4]">{head.blurb}</p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <ScreenFields screen={screen} step={step} tone="raised" />
            <div className="pt-2">
              <PrimaryButton>
                {submitLabel(screen, step)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PrimaryButton>
            </div>
          </form>

          {screen === 'login' && (
            <>
              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/[0.10]" aria-hidden="true" />
                <span className="text-[12px] uppercase tracking-[0.14em] text-[#6B7489]">or</span>
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
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-[#8FA2FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {SIGNUP_STEPS[step - 1].title}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-[14px] text-[#A7AFC4]">
          {screen === 'login' ? (
            <>
              New store owner? <TextLink>Set up your store</TextLink>
            </>
          ) : (
            <TextLink>Back to login</TextLink>
          )}
        </p>

        <InertNote className="mt-10 max-w-sm text-center" />

        <p className="mt-3 flex items-center gap-4 text-[12.5px] text-[#6B7489]">
          <span>© 2026 StockPulse</span>
          <TextLink className="!text-[#6B7489]">Privacy</TextLink>
          <TextLink className="!text-[#6B7489]">Terms</TextLink>
        </p>
      </div>
    </div>
  )
}
