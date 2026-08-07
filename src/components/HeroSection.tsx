import React from 'react';
import { PageView } from '../types';
import { ThreeGroceryVisual } from './ThreeGroceryVisual';
import { ArrowRight, Play, ShieldAlert, Sparkles, Activity, Layers, TrendingUp } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (page: PageView) => void;
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, onOpenDemo }) => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center justify-center overflow-hidden">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column Text Content */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* System Status Tag */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#1d2027]/90 border border-[#edc155]/30 text-xs font-mono text-[#e0e2ed] mb-8 w-fit shadow-[0_0_15px_rgba(237,193,85,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#93000a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#93000a]"></span>
            </span>
            <span className="text-[#d1c5b0] uppercase tracking-[0.2em]">FRESHSTOCK INVENTORY CORE</span>
          </div>

          {/* Massive Editorial Headline with Decreased Boldness */}
          <h1 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[#e0e2ed] tracking-normal mb-6">
            Real-Time Grocery <br />
            <span className="text-[#e0e2ed]">Shelf Telemetry &</span> <br />
            <span className="text-gold-gradient bg-[length:200%_auto] animate-[shimmer_4s_linear_infinite]">
              AI Inventory Pulse.
            </span>
          </h1>

          {/* Useful Operational Data Paragraph Separated by Border */}
          <div className="py-6 my-6 border-y border-[#edc155]/25 max-w-xl">
            <p className="font-sans text-base sm:text-lg text-[#d1c5b0] leading-relaxed">
              Monitoring over <span className="text-[#edc155] font-semibold">14,200 active grocery SKUs</span> across cold-chain storage (-18°C to 4°C) and ambient displays. Reduces perishable spoilage by <span className="text-emerald-400 font-semibold">42.4%</span> while eliminating out-of-stock events with <span className="text-[#edc155] font-semibold">99.98% shelf precision</span>.
            </p>
          </div>

          {/* Action Buttons - Watch Demo removed */}
          <div className="flex flex-wrap items-center gap-5 mb-10">
            <button
              onClick={() => onNavigate('signup')}
              className="group relative px-8 py-4 bg-[#10131b] overflow-hidden rounded-xl font-mono text-xs uppercase tracking-widest text-[#edc155] border border-[#edc155]/60 hover:border-[#edc155] transition-all duration-300 shadow-[0_0_20px_rgba(237,193,85,0.25)] hover:shadow-[0_0_35px_rgba(237,193,85,0.5)] cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#edc155] to-[#c9a037] translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center gap-3 font-semibold group-hover:text-[#10131b] transition-colors">
                ENTER COMMAND CENTER
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Hero Feature Badges with Useful Operational Data */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#4e4636]/30">
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-[#e0e2ed]">14.2K+</div>
              <div className="font-mono text-[11px] uppercase text-[#d1c5b0]/70 tracking-wider mt-1">
                Monitored SKUs
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-emerald-400">42.4%</div>
              <div className="font-mono text-[11px] uppercase text-[#d1c5b0]/70 tracking-wider mt-1">
                Less Spoilage
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-2xl sm:text-3xl text-[#edc155]">99.98%</div>
              <div className="font-mono text-[11px] uppercase text-[#d1c5b0]/70 tracking-wider mt-1">
                Stock Precision
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Interactive 3D Canvas Visual */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[460px]">
          {/* Glass halo ring backdrop */}
          <div className="absolute w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full border border-[#edc155]/20 bg-gradient-to-b from-[#edc155]/5 to-transparent blur-sm animate-pulse-glow" />

          {/* Floating interactive 3D visual */}
          <div className="relative w-full h-[450px] md:h-[540px] z-10">
            <ThreeGroceryVisual interactive={true} />
          </div>

          {/* Floating Telemetry Glass Card Overlay */}
          <div className="absolute -bottom-4 -left-4 md:bottom-6 md:left-0 z-20 p-4 rounded-xl glass-card border border-[#edc155]/30 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#93000a]/30 border border-[#ffb4ab]/40 flex items-center justify-center text-[#ffb4ab]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono text-[11px] text-[#e0e2ed] font-semibold">Cold-Chain Monitor</div>
                <div className="font-mono text-[10px] text-emerald-400">Shelf #04 • 3.2°C Optimal</div>
              </div>
            </div>
            <div className="w-full bg-[#10131b] h-1.5 rounded-full overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-emerald-500 to-[#edc155] h-full w-[88%]" />
            </div>
          </div>

          <div className="absolute -top-4 -right-4 md:top-6 md:right-0 z-20 p-4 rounded-xl glass-card border border-[#edc155]/30 shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#edc155]/20 border border-[#edc155]/40 flex items-center justify-center text-[#edc155]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono text-[11px] text-[#e0e2ed] font-semibold">AI Spoilage Shield</div>
                <div className="font-mono text-[10px] text-[#d1c5b0]">Prevented $12,400 waste today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
