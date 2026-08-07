import React from 'react';
import { motion } from 'motion/react';
import { HowItWorksStep } from '../types';
import { QrCode, Cpu, ShoppingBag, BarChart3, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
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
      subtitle: 'Smart Logistics',
      description:
        'When safety stock crosses minimum threshold, Stock Pulse auto-generates and dispatches Purchase Orders to regional suppliers.',
      iconName: 'ShoppingBag',
      detailPoints: ['Local farm direct dispatch', 'Bulk tier volume discounts', 'Vendor SLA scoring'],
    },
    {
      stepNumber: '04',
      title: 'Zero-Waste Margin Optimization',
      subtitle: 'Maximum Profit',
      description:
        'Dynamic markdown suggestions automatically trigger special promotions for items nearing peak ripeness, eliminating spoilage.',
      iconName: 'BarChart3',
      detailPoints: ['84% spoilage reduction', 'Dynamic price markdown sync', 'Real-time profit ledger'],
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 bg-[#10131b] overflow-hidden perspective-1500">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4 px-3 py-1 rounded-full bg-[#1d2027] border border-[#edc155]/30">
            WORKFLOW SIMPLICITY
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#e0e2ed] tracking-tight mb-6">
            From Freight Delivery to Fresh Shelf in Four Steps
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed">
            Eliminate tedious manual clipboards. Stock Pulse automates the entire lifecycle of fresh grocery management.
          </p>
        </motion.div>

        {/* Steps Grid with 3D Float */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 preserve-3d">
          {steps.map((step, idx) => (
            <motion.div
              key={step.stepNumber}
              initial={{ opacity: 0, y: 50, rotateY: (idx < 2 ? -12 : 12) }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12 }}
              whileHover={{ scale: 1.03, translateZ: 30, rotateX: -4 }}
              className="glass-card p-8 rounded-2xl border border-white/10 hover:border-[#edc155]/50 transition-all duration-500 relative group flex flex-col justify-between preserve-3d"
            >
              <div>
                {/* Step Counter Tag */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display font-black text-4xl text-[#edc155]/40 group-hover:text-[#edc155] transition-colors">
                    {step.stepNumber}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#1d2027] border border-[#edc155]/30 flex items-center justify-center text-[#edc155] group-hover:rotate-12 transition-transform duration-300">
                    {idx === 0 && <QrCode className="w-5 h-5" />}
                    {idx === 1 && <Cpu className="w-5 h-5" />}
                    {idx === 2 && <ShoppingBag className="w-5 h-5" />}
                    {idx === 3 && <BarChart3 className="w-5 h-5" />}
                  </div>
                </div>

                <div className="font-mono text-[10px] tracking-widest text-[#d1c5b0]/60 uppercase mb-2">
                  {step.subtitle}
                </div>

                <h3 className="font-display font-bold text-2xl text-[#e0e2ed] mb-3 group-hover:text-[#edc155] transition-colors">
                  {step.title}
                </h3>

                <p className="text-[#d1c5b0] text-xs leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              {/* Bullet points */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                {step.detailPoints.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-[#d1c5b0]/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#edc155] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
