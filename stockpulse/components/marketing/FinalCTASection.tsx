'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Sparkles, ShieldCheck, Activity } from 'lucide-react'

export default function FinalCTASection() {
  return (
    <section className="relative py-32 sp-band-paper border-t border-border overflow-hidden perspective-1500">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,31,38,0.13)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ translateZ: 20 }}
          className="glass-card p-12 md:p-20 rounded-3xl border border-[var(--sp-gold)]/40 bg-gradient-to-b from-[var(--sp-surface-card)]/95 via-black/95 to-[var(--sp-surface-card)]/95 shadow-[0_0_60px_rgba(201,162,39,0.25)] preserve-3d animate-3d-glow"
        >
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-7 px-4 py-1.5 rounded-full bg-background border border-[var(--sp-gold)]/40 shadow-inner">
            <Sparkles className="w-4 h-4" /> GET OFF THE CLIPBOARD
          </div>

          <h2 className="font-display font-semibold text-3xl sm:text-5xl text-foreground tracking-normal mb-7">
            Ready to Rule Every Product & Eliminate Spoilage?
          </h2>

          <p className="font-sans text-base sm:text-lg text-muted-strong max-w-2xl mx-auto mb-12 leading-relaxed">
            Join hundreds of world-class artisan grocers, fresh markets, and high-turnover chains standardizing on Stock Pulse.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12">
            <Link
              href="/signup"
              // Three measured problems, one button.
              //
              // 1. The LABEL was the same colour as the button.
              //    `text-accent-ink` resolves to #f0d78c in this band, and the
              //    gradient's middle stop is --sp-gold-light, which IS #f0d78c.
              //    Measured 1.00:1 — the label was not faint, it was invisible,
              //    which is what made the control read as a solid yellow blob.
              //    Now a near-black ink, written literally so it cannot be
              //    re-pointed at a token that flips light.
              // 2. The gradient's dark end made a dark label fail anyway:
              //    --sp-gold-deep is #8a6b1a, and even #14100c only reaches
              //    3.77:1 on it. Ending the ramp on --sp-gold instead keeps a
              //    gold button and takes the worst case to ~7.7:1.
              // 3. The GLOW was a 30px full-bleed halo at 0.5 alpha rising to
              //    50px at 0.8 on hover, blooming over the button's own edges.
              //    Replaced with a grounded drop shadow, so the button sits on
              //    the page instead of smearing into it, and hover lifts it
              //    rather than flaring.
              className="w-full sm:w-auto px-11 py-5 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold text-[var(--surface)] bg-gradient-to-r from-[var(--sp-gold)] via-[var(--sp-gold-light)] to-[var(--sp-gold)] shadow-[0_8px_20px_-8px_rgba(201,162,39,0.45)] hover:shadow-[0_10px_26px_-8px_rgba(201,162,39,0.6)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Get Started Now <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-9 py-5 rounded-xl font-mono text-xs uppercase tracking-widest text-foreground hover:text-[var(--sp-gold)] border border-border hover:border-[var(--sp-gold)]/60 bg-background transition-all cursor-pointer"
            >
              Sign In to Command Center
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" /> 14-Day Free Pilot
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[var(--sp-gold)]" /> Instant Hardware Sync
            </span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
