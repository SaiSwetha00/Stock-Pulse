'use client'

import Link from 'next/link'
import { ArrowRight, Activity, Sparkles } from 'lucide-react'
import ThreeGroceryVisual from './ThreeGroceryVisual'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen pt-44 pb-28 flex items-center justify-center overflow-hidden">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column Text Content */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Eyebrow — one quiet gold dot, no alarm-style crimson pulse */}
          <div className="inline-flex items-center gap-2.5 mb-9 w-fit">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sp-gold)' }} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#a39c8a]">
              Store operations, in one place
            </span>
          </div>

          {/* Massive, tight-tracked headline — the dominant element on the page */}
          <h1 className="font-display font-extrabold text-[13vw] sm:text-8xl lg:text-[6.5vw] xl:text-[104px] leading-[0.93] tracking-[-0.045em] text-[#f2efe6] mb-8 max-w-[15ch]">
            Run the store,
            <br />
            not the{' '}
            <span className="text-gold-gradient bg-[length:200%_auto] animate-[sp-shimmer_4s_linear_infinite]">
              spreadsheet.
            </span>
          </h1>

          {/* One short line, not a paragraph */}
          <p className="font-sans text-lg sm:text-xl text-[#a39c8a] max-w-lg mb-11 tracking-[-0.005em]">
            Inventory, sales, staff, and suppliers — in one calm dashboard.
          </p>

          {/* Action Buttons — one real button, one quiet link */}
          <div className="flex flex-wrap items-center gap-7 mb-14">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 font-sans text-[15px] font-semibold text-[#16130a] transition-all duration-200 hover:-translate-y-px"
              style={{
                background: 'linear-gradient(155deg, var(--sp-gold-light), var(--sp-gold) 60%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 10px 24px -8px rgba(201,162,39,0.55)',
              }}
            >
              Get started free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="font-sans text-[15px] font-medium text-[#f2efe6] border-b border-border pb-0.5 hover:border-border-strong transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Hero Feature Badges */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border max-w-md">
            <div>
              <div className="font-display font-semibold text-2xl text-[#f2efe6] tracking-tight">6</div>
              <div className="font-mono text-[11px] uppercase text-[#6e6858] tracking-wider mt-1">
                Core Modules
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl text-[#f2efe6] tracking-tight">Free</div>
              <div className="font-mono text-[11px] uppercase text-[#6e6858] tracking-wider mt-1">
                While in Beta
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl text-[#f2efe6] tracking-tight">3</div>
              <div className="font-mono text-[11px] uppercase text-[#6e6858] tracking-wider mt-1">
                Staff Roles
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Interactive 3D Canvas Visual */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[460px]">
          {/* Glass halo ring backdrop */}
          <div className="absolute w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full border border-border bg-gradient-to-b from-white/[0.03] to-transparent blur-sm" />

          {/* Floating interactive 3D visual */}
          <div className="relative w-full h-[450px] md:h-[540px] z-10">
            <ThreeGroceryVisual interactive={true} />
          </div>

          {/* Floating Telemetry Glass Card Overlay — quieter border, no colored glow */}
          <div className="absolute -bottom-4 -left-4 md:bottom-6 md:left-0 z-20 p-5 rounded-xl glass-card border border-border shadow-2xl max-w-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-surface/[0.04] border border-border flex items-center justify-center text-[#a39c8a]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-sans text-[13px] text-[#f2efe6] font-medium">Low-Stock Alert</div>
                <div className="font-mono text-[10px] text-success">Avocados • 6 units left</div>
              </div>
            </div>
            <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border">
              <div className="h-full w-[88%]" style={{ background: 'linear-gradient(to right, #10b981, var(--sp-gold))' }} />
            </div>
          </div>

          <div className="absolute -top-4 -right-4 md:top-6 md:right-0 z-20 p-5 rounded-xl glass-card border border-border shadow-2xl max-w-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--sp-gold)]/15 border border-[var(--sp-gold)]/30 flex items-center justify-center" style={{ color: 'var(--sp-gold)' }}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-sans text-[13px] text-[#f2efe6] font-medium">AI Store Assistant</div>
                <div className="font-mono text-[10px] text-[#a39c8a]">“What sold best this week?”</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
