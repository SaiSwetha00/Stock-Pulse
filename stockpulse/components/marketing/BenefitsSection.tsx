'use client'

import { motion } from 'framer-motion'
import type { BenefitItem } from './landingTypes'
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react'

export default function BenefitsSection() {
  const benefits: BenefitItem[] = [
    {
      feature: 'Low-Stock Detection',
      legacyWay: 'Manual shelf walks and guesswork',
      stockPulseWay: 'Per-item thresholds trigger a real alert automatically',
      impact: 'Automatic, not manual',
    },
    {
      feature: 'Supplier Ordering',
      legacyWay: 'Phone calls and paper purchase orders',
      stockPulseWay: 'Digital POs tracked through a 4-stage pipeline',
      impact: 'Tracked, not scattered',
    },
    {
      feature: 'Staff Accountability',
      legacyWay: 'No record of who changed what, or when',
      stockPulseWay: 'Every change logged with before/after values',
      impact: 'Logged, not guessed',
    },
    {
      feature: 'Getting Store Answers',
      legacyWay: 'Digging through spreadsheets, asking around',
      stockPulseWay: 'Ask the AI assistant directly, get a real answer',
      impact: 'Instant, not buried',
    },
  ]

  return (
    <section id="benefits" className="relative py-32 sp-band-coffee border-t border-border overflow-hidden perspective-1500">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-border">
            MANUAL WORK VS. STOCK PULSE
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#e0e2ed] tracking-tight mb-7">
            Legacy Grocery Systems vs. Stock Pulse
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed">
            A side-by-side look at what changes when the manual parts of running a store move onto one platform.
          </p>
        </motion.div>

        {/* Comparison Matrix Table with 3D Depth */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel rounded-2xl border border-border overflow-hidden mb-24 shadow-2xl preserve-3d"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--sp-surface-alt)] font-mono text-xs uppercase tracking-wider border-b border-border">
                  <th className="py-6 px-7 text-[#d1c5b0]/60">Operational Dimension</th>
                  <th className="py-6 px-7 text-[#ffb4ab]">Legacy Grocery ERP</th>
                  <th className="py-6 px-7 text-[var(--sp-gold)]">Stock Pulse Platform</th>
                  <th className="py-6 px-7 text-[#e0e2ed] text-right">The Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans text-sm">
                {benefits.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[var(--sp-surface-card)]/60 transition-colors">
                    <td className="py-6 px-7 font-display font-bold text-[#e0e2ed]">{b.feature}</td>
                    <td className="py-6 px-7 text-[#d1c5b0]/70 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                      {b.legacyWay}
                    </td>
                    <td className="py-6 px-7 text-[#e0e2ed] flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[var(--sp-gold)] shrink-0" />
                      {b.stockPulseWay}
                    </td>
                    <td className="py-6 px-7 font-mono font-bold text-[var(--sp-gold)] text-right">{b.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Honest Closing Panel — no fabricated savings math */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ translateZ: 20 }}
          className="glass-card p-10 md:p-14 rounded-2xl border border-[var(--sp-gold)]/40 bg-gradient-to-r from-[var(--sp-surface-card)]/90 via-black/95 to-[var(--sp-surface-card)]/90 relative overflow-hidden preserve-3d animate-3d-glow"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-4">
                <Sparkles className="w-4 h-4" /> WHY STORES SWITCH
              </div>
              <h3 className="font-display font-medium text-3xl text-[#e0e2ed] mb-5">
                No Hardware, No Setup Fees, No Catch
              </h3>
              <p className="text-[#d1c5b0] text-sm leading-relaxed max-w-xl">
                Stock Pulse runs in the browser — inventory, sales, staff, suppliers, customers, and reporting in one dashboard. Nothing to install, nothing to wire up, and it’s free while the platform is in beta.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-10 rounded-xl bg-background/90 border border-[var(--sp-gold)]/30 text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-[#d1c5b0]/70 mb-2">
                PRICING TODAY
              </div>
              <div className="font-display font-black text-5xl sm:text-6xl text-gold-gradient mb-3">
                Free
              </div>
              <div className="font-mono text-xs text-success flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> No card required, while in beta
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
