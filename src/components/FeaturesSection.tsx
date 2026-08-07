import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FeatureItem } from '../types';
import {
  Activity,
  Sparkles,
  RefreshCw,
  ThermometerSnowflake,
  Layers,
  Award,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('telemetry');

  const features: FeatureItem[] = [
    {
      id: 'telemetry',
      iconName: 'Activity',
      title: 'Real-Time Shelf Telemetry',
      category: 'SENSORY INTELLIGENCE',
      description:
        'Continuous sub-second tracking of stock weight, unit counts, and shelf placement. Eliminates manual count discrepancies instantly.',
      metrics: 'Sub-second update latency • 99.9% sensor uptime',
      highlightColor: 'gold',
    },
    {
      id: 'spoilage-ai',
      iconName: 'Sparkles',
      title: 'AI Spoilage & Expiry Predictor',
      category: 'PREDICTIVE MODELS',
      description:
        'Advanced computer vision & ethylene decay models forecast exact produce deterioration rates 72 hours before visible wilting.',
      metrics: '72hr advanced notice • 84% reduction in produce loss',
      highlightColor: 'crimson',
    },
    {
      id: 'auto-reorder',
      iconName: 'RefreshCw',
      title: 'Automated Supplier Reordering',
      category: 'AUTONOMOUS LOGISTICS',
      description:
        'Intelligent replenishment rules auto-dispatch Purchase Orders to regional farms & distributors when stock crosses dynamic safety thresholds.',
      metrics: 'Zero stock-outs • 100% automated PO dispatch',
      highlightColor: 'gold',
    },
    {
      id: 'cold-chain',
      iconName: 'ThermometerSnowflake',
      title: 'Cold-Chain Environmental Monitor',
      category: 'HARDWARE SENSORS',
      description:
        'Direct integration with commercial freezer probes and produce misters. Instant SMS & push alerts if door seals degrade or temp rises 0.5°C.',
      metrics: 'Real-time temp telemetry • Push & SMS alerts',
      highlightColor: 'purple',
    },
    {
      id: 'multi-ledger',
      iconName: 'Layers',
      title: 'Multi-Store Unified Stock Ledger',
      category: 'ENTERPRISE AUDIT',
      description:
        'Consolidate stock levels across retail floors, backroom storage, and regional fulfillment hubs into a single cryptographic audit log.',
      metrics: 'Multi-branch sync • Immutable audit trail',
      highlightColor: 'gold',
    },
    {
      id: 'supplier-score',
      iconName: 'Award',
      title: 'Vendor Freshness Scorecard',
      category: 'SUPPLY CHAIN ANALYTICS',
      description:
        'Rate local produce growers and meat suppliers based on delivered freshness grade, temperature logs, and delivery punctuality.',
      metrics: 'Vendor ranking • Grade certification',
      highlightColor: 'green',
    },
  ];

  return (
    <section id="features" className="relative py-28 bg-[#10131b] overflow-hidden perspective-1500">
      {/* Background Section Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#edc155]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -15 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4 px-3 py-1 rounded-full bg-[#1d2027] border border-[#edc155]/30 shadow-lg">
            <Cpu className="w-3.5 h-3.5" /> ARCHITECTURE SUPERPOWERS
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#e0e2ed] tracking-tight mb-6">
            Engineered for Precision Freshness & Zero-Waste Profit
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed">
            Every module in Stock Pulse was designed alongside master grocers to transform volatile perishables into predictable, high-margin revenue.
          </p>
        </motion.div>

        {/* Bento Grid Features Layout with 3D Automated Float */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 preserve-3d">
          {features.map((item, idx) => {
            const isSelected = activeFeature === item.id;
            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveFeature(item.id)}
                initial={{ opacity: 0, y: 50, rotateX: 15, rotateY: (idx % 3 === 0 ? -10 : idx % 3 === 2 ? 10 : 0) }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                whileHover={{ scale: 1.03, translateZ: 35, rotateX: -4, rotateY: 4 }}
                className={`glass-card p-8 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between group relative overflow-hidden preserve-3d ${
                  isSelected
                    ? 'border-[#edc155] bg-[#1d2027]/95 shadow-[0_20px_50px_rgba(237,193,85,0.25)]'
                    : 'border-white/10 hover:border-[#edc155]/50 bg-[#181b23]/70'
                }`}
              >
                {/* Top Corner Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                        item.highlightColor === 'crimson'
                          ? 'bg-[#93000a]/30 border-[#ffb4ab]/40 text-[#ffb4ab]'
                          : item.highlightColor === 'purple'
                          ? 'bg-[#A882C1]/20 border-[#A882C1]/40 text-[#A882C1]'
                          : 'bg-[#edc155]/20 border-[#edc155]/40 text-[#edc155]'
                      }`}
                    >
                      {item.id === 'telemetry' && <Activity className="w-6 h-6" />}
                      {item.id === 'spoilage-ai' && <Sparkles className="w-6 h-6" />}
                      {item.id === 'auto-reorder' && <RefreshCw className="w-6 h-6" />}
                      {item.id === 'cold-chain' && <ThermometerSnowflake className="w-6 h-6" />}
                      {item.id === 'multi-ledger' && <Layers className="w-6 h-6" />}
                      {item.id === 'supplier-score' && <Award className="w-6 h-6" />}
                    </div>

                    <span className="font-mono text-[10px] tracking-widest text-[#d1c5b0]/60 uppercase px-2.5 py-1 rounded bg-[#10131b] border border-white/5">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-2xl text-[#e0e2ed] group-hover:text-[#edc155] transition-colors mb-3">
                    {item.title}
                  </h3>

                  <p className="text-[#d1c5b0] text-sm leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Metric Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between font-mono text-xs text-[#d1c5b0]/70">
                  <span className="flex items-center gap-1.5 text-xs text-[#edc155]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#edc155]" />
                    {item.metrics}
                  </span>
                </div>

                {/* Subtle Hover Sweep Glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#edc155]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
