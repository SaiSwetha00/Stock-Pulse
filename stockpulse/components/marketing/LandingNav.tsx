'use client'

import { useCallback, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import StockPulseLogo from './StockPulseLogo'

const LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'FAQ', id: 'faq' },
]

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /**
   * Where the page actually is, read on the FIRST render rather than waited
   * for.
   *
   * This was `useState(false)` plus a scroll listener added on mount, with no
   * initial read — so `scrolled` was false until a scroll event happened to
   * fire, whatever the real offset was. At the top of the page that is the
   * right answer by luck. It is wrong the moment the page loads already
   * scrolled, which is not an edge case: browsers restore scroll position on
   * reload, and a deep link to #pricing or #faq lands mid-page too.
   *
   * Reproduced with a real browser before fixing (scripted `scrollTo` is not
   * enough — it moves the offset without dispatching scroll, so the listener
   * never runs and the bug looks like it is everywhere): scrolled to y=900,
   * reloaded, page repainted at y=930 with the nav still in its transparent
   * state, sitting on top of the features cards with both sets of text
   * overlapping. One wheel tick of 60px snapped it back to correct.
   *
   * `useSyncExternalStore` rather than an effect that calls the handler once.
   * The client snapshot IS the initial value, so there is no window in which
   * the component believes something it never checked, and no state written
   * from an effect. `ThemeToggle` in components/auth/AuthUI.tsx already reads
   * an external value this way; this is that shape, not a new one.
   *
   * The server snapshot is false because a server cannot know a scroll
   * offset. That is a real limit, not a guess, and it is why the BACKGROUND
   * no longer depends on this value at all (see the header below) — only the
   * padding does, and padding correcting itself on hydration is invisible.
   */
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('scroll', onChange, { passive: true })
    return () => window.removeEventListener('scroll', onChange)
  }, [])

  const scrolled = useSyncExternalStore(
    subscribe,
    () => window.scrollY > 20,
    () => false,
  )

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    /*
      `glass-nav` is UNCONDITIONAL now. It used to be `scrolled ? 'glass-nav
      py-4' : 'bg-transparent py-6'`, so at the top of the page the bar had no
      background of its own and the hero's entry glow read straight through it
      — reported as the nav "not rendering its background on load".

      That part was not the initial-state bug above; transparent at y=0 was
      what the code asked for, and it correctly returned to transparent on
      scrolling back up (measured: the class flips back). It was a design
      choice, and the choice is now reversed: a fixed bar that is sometimes a
      surface and sometimes a hole has to be read twice, and over a lit
      background it reads as a rendering fault the first time.

      Only the padding still varies with scroll — the shrink-on-scroll is
      worth keeping, and it is the one thing that can be wrong for a frame
      after hydration without anyone noticing.
    */
    <header
      className={`fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300 ${
        scrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-left cursor-pointer focus:outline-none">
          <StockPulseLogo size="md" showSubtitle={false} />
        </Link>

        {/* Desktop Navigation Links — quiet, no mono/uppercase/tracking noise.

            #e6e1d5, not the #a39c8a these were. That warm grey was chosen
            against black, and the nav is no longer over black: the hero's
            entry glow puts a lit red field directly behind this bar.

            Measured off the rendered pixels rather than modelled — the model
            was wrong by a lot, predicting #9d3a2e behind the bar where the
            screenshot actually shows #691715, because the veil sits over the
            glow and takes most of it back. On that real background #a39c8a
            reads 4.43:1 behind "How it works" and 4.54:1 behind "Features":
            a fail at 14.5px, but a marginal one, which is the kind that
            survives review because it looks fine. #e6e1d5 is 9.28:1 there
            and 16.9:1 against the scrolled glass nav.

            The colour hierarchy this used to carry (muted links, bright CTA)
            is gone because the background cannot support it — a tone quiet
            enough to recede on black is illegible on the glow. Weight and the
            arrow carry it instead: these are medium, "Get started" is
            semibold with an arrow. */}
        <nav className="hidden lg:flex items-center gap-9 font-sans text-[14.5px] font-medium text-[#e6e1d5] mx-auto">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side: two text links, NO filled button.

            This carried a filled "Get started" — first gold, then red to
            match the hero's. Both were wrong for the same reason: the hero
            below it has a "Get Started" of its own, and a fixed nav means
            the two are on screen together for the whole first viewport. Two
            filled controls competing for one action is exactly the problem
            the single-CTA hero was built to remove, so making them agree on
            a colour only made the competition tidier.

            The hero's is the one that stays, because it is the one with the
            page's argument attached — a headline, a reason, and a line
            saying what it costs. A nav button has none of that; it is a
            shortcut for someone already convinced, and a text link serves
            that person perfectly.

            Demoted rather than deleted, because this nav is `fixed`: past
            the hero it is the only always-reachable way in, and the next
            sign-up control is eight sections down at Pricing. A visitor who
            decides while reading Features should not have to hunt.

            The two links are not peers. "Get started" keeps the foreground
            colour and the arrow; "Sign in" stays muted. Hierarchy without
            a fill. */}
        <div className="hidden md:flex items-center gap-7">
          {/* Persists past the hero: the nav is fixed, so this is the only
              route to the demo once someone has scrolled into the sections. */}
          <Link
            href="/login?demo=1"
            className="font-sans text-[14.5px] font-medium text-[#e6e1d5] hover:text-[var(--sp-gold)] transition-colors cursor-pointer"
          >
            Live demo
          </Link>

          <Link
            href="/login"
            className="font-sans text-[14.5px] font-medium text-[#e6e1d5] hover:text-[var(--sp-gold)] transition-colors cursor-pointer"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 font-sans text-[14.5px] font-semibold text-[#f2efe6] hover:text-[var(--sp-gold)] transition-colors cursor-pointer"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-[#f2efe6] hover:text-[var(--sp-gold)] bg-surface/[0.03] border border-border"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[64px] bg-background/95 backdrop-blur-2xl border-b border-border p-6 flex flex-col gap-1 font-sans text-[15px] text-[#f2efe6]">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="text-left py-3 hover:text-[var(--sp-gold)] border-b border-border"
            >
              {link.label}
            </button>
          ))}

          <div className="flex flex-col gap-3 pt-5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg border border-border text-center text-[#f2efe6]"
            >
              Sign in
            </Link>
            {/* Same rule in the mobile menu: red fill appears exactly once
                on this page, and that once is the hero. */}
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg border border-[var(--sp-gold)]/40 text-center font-semibold text-[#f2efe6]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
