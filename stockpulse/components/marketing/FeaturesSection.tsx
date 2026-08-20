'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FeatureItem } from './landingTypes'
import {
  PackageSearch,
  Bot,
  Truck,
  MonitorCheck,
  History,
  Heart,
  CheckCircle2,
  Cpu,
} from 'lucide-react'

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string>('stock-tracking')

  const features: FeatureItem[] = [
    {
      id: 'stock-tracking',
      iconName: 'PackageSearch',
      title: 'Live Stock Tracking & Low-Stock Alerts',
      category: 'INVENTORY INTELLIGENCE',
      description:
        'Every product carries its own low-stock threshold, so the moment a count dips below it the item surfaces as a real alert — no manual spot-checks. Bulk CSV import handles the initial catalog load.',
      metrics: 'Per-item thresholds • CSV bulk import',
      highlightColor: 'gold',
    },
    {
      id: 'ai-assistant',
      iconName: 'Bot',
      title: 'AI Store Assistant',
      category: 'CONVERSATIONAL AI',
      description:
        'Ask it what needs reordering, how sales looked this week, or who is top-performing — it calls real tools against your live store data and answers in plain language, scoped to what your role can see.',
      metrics: 'Real-time answers • Role-aware access',
      highlightColor: 'crimson',
    },
    {
      id: 'supplier-po',
      iconName: 'Truck',
      title: 'Supplier & Purchase Order Tracking',
      category: 'SUPPLIER OPERATIONS',
      description:
        'Create purchase orders per supplier and follow each one through a four-stage pipeline — ordered, shipped, in transit, at dock — with a live activity feed of every update along the way.',
      metrics: '4-stage shipment pipeline • Live activity feed',
      highlightColor: 'gold',
    },
    {
      id: 'checkout-monitoring',
      iconName: 'MonitorCheck',
      title: 'Self-Checkout Monitoring',
      category: 'LIVE OPERATIONS',
      description:
        'A board showing every self-checkout station and where it stands — available, waiting on assistance, or out for maintenance — so whoever is on the floor can see at a glance which one needs somebody.',
      metrics: 'Station status board • Assistance flags',
      highlightColor: 'purple',
    },
    {
      id: 'audit-trail',
      iconName: 'History',
      title: 'Full Audit Trail',
      category: 'ENTERPRISE AUDIT',
      description:
        'Every change a manager makes is logged with who did it, what changed, and the before/after values — visible only to the store owner, so accountability never depends on memory.',
      metrics: 'Before/after diffs • Owner-only visibility',
      highlightColor: 'gold',
    },
    {
      id: 'customer-loyalty',
      iconName: 'Heart',
      title: 'Customer Loyalty & Retention',
      category: 'CUSTOMER INTELLIGENCE',
      description:
        'Every customer is tracked across four loyalty tiers, with total spend and visit count updating automatically as they shop — so your regulars are visible, not just remembered.',
      metrics: '4 loyalty tiers • Automatic spend tracking',
      highlightColor: 'green',
    },
  ]

  return (
    <section id="features" className="relative py-32 sp-band-night overflow-hidden perspective-1500">
      {/* Background Section Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[var(--sp-gold)]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -15 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-border shadow-lg">
            <Cpu className="w-3.5 h-3.5" /> ARCHITECTURE SUPERPOWERS
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-foreground tracking-tight mb-7">
            Engineered for Precision Freshness & Zero-Waste Profit
          </h2>
          <p className="text-muted-strong text-base sm:text-lg leading-relaxed">
            Every module in Stock Pulse was designed alongside master grocers to transform volatile perishables into predictable, high-margin revenue.
          </p>
        </motion.div>

        {/* Bento Grid Features Layout with 3D Automated Float */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 preserve-3d">
          {features.map((item, idx) => {
            const isSelected = activeFeature === item.id
            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveFeature(item.id)}
                initial={{ opacity: 0, y: 50, rotateX: 15, rotateY: idx % 3 === 0 ? -10 : idx % 3 === 2 ? 10 : 0 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                whileHover={{ scale: 1.03, translateZ: 35, rotateX: -4, rotateY: 4 }}
                className={`glass-card p-10 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between group relative overflow-hidden preserve-3d ${
                  isSelected
                    ? 'border-[var(--sp-gold)]/60 bg-[var(--sp-surface-card)]/95 shadow-[0_20px_50px_-20px_rgba(201,162,39,0.35)]'
                    : 'border-border hover:border-[var(--sp-gold)]/35 bg-[var(--sp-surface-alt)]/70'
                }`}
              >
                {/* Top Corner Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                        item.highlightColor === 'crimson'
                          ? 'bg-[#93000a]/30 border-[#ffb4ab]/40 text-danger'
                          : item.highlightColor === 'purple'
                          ? 'bg-[#A882C1]/20 border-[#A882C1]/40 text-[#A882C1]'
                          : 'bg-[var(--sp-gold)]/15 border-[var(--sp-gold)]/35 text-[var(--sp-gold)]'
                      }`}
                    >
                      {item.id === 'stock-tracking' && <PackageSearch className="w-6 h-6" />}
                      {item.id === 'ai-assistant' && <Bot className="w-6 h-6" />}
                      {item.id === 'supplier-po' && <Truck className="w-6 h-6" />}
                      {item.id === 'checkout-monitoring' && <MonitorCheck className="w-6 h-6" />}
                      {item.id === 'audit-trail' && <History className="w-6 h-6" />}
                      {item.id === 'customer-loyalty' && <Heart className="w-6 h-6" />}
                    </div>

                    <span className="font-mono text-[10px] tracking-widest text-muted uppercase px-2.5 py-1 rounded bg-background border border-border">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-display font-medium text-2xl text-foreground group-hover:text-[var(--sp-gold)] transition-colors mb-4">
                    {item.title}
                  </h3>

                  <p className="text-muted-strong text-sm leading-relaxed mb-7">{item.description}</p>
                </div>

                {/* Bottom Metric Footer */}
                <div className="pt-5 border-t border-border flex items-center justify-between font-mono text-xs text-muted">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--sp-gold)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sp-gold)]" />
                    {item.metrics}
                  </span>
                </div>

                {/* Subtle Hover Sweep Glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[var(--sp-gold)]/8 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
