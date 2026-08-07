'use client'

import { motion } from 'framer-motion'
import type { HowItWorksStep } from './landingTypes'
import { QrCode, Cpu, ShoppingBag, BarChart3, CheckCircle2 } from 'lucide-react'

export default function HowItWorksSection() {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: '01',
      title: 'Smart Optical & RFID Tagging',
      subtitle: 'Seamless Onboarding',
      description:
        'Attach smart optical tags or ambient RFID shelf strips to produce crates, meat displays, and pantry shelves in under 30 minutes.',
      iconName: 'QrCode',
      detailPoints: ['Zero hardware replacement needed', 'Supports legacy barcode scanners', 'Instant cloud pairing'],
    },
    {
      stepNumber: '02',
      title: 'Continuous AI Telemetry',
      subtitle: 'Real-Time Monitoring',
      description:
        'Sub-second telemetry tracks ambient freezer temperature, weight depletion rates, and fruit ripeness curves 24/7.',
      iconName: 'Cpu',
      detailPoints: ['Ethylene gas ripeness tracking', 'SMS freezer door alert triggers', 'Continuous ledger sync'],
    },
    {
      stepNumber: '03',
      title: 'Autonomous Farm Reordering',
      subtitle: 'Supplier Tracking',
      description:
        'Keep every supplier, purchase order and delivery in one place, and move each shipment through its stages so you always know what is arriving and when.',
      iconName: 'ShoppingBag',
      detailPoints: ['Supplier directory', 'Purchase orders and ETAs', 'Ordered to delivered stages'],
    },
    {
      stepNumber: '04',
      title: 'Catch Perishables Before They Turn',
      subtitle: 'Less Waste',
      description:
        'Record an expiry date against perishable lines and choose how far ahead you want warning — anywhere from 12 hours to a week — so they surface while you can still sell them.',
      iconName: 'BarChart3',
      detailPoints: ['Expiry dates per product', 'Warning window you choose', 'Low-stock thresholds'],
    },
  ]

  return (
    <section id="how-it-works" className="relative py-32 bg-black overflow-hidden perspective-1500">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-white/10">
            WORKFLOW SIMPLICITY
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#e0e2ed] tracking-tight mb-7">
            From Freight Delivery to Fresh Shelf in Four Steps
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed">
            Eliminate tedious manual clipboards. Stock Pulse automates the entire lifecycle of fresh grocery management.
          </p>
        </motion.div>

        {/* Steps Grid with 3D Float */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 preserve-3d">
          {steps.map((step, idx) => (
            <motion.div
              key={step.stepNumber}
              initial={{ opacity: 0, y: 50, rotateY: idx < 2 ? -12 : 12 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12 }}
              whileHover={{ scale: 1.03, translateZ: 30, rotateX: -4 }}
              className="glass-card p-10 rounded-2xl border border-white/10 hover:border-[var(--sp-gold)]/35 transition-all duration-500 relative group flex flex-col justify-between preserve-3d"
            >
              <div>
                {/* Step Counter Tag */}
                <div className="flex items-center justify-between mb-7">
                  <span className="font-display font-black text-4xl text-[var(--sp-gold)]/40 group-hover:text-[var(--sp-gold)] transition-colors">
                    {step.stepNumber}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[var(--sp-surface-card)] border border-[var(--sp-gold)]/30 flex items-center justify-center text-[var(--sp-gold)] group-hover:rotate-12 transition-transform duration-300">
                    {idx === 0 && <QrCode className="w-5 h-5" />}
                    {idx === 1 && <Cpu className="w-5 h-5" />}
                    {idx === 2 && <ShoppingBag className="w-5 h-5" />}
                    {idx === 3 && <BarChart3 className="w-5 h-5" />}
                  </div>
                </div>

                <div className="font-mono text-[10px] tracking-widest text-[#d1c5b0]/60 uppercase mb-2">
                  {step.subtitle}
                </div>

                <h3 className="font-display font-medium text-2xl text-[#e0e2ed] mb-4 group-hover:text-[var(--sp-gold)] transition-colors">
                  {step.title}
                </h3>

                <p className="text-[#d1c5b0] text-xs leading-relaxed mb-7">{step.description}</p>
              </div>

              {/* Bullet points */}
              <div className="pt-5 border-t border-white/5 space-y-2.5">
                {step.detailPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-[#d1c5b0]/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--sp-gold)] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
