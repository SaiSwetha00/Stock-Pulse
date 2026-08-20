'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

/**
 * What the product actually includes.
 *
 * The previous list described a capped tier of a different product: "Up to
 * 2,500 Tracked SKUs" (there is no SKU limit anywhere in the code), "Real-Time
 * Weight & Count Telemetry", "AI Spoilage & Expiry Warnings (48hr)" and
 * "Cold-Chain Probe Sync (2 Probes)" — none of which exist. It also sat
 * directly beneath a heading promising the product is 100% free, which a
 * capped feature list quietly contradicts.
 */
const FEATURES = [
  'Unlimited products — no SKU cap',
  'Low-stock alerts with per-item thresholds',
  'Expiry dates with a warning window you set',
  'Suppliers, purchase orders and deliveries',
  'Staff shifts, roles and an audit log',
  'AI assistant and CSV export',
]

export default function PricingPreviewSection() {
  return (
    <section id="pricing" className="relative py-32 sp-band-paper border-t border-border overflow-hidden perspective-1500">
      {/* Glow flare */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#93000a]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-border">
            OPEN ACCESS & COMMUNITY TIER
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-foreground tracking-tight mb-5">
            100% Free & Open Access Grocery Platform
          </h2>
          <p className="text-muted-strong text-base sm:text-lg leading-relaxed">
            All Stock Pulse core features are available completely free for store operators, researchers, and retail teams.
          </p>
        </motion.div>

        {/* Single Free Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          whileHover={{ translateZ: 25, scale: 1.01 }}
          className="glass-card mx-auto max-w-xl p-10 md:p-14 rounded-2xl border border-[var(--sp-gold)] bg-gradient-to-b from-[var(--sp-surface-card)] via-black to-[var(--sp-surface-card)] shadow-[0_0_50px_rgba(201,162,39,0.3)] preserve-3d animate-3d-glow"
        >
          <div className="font-mono text-xs tracking-widest text-[var(--sp-gold)] uppercase mb-3">Free</div>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="font-display font-semibold text-5xl text-foreground">Free</span>
            <span className="font-mono text-xs text-success font-semibold px-2 py-0.5 rounded bg-success/10 border border-success">
              ₹0 / Unlimited
            </span>
          </div>

          <p className="text-muted-strong text-sm leading-relaxed mb-8 border-b border-border pb-7">
            100% free for every grocery store — no tiers, no catches.
          </p>

          <div className="space-y-4 mb-10 font-sans text-sm text-muted-strong">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[var(--sp-gold)] shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="w-full py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-[var(--surface)] bg-gradient-to-r from-[var(--sp-gold)] to-[var(--sp-gold-deep)] shadow-[0_0_20px_rgba(201,162,39,0.4)] hover:shadow-[0_0_30px_rgba(201,162,39,0.7)]"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
