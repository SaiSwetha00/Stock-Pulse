import React from 'react';
import { motion } from 'motion/react';
import { PageView } from '../types';
import { ArrowUpRight, Sparkles, ShieldCheck, Activity } from 'lucide-react';

interface FinalCTASectionProps {
  onNavigate: (page: PageView) => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onNavigate }) => {
  return (
    <section className="relative py-28 bg-[#0b0e15] border-t border-[#edc155]/20 overflow-hidden perspective-1500">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(237,193,85,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ translateZ: 20 }}
          className="glass-card p-10 md:p-16 rounded-3xl border border-[#edc155]/40 bg-gradient-to-b from-[#1d2027]/95 via-[#10131b]/95 to-[#1d2027]/95 shadow-[0_0_60px_rgba(237,193,85,0.25)] preserve-3d animate-3d-glow"
        >
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-6 px-4 py-1.5 rounded-full bg-[#10131b] border border-[#edc155]/40 shadow-inner">
            <Sparkles className="w-4 h-4" /> REVOLUTIONIZE YOUR SHELF TELEMETRY
          </div>

          <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#e0e2ed] tracking-normal mb-6">
            Ready to Rule Every Product & Eliminate Spoilage?
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#d1c5b0] max-w-2xl mx-auto mb-10 leading-relaxed">
            Join hundreds of world-class artisan grocers, fresh markets, and high-turnover chains standardizing on Stock Pulse.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-10">
            <button
              onClick={() => onNavigate('signup')}
              className="w-full sm:w-auto px-10 py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-semibold text-[#10131b] bg-gradient-to-r from-[#edc155] via-[#ffdf99] to-[#c9a037] shadow-[0_0_30px_rgba(237,193,85,0.5)] hover:shadow-[0_0_50px_rgba(237,193,85,0.8)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Get Started Now <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-mono text-xs uppercase tracking-widest text-[#e0e2ed] hover:text-[#edc155] border border-[#4e4636] hover:border-[#edc155]/60 bg-[#10131b] transition-all cursor-pointer"
            >
              Sign In to Command Center
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-[#d1c5b0]/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 14-Day Free Pilot
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#edc155]" /> Instant Hardware Sync
            </span>
            <span>•</span>
            <span>Cancel Anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
