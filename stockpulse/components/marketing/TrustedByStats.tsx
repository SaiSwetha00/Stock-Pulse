'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Award, Zap, TrendingUp } from 'lucide-react'

export default function TrustedByStats() {
  const modules = [
    { name: 'INVENTORY', subtitle: 'STOCK & ALERTS' },
    { name: 'SALES', subtitle: 'DAILY LOGGING' },
    { name: 'SUPPLIERS', subtitle: 'PURCHASE ORDERS' },
    { name: 'STAFF', subtitle: 'SHIFTS & ROLES' },
    { name: 'CUSTOMERS', subtitle: 'LOYALTY TIERS' },
    { name: 'ANALYTICS', subtitle: 'SALES TRENDS' },
  ]

  return (
    <section className="relative py-24 sp-band-lifted border-y border-border overflow-hidden perspective-1000">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header Label */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#d1c5b0]/60">
            EVERYTHING YOU NEED TO RUN THE STORE, IN ONE PLACE
          </span>
        </motion.div>

        {/* Real Module Grid with 3D Stagger */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center opacity-80 mb-20 preserve-3d">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25, rotateY: i % 2 === 0 ? -8 : 8 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, translateZ: 20, rotateX: 5 }}
              className="glass-card p-5 rounded-xl border border-border hover:border-[var(--sp-gold)]/35 flex flex-col items-center justify-center text-center transition-all group animate-3d-float"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <div className="font-display font-bold tracking-widest text-[#e0e2ed] group-hover:text-[var(--sp-gold)] text-sm md:text-base">
                {mod.name}
              </div>
              <div className="font-mono text-[9px] tracking-widest text-[#d1c5b0]/40 uppercase mt-0.5">
                {mod.subtitle}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlights Banner Cards with 3D Depth */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 preserve-3d">
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            whileHover={{ translateZ: 30, rotateY: -3, scale: 1.02 }}
            className="glass-card p-7 rounded-2xl border border-[var(--sp-gold)]/25 bg-[var(--sp-surface-card)]/40 relative overflow-hidden group animate-3d-glow"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--sp-gold)]" />
            <div className="font-mono text-xs text-[var(--sp-gold)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Pricing
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">Free</div>
            <p className="text-[#d1c5b0]/70 text-xs">Full feature access while Stock Pulse is in beta — no card required.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            whileHover={{ translateZ: 30, rotateY: -3, scale: 1.02 }}
            className="glass-card p-7 rounded-2xl border border-border bg-[var(--sp-surface-card)]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-success" />
            <div className="font-mono text-xs text-success uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Setup
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">No Hardware</div>
            <p className="text-[#d1c5b0]/70 text-xs">Runs in the browser — nothing to install, nothing to wire up.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            whileHover={{ translateZ: 30, rotateY: 3, scale: 1.02 }}
            className="glass-card p-7 rounded-2xl border border-border bg-[var(--sp-surface-card)]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#93000a]" />
            <div className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Accountability
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">Owner-Only Audit</div>
            <p className="text-[#d1c5b0]/70 text-xs">Every manager action is logged with before/after values, visible only to the owner.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            whileHover={{ translateZ: 30, rotateY: 3, scale: 1.02 }}
            className="glass-card p-7 rounded-2xl border border-border bg-[var(--sp-surface-card)]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#A882C1]" />
            <div className="font-mono text-xs text-[#A882C1] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" /> Access
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">3 Roles</div>
            <p className="text-[#d1c5b0]/70 text-xs">Owner, manager, and staff each see exactly what their job needs.</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
