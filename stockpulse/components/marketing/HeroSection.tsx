'use client'

import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'

/**
 * The hero.
 *
 * WHAT THIS REPLACED, AND WHY IT IS NOT COMING BACK. Until this change the
 * hero was a two-column layout: copy on the left, and on the right a
 * three.js shelf of modelled grocery products with two floating glass
 * telemetry cards overlaid on it. Three separate attempts were made at that
 * idea — a photographic shelf, a stocked shelf, and the 3D one — and the
 * shelf-of-products concept is now dropped outright rather than refined a
 * fourth time. Anything that puts product imagery back into this section is
 * reopening a decision, not making a new one.
 *
 * The shape instead is the one streaming and SaaS sign-up pages have settled
 * on because it converts: a full-bleed atmospheric background, a short bold
 * headline, and exactly ONE thing to press. No imagery to parse, no second
 * button competing with the first, no stat row to read before deciding.
 * Everything the old hero carried — module count, beta pricing, the product
 * screenshot — already has a section of its own further down the page, so
 * removing it from here loses nothing except the choice of where to look.
 *
 * RED IS A FILL, NEVER TEXT. The palette underneath is unchanged (black
 * surfaces, gold accent, and gold keeps the headline gradient per D11). Red
 * is layered on top for the single entry point into sign-up. As a fill under
 * white it measures 5.07:1; as text on black it would be 4.14:1, which passes
 * for large text only — so it is not used that way here and should not be.
 *
 * The background is CSS gradients, not a canvas. ShaderBackground already
 * runs one WebGL context for the page; a hero that is the visitor's first
 * paint should not wait on a second, and D50's reasoning about paying a
 * rendering cost for decoration applies with more force here than it did to
 * the shelf it replaces.
 */
export default function HeroSection() {
  // The vertical rhythm below is tuned, not chosen: on a 1280x720 laptop the
  // whole stack has to clear a 92px fixed nav and still leave the CTA fully
  // inside the fold. It did not at first — measured, the panel's bottom edge
  // landed at 764px against a 720px viewport, which put the one button this
  // hero exists for below the fold on the commonest short screen there is.
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-20 text-center">
      {/* Two decorative layers, both aria-hidden: colour, then vignette. */}
      <div className="sp-hero-atmosphere" aria-hidden="true" />
      <div className="sp-hero-vignette" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/*
          Cinzel, the wordmark's family — the same reasoning that set the
          previous headline in it. Larger than before (68px against 56px at
          the top end) because it is now centred and alone rather than
          sharing the fold with a visual; the tracking stays positive, since
          Cinzel's counters close up when it is tightened.

          One clamp() rather than a vw size with sm:/lg:/xl: overrides. The
          old ladder shrank as the window grew across each breakpoint — at
          639px the headline was 57px and at 640px it became 48px — which is
          a jump nobody chose and everybody would eventually "fix" by adding
          another breakpoint. 40px floor, 68px ceiling, smooth between.
        */}
        <h1 className="font-serif-brand font-semibold text-[clamp(2.5rem,7.5vw,4.25rem)] leading-[1.1] tracking-[0.01em] text-[#f2efe6] max-w-[24ch]">
          Run the store,
          <br />
          not the{' '}
          <span className="text-gold-gradient bg-[length:200%_auto] animate-[sp-shimmer_4s_linear_infinite]">
            spreadsheet.
          </span>
        </h1>

        <p className="mt-6 font-sans text-lg sm:text-xl text-[#a39c8a] max-w-xl tracking-[-0.005em]">
          Inventory, sales, staff and suppliers — in one calm dashboard.
        </p>

        {/*
          The CTA sits in glass rather than on the background directly. The
          panel is what makes one button read as the point of the page: it
          gives the button a surface to sit on, and the blur separates it
          from the red glow behind without needing a heavier button.

          It is `sp-hero-glass`, not the existing `glass-card` — that class
          lifts and rotates on hover, which is right for a grid of feature
          cards and wrong for a panel holding the only control on screen.
        */}
        <div className="sp-hero-glass mt-10 w-full max-w-xl rounded-3xl px-7 py-7 sm:px-10 sm:py-8">
          <p className="font-sans text-[15px] sm:text-base text-[#d8d2c4]">
            Ready to see the whole shop in one place? Setting it up takes about a minute.
          </p>

          <Link
            href="/signup"
            className="sp-cta-red group mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-9 py-5 font-sans text-lg font-semibold sm:w-auto"
          >
            Get Started
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* #8f8877, not the #6e6858 the old hero used for labels this small.
              Measured against the panel interior, #6e6858 is 3.23:1 — a fail at
              11px, and the reassurance line under a CTA is the last thing that
              should be hard to read. #8f8877 is 5.09:1 and still reads quieter
              than the sub-headline above it. */}
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8f8877]">
            Free while we are in beta · No card needed
          </p>
        </div>

        {/* The other way in, kept deliberately quiet — a returning shopkeeper
            is not the person this section is written for. */}
        <p className="mt-6 font-sans text-sm text-[#a39c8a]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#f2efe6] border-b border-border pb-0.5 hover:border-border-strong transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      {/* A full-height hero with one button can read as the entire page. This
          is the only signal that nine sections follow it. */}
      <a
        href="#features"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8f8877] hover:text-[#d8d2c4] transition-colors"
      >
        What it does
        <ChevronDown className="w-4 h-4" />
      </a>
    </section>
  )
}
