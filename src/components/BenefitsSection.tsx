import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BenefitItem } from '../types';
import { CheckCircle2, XCircle, Calculator, TrendingUp } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const [monthlyTurnover, setMonthlyTurnover] = useState<number>(250000);

  const calculateSavings = (turnover: number) => {
    // Average legacy spoilage rate ~6%, Stock Pulse reduces to ~1.2%
    const legacySpoilage = turnover * 0.06 * 12;
    const stockPulseSpoilage = turnover * 0.012 * 12;
    const netAnnualSavings = legacySpoilage - stockPulseSpoilage;
    return Math.round(netAnnualSavings);
  };

  const benefits: BenefitItem[] = [
    {
      feature: 'Produce Expiry Warning',
      legacyWay: 'Manual clipboard inspections twice a week',
      stockPulseWay: 'AI 72hr automated ethylene & weight telemetry',
      impact: '84% Less Spoilage',
    },
    {
      feature: 'Cold-Chain Probe Failure',
      legacyWay: 'Discovered next morning after stock spoils',
      stockPulseWay: 'Instant SMS & push alert within 60 seconds',
      impact: '100% Stock Protection',
    },
    {
      feature: 'Supplier Reorder Time',
      legacyWay: '4 hours of manual counting per week',
      stockPulseWay: '1-click autonomous purchase order dispatch',
      impact: '16 Hrs Saved / Month',
    },
    {
      feature: 'Audit Ledger Accuracy',
      legacyWay: 'Frequent missing items & inventory shrinkage',
      stockPulseWay: 'Real-time cryptographic stock reconciliation',
      impact: '99.8% Precision',
    },
  ];

  const estimatedSavings = calculateSavings(monthlyTurnover);

  return (
    <section id="benefits" className="relative py-28 bg-[#0b0e15] border-t border-[#edc155]/20 overflow-hidden perspective-1500">
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
            PROVEN BOTTOM-LINE IMPACT
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#e0e2ed] tracking-tight mb-6">
            Legacy Grocery Systems vs. Stock Pulse
          </h2>
          <p className="text-[#d1c5b0] text-base sm:text-lg leading-relaxed">
            See how modern AI shelf telemetry transforms your store's operating margins from day one.
          </p>
        </motion.div>

        {/* Comparison Matrix Table with 3D Depth */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel rounded-2xl border border-[#edc155]/30 overflow-hidden mb-20 shadow-2xl preserve-3d"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#181b23] font-mono text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="py-5 px-6 text-[#d1c5b0]/60">Operational Dimension</th>
                  <th className="py-5 px-6 text-[#ffb4ab]">Legacy Grocery ERP</th>
                  <th className="py-5 px-6 text-[#edc155]">Stock Pulse Platform</th>
                  <th className="py-5 px-6 text-[#e0e2ed] text-right">Measured Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans text-sm">
                {benefits.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[#1d2027]/60 transition-colors">
                    <td className="py-5 px-6 font-display font-bold text-[#e0e2ed]">
                      {b.feature}
                    </td>
                    <td className="py-5 px-6 text-[#d1c5b0]/70 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                      {b.legacyWay}
                    </td>
                    <td className="py-5 px-6 text-[#e0e2ed] flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#edc155] shrink-0" />
                      {b.stockPulseWay}
                    </td>
                    <td className="py-5 px-6 font-mono font-bold text-[#edc155] text-right">
                      {b.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Interactive ROI Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ translateZ: 20 }}
          className="glass-card p-8 md:p-12 rounded-2xl border border-[#edc155]/40 bg-gradient-to-r from-[#1d2027]/90 via-[#10131b]/95 to-[#1d2027]/90 relative overflow-hidden preserve-3d animate-3d-glow"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-3">
                <Calculator className="w-4 h-4" /> INTERACTIVE ROI ESTIMATOR
              </div>
              <h3 className="font-display font-bold text-3xl text-[#e0e2ed] mb-4">
                Calculate Your Annual Spoilage Savings
              </h3>
              <p className="text-[#d1c5b0] text-sm leading-relaxed mb-6">
                Drag the slider to match your store’s average monthly grocery turnover:
              </p>

              {/* Slider Input */}
              <div className="space-y-4 max-w-xl">
                <div className="flex justify-between font-mono text-sm text-[#e0e2ed]">
                  <span>Monthly Store Turnover:</span>
                  <span className="text-[#edc155] font-bold text-base">
                    ${monthlyTurnover.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="25000"
                  value={monthlyTurnover}
                  onChange={(e) => setMonthlyTurnover(Number(e.target.value))}
                  className="w-full accent-[#edc155] bg-[#10131b] h-2.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[10px] text-[#d1c5b0]/50">
                  <span>$50K (Boutique)</span>
                  <span>$500K (Supermarket)</span>
                  <span>$2M+ (Multi-Branch)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-xl bg-[#10131b]/90 border border-[#edc155]/30 text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-[#d1c5b0]/70 mb-2">
                ESTIMATED ANNUAL SPOILAGE SAVINGS
              </div>
              <div className="font-display font-black text-5xl sm:text-6xl text-gold-gradient mb-3">
                ${estimatedSavings.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Based on 84% average wastage reduction
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
