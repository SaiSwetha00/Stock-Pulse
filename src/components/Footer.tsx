import React, { useState } from 'react';
import { PageView } from '../types';
import { ShieldCheck, ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { StockPulseLogo } from './StockPulseLogo';

interface FooterProps {
  onNavigate: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative bg-[#0b0e15] text-[#e0e2ed] border-t border-[#edc155]/20 pt-20 pb-12 overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#edc155] to-transparent opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#93000a]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Top Newsletter Grid */}
        <div className="glass-card p-8 md:p-12 rounded-2xl mb-16 border border-[#edc155]/25 bg-gradient-to-br from-[#1d2027]/80 to-[#10131b]/90">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#edc155] tracking-[0.2em] mb-3">
                <Sparkles className="w-4 h-4" /> Stock Pulse Intelligence Digest
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-[#e0e2ed] mb-3">
                Stay Ahead of Grocery Spoilage & Margin Leakage
              </h3>
              <p className="text-[#d1c5b0] text-sm leading-relaxed max-w-xl">
                Get bi-weekly research reports on fresh supply chain telemetry, AI cold-chain tracking, and automated inventory optimization strategies.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 font-mono text-xs animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Subscribed! Check your inbox for our latest Inventory Briefing.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter store owner email..."
                    required
                    className="flex-1 px-4 py-3 rounded-lg bg-[#10131b] border border-[#4e4636] focus:border-[#edc155] text-sm text-[#e0e2ed] placeholder-[#d1c5b0]/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(237,193,85,0.4)] transition-all cursor-pointer shrink-0"
                  >
                    Subscribe <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Bio */}
          <div className="lg:col-span-2">
            <button
              onClick={() => onNavigate('landing')}
              className="group text-left cursor-pointer focus:outline-none mb-5"
            >
              <StockPulseLogo size="lg" />
            </button>
            <p className="text-[#d1c5b0] text-sm leading-relaxed max-w-sm mb-6">
              The mythic standard for modern grocery operations. Real-time shelf telemetry, zero-waste forecasting, and automated stock ledgers.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#d1c5b0]/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> SOC2 Type II
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#edc155]" /> 256-Bit Encrypted
              </span>
            </div>
          </div>

          {/* Navigation Column 1 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">
              Platform
            </h4>
            <ul className="space-y-3 font-sans text-sm text-[#d1c5b0]">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Shelf Telemetry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
                  AI Spoilage Predictor
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-[#edc155] transition-colors cursor-pointer flex items-center gap-1.5">
                  Stock Ledger Demo <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab]">LIVE</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Cold-Chain Hardware
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Multi-Store Sync
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">
              Company & Roles
            </h4>
            <ul className="space-y-3 font-sans text-sm text-[#d1c5b0]">
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors">
                  Store Operators
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors">
                  Category Managers
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-[#edc155] transition-colors">
                  Client Success
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#edc155] transition-colors">
                  Enterprise Plans
                </a>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Partner Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">
              Resources & Legal
            </h4>
            <ul className="space-y-3 font-sans text-sm text-[#d1c5b0]">
              <li>
                <a href="#faq" className="hover:text-[#edc155] transition-colors">
                  Knowledge Base & FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#edc155] transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#edc155] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#edc155] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#edc155] transition-colors">
                  Hardware Compatibility
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Status and Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-[#d1c5b0]/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              US-East Cloud Active
            </span>
            <span>•</span>
            <span>Version 4.8.2-Release</span>
          </div>

          <div>
            © 2026 Stock Pulse Technologies Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-6 text-sm">
            <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
              Privacy
            </button>
            <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
              Terms
            </button>
            <button onClick={() => onNavigate('landing')} className="hover:text-[#edc155] transition-colors cursor-pointer">
              Contact HQ
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
