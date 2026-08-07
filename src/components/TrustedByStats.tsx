import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award, Zap, TrendingUp } from 'lucide-react';

export const TrustedByStats: React.FC = () => {
  const brands = [
    { name: 'EREWHON', subtitle: 'LOS ANGELES' },
    { name: 'DEAN & DELUCA', subtitle: 'NEW YORK' },
    { name: 'HARRODS FOOD HALL', subtitle: 'LONDON' },
    { name: 'FORTNUM & MASON', subtitle: 'PICCADILLY' },
    { name: 'BI-RITE MARKET', subtitle: 'SAN FRANCISCO' },
    { name: 'WHOLE FOODS SELECT', subtitle: 'GLOBAL' },
  ];

  return (
    <section className="relative py-20 bg-[#0b0e15]/90 border-y border-[#edc155]/15 overflow-hidden perspective-1000">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header Label */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#d1c5b0]/60">
            TRUSTED BY WORLD-CLASS ARTISAN GROCERS & ENTERPRISE CHAINS
          </span>
        </motion.div>

        {/* Brand Logos Marquee Grid with 3D Stagger */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center opacity-80 mb-16 preserve-3d">
          {brands.map((brand, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25, rotateY: (i % 2 === 0 ? -8 : 8) }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, translateZ: 20, rotateX: 5 }}
              className="glass-card p-4 rounded-xl border border-white/5 hover:border-[#edc155]/30 flex flex-col items-center justify-center text-center transition-all group animate-3d-float"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <div className="font-display font-bold tracking-widest text-[#e0e2ed] group-hover:text-[#edc155] text-sm md:text-base">
                {brand.name}
              </div>
              <div className="font-mono text-[9px] tracking-widest text-[#d1c5b0]/40 uppercase mt-0.5">
                {brand.subtitle}
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
            className="glass-card p-6 rounded-2xl border border-[#edc155]/20 bg-[#1d2027]/40 relative overflow-hidden group animate-3d-glow"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#edc155]" />
            <div className="font-mono text-xs text-[#edc155] uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Spoilage Prevention
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">$45M+</div>
            <p className="text-[#d1c5b0]/70 text-xs">Perishable product waste prevented across 300+ store locations.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            whileHover={{ translateZ: 30, rotateY: -3, scale: 1.02 }}
            className="glass-card p-6 rounded-2xl border border-white/10 bg-[#1d2027]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="font-mono text-xs text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Inventory Velocity
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">4.2x</div>
            <p className="text-[#d1c5b0]/70 text-xs">Faster stock audit speeds using automated handheld optical scanning.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            whileHover={{ translateZ: 30, rotateY: 3, scale: 1.02 }}
            className="glass-card p-6 rounded-2xl border border-white/10 bg-[#1d2027]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#93000a]" />
            <div className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Margin Accuracy
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">99.8%</div>
            <p className="text-[#d1c5b0]/70 text-xs">Real-time ledger audit reconciliation accuracy score.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            whileHover={{ translateZ: 30, rotateY: 3, scale: 1.02 }}
            className="glass-card p-6 rounded-2xl border border-white/10 bg-[#1d2027]/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#A882C1]" />
            <div className="font-mono text-xs text-[#A882C1] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" /> ROI Payback Time
            </div>
            <div className="font-display font-bold text-4xl text-[#e0e2ed] mb-1">14 Days</div>
            <p className="text-[#d1c5b0]/70 text-xs">Average timeframe for stores to recover total platform subscription cost.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
