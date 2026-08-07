import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PricingPlan, PageView } from '../types';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingPreviewSectionProps {
  onNavigate: (page: PageView) => void;
}

export const PricingPreviewSection: React.FC<PricingPreviewSectionProps> = ({ onNavigate }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans: PricingPlan[] = [
    {
      id: 'boutique',
      name: 'Community Edition',
      tagline: '100% Free for single-store artisan grocers and local fresh markets.',
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        'Up to 2,500 Tracked SKUs',
        'Real-Time Weight & Count Telemetry',
        'AI Spoilage & Expiry Warnings (48hr)',
        'Cold-Chain Probe Sync (2 Probes)',
        'Standard Email & Community Support',
        'Single Location Dashboard',
      ],
      ctaText: 'Access Community Free',
    },
    {
      id: 'enterprise',
      name: 'Open Retail Standard',
      tagline: '100% Free for high-turnover supermarkets & regional chains.',
      priceMonthly: 0,
      priceAnnual: 0,
      isPopular: true,
      features: [
        'Up to 15,000 Tracked SKUs',
        'Advanced Ethylene Produce AI (72hr)',
        'Automated Farm Purchase Orders',
        'Unlimited Cold-Chain Sensor Integration',
        'Multi-Store Unified Stock Ledger',
        '24/7 Operations Support',
        'Custom ERP & POS Integration',
      ],
      ctaText: 'Deploy Free Standard',
    },
    {
      id: 'mythic',
      name: 'Enterprise Open Access',
      tagline: '100% Free for grocery cooperatives & nationwide logistics hubs.',
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        'Unlimited SKUs & Warehouses',
        'Cryptographic Audit Ledger Sync',
        'Custom Computer Vision Camera Nodes',
        'Vendor SLA Quality Scorecards',
        'Custom Machine Learning Training',
        'SLA 99.99% Precision Assurance',
        'Full Open API Access',
      ],
      ctaText: 'Launch Enterprise Free',
    },
  ];

  return (
    <section id="pricing" className="relative py-28 bg-[#0b0e15] border-t border-[#edc155]/20 overflow-hidden perspective-1500">
      {/* Glow flare */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#93000a]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4 px-3 py-1 rounded-full bg-[#1d2027] border border-[#edc155]/30">
            OPEN ACCESS & COMMUNITY TIER
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#e0e2ed] tracking-tight mb-4">
            100% Free & Open Access Grocery Platform
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed mb-6">
            All Stock Pulse core features are available completely free for store operators, researchers, and retail teams.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-2xl bg-[#1d2027] border border-[#4e4636] font-mono text-xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-xl transition-all cursor-pointer ${
                !isAnnual ? 'bg-[#10131b] text-[#edc155] font-bold shadow-md' : 'text-[#d1c5b0]'
              }`}
            >
              MONTHLY BILLING
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                isAnnual ? 'bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] font-bold shadow-md' : 'text-[#d1c5b0]'
              }`}
            >
              ANNUAL BILLING
              <span className="px-2 py-0.5 rounded text-[9px] bg-[#93000a] text-white uppercase font-bold">
                SAVE 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* 3 Pricing Cards with 3D Float */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch preserve-3d">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50, rotateY: (idx === 0 ? -12 : idx === 2 ? 12 : 0) }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                whileHover={{ scale: plan.isPopular ? 1.07 : 1.04, translateZ: 35, rotateX: -3 }}
                className={`glass-card p-8 md:p-10 rounded-2xl border flex flex-col justify-between relative transition-all duration-500 preserve-3d ${
                  plan.isPopular
                    ? 'border-[#edc155] bg-gradient-to-b from-[#1d2027] via-[#10131b] to-[#1d2027] shadow-[0_0_50px_rgba(237,193,85,0.3)] scale-105 z-10 animate-3d-glow'
                    : 'border-white/10 bg-[#181b23]/60 hover:border-[#edc155]/40'
                }`}
              >
                {/* Popular Pill Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] font-mono text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" /> MOST POPULAR FOR CHAINS
                  </div>
                )}

                <div>
                  <div className="font-mono text-xs tracking-widest text-[#edc155] uppercase mb-2">
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-display font-semibold text-4xl text-[#e0e2ed]">
                      FREE
                    </span>
                    <span className="font-mono text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">$0 / Unlimited</span>
                  </div>

                  <p className="text-[#d1c5b0] text-xs leading-relaxed mb-8 border-b border-white/5 pb-6">
                    {plan.tagline}
                  </p>

                  <div className="space-y-3 mb-8 font-sans text-xs text-[#d1c5b0]">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#edc155] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('signup')}
                  className={`w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] shadow-[0_0_20px_rgba(237,193,85,0.4)] hover:shadow-[0_0_30px_rgba(237,193,85,0.7)]'
                      : 'bg-[#1d2027] border border-[#4e4636] text-[#e0e2ed] hover:border-[#edc155] hover:text-[#edc155]'
                  }`}
                >
                  {plan.ctaText} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
