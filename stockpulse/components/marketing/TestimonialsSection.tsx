'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TestimonialItem } from './landingTypes'
import { Quote, ChevronLeft, ChevronRight, Store } from 'lucide-react'

/**
 * These are illustrative usage scenarios, not customer testimonials — there
 * are no real named customers to quote yet, and inventing them (complete with
 * fake research citations and stock-photo "reviewers") would be dishonest.
 * Each one is grounded in a real, shipped feature, and labeled as such.
 */
export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const scenarios: TestimonialItem[] = [
    {
      id: 't1',
      scenario: 'Illustrative example',
      quote:
        'Every product has its own low-stock threshold, so instead of walking the shelves to guess what needs restocking, I get a real alert the moment something actually runs low.',
      feature: 'Low-Stock Alerts',
    },
    {
      id: 't2',
      scenario: 'Illustrative example',
      quote:
        'I can just ask the assistant what sold best this week or who our top staff member was, and it answers from our own real sales data instead of me digging through spreadsheets.',
      feature: 'AI Store Assistant',
    },
    {
      id: 't3',
      scenario: 'Illustrative example',
      quote:
        'A purchase order moves from Ordered to At Dock and the whole team can see it update — no more calling the supplier to ask where a shipment is.',
      feature: 'Supplier & PO Tracking',
    },
  ]

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % scenarios.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + scenarios.length) % scenarios.length)
  }

  const current = scenarios[activeIndex]

  return (
    <section id="testimonials" className="relative py-32 sp-band-night overflow-hidden perspective-1500">
      {/* Background flare */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[var(--sp-gold)]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-background/30 border border-border">
            ILLUSTRATIVE EXAMPLES
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            How Store Owners Use Stock Pulse
          </h2>
          <p className="text-muted-strong text-sm">
            Hypothetical scenarios built from real features — not actual customer quotes.
          </p>
        </motion.div>

        {/* Featured Large Scenario Card with 3D Rotate */}
        <div className="max-w-4xl mx-auto preserve-3d">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, rotateY: 20, scale: 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              whileHover={{ translateZ: 15 }}
              className="p-10 sm:p-14 rounded-2xl border border-border relative overflow-hidden bg-[var(--sp-surface-card)]/70 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] preserve-3d"
            >
              <Quote className="absolute top-8 right-8 w-16 h-16 text-[var(--sp-gold)]/15" />

              <div className="inline-flex items-center gap-1.5 mb-7 px-3 py-1 rounded-full bg-[var(--sp-gold)]/10 border border-[var(--sp-gold)]/25 font-mono text-[10px] uppercase tracking-widest text-[var(--sp-gold)]">
                {current.scenario}
              </div>

              {/* `text-foreground`, not a hard-coded hex. This was
                  `text-[#e8e5da]` — a pale cream chosen when this section sat
                  on a dark band, and never re-checked after it moved into
                  `.sp-band-night`, which flips `--sp-surface-card` to #fbf8f1.
                  Pale cream on cream measured 1.12:1 against a 4.5 minimum, on
                  all three slides: the quote was very nearly invisible.

                  The token flips with the band, so this cannot drift again the
                  next time the section changes background. */}
              <p className="font-display italic text-xl sm:text-2xl text-foreground leading-relaxed mb-10">
                “{current.quote}”
              </p>

              <div className="pt-6 border-t border-border flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sp-gold)]/12 border border-[var(--sp-gold)]/30 text-[var(--sp-gold)]">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display font-medium text-base text-foreground">Independent grocer</div>
                  <div className="font-mono text-xs text-muted">
                    Feature shown: <span className="text-[var(--sp-gold)]">{current.feature}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls & Pagination Dots */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {scenarios.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'w-8 bg-[var(--sp-gold)]' : 'w-2 bg-surface/15'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-xl bg-[var(--sp-surface-card)] border border-border hover:border-[var(--sp-gold)]/50 text-foreground hover:text-[var(--sp-gold)] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                aria-label="Previous example"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-xl bg-[var(--sp-surface-card)] border border-border hover:border-[var(--sp-gold)]/50 text-foreground hover:text-[var(--sp-gold)] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                aria-label="Next example"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
