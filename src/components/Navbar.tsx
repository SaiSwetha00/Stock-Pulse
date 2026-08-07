import React, { useState, useEffect } from 'react';
import { PageView } from '../types';
import { ShieldCheck, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { StockPulseLogo } from './StockPulseLogo';

interface NavbarProps {
  onNavigate: (page: PageView) => void;
  activePage: PageView;
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage, onOpenDemo }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (activePage !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="group text-left cursor-pointer focus:outline-none"
        >
          <StockPulseLogo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 font-mono text-xs tracking-[0.15em] uppercase text-[#d1c5b0] ml-auto mr-8">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#edc155] transition-all duration-300 group-hover:w-full" />
          </button>

          <button
            onClick={() => scrollToSection('dashboard-preview')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group flex items-center gap-1.5"
          >
            Dashboard
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#edc155] animate-ping" />
          </button>

          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group"
          >
            How It Works
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#edc155] transition-all duration-300 group-hover:w-full" />
          </button>

          <button
            onClick={() => scrollToSection('benefits')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group"
          >
            Benefits
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#edc155] transition-all duration-300 group-hover:w-full" />
          </button>

          <button
            onClick={() => scrollToSection('testimonials')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group"
          >
            Reviews
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#edc155] transition-all duration-300 group-hover:w-full" />
          </button>

          <button
            onClick={() => scrollToSection('pricing')}
            className="hover:text-[#edc155] transition-colors cursor-pointer py-1 relative group"
          >
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#edc155] transition-all duration-300 group-hover:w-full" />
          </button>
        </nav>

        {/* Right CTA Actions - Aligned directly to right edge */}
        <div className="hidden md:flex items-center gap-3">
          {/* Status Indicator Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1d2027]/80 border border-[#edc155]/20 text-[11px] font-mono text-[#e0e2ed]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[#d1c5b0]">System:</span>
            <span className="text-emerald-400 font-semibold tracking-wider">OPTIMAL</span>
          </div>

          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-[#e0e2ed] hover:text-[#edc155] border border-[#4e4636] hover:border-[#edc155]/50 rounded-lg transition-all duration-300 cursor-pointer"
          >
            Sign In
          </button>

          <button
            onClick={() => onNavigate('signup')}
            className="relative group px-6 py-2.5 overflow-hidden rounded-lg font-mono text-xs uppercase tracking-widest font-semibold text-[#10131b] bg-gradient-to-r from-[#edc155] via-[#ffdf99] to-[#c9a037] shadow-[0_0_20px_rgba(237,193,85,0.3)] hover:shadow-[0_0_30px_rgba(237,193,85,0.6)] transition-all duration-300 cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Sign Up <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <div className="absolute top-0 -left-[100%] w-full h-full bg-white/30 skew-x-[-30deg] group-hover:animate-[sweep_1.2s_ease-in-out_infinite]" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-[#e0e2ed] hover:text-[#edc155] bg-[#1d2027] border border-[#4e4636]"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[70px] bg-[#10131b]/95 backdrop-blur-2xl border-b border-[#edc155]/20 p-6 flex flex-col gap-5 font-mono text-xs uppercase tracking-widest text-[#e0e2ed] animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => scrollToSection('features')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('dashboard-preview')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5 flex items-center justify-between"
          >
            <span>Dashboard Demo</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#edc155]/20 text-[#edc155]">LIVE</span>
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('benefits')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5"
          >
            Benefits
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="text-left py-2 hover:text-[#edc155] border-b border-white/5"
          >
            FAQ
          </button>

          <div className="flex flex-col gap-3 pt-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('login');
              }}
              className="w-full py-3 rounded-lg border border-[#4e4636] text-center text-[#e0e2ed]"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('signup');
              }}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#edc155] to-[#c9a037] text-[#10131b] font-semibold text-center"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
