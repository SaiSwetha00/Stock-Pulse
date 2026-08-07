'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react'
import StockPulseLogo from './StockPulseLogo'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer className="relative bg-[var(--sp-surface)] text-[#e0e2ed] border-t border-[#edc155]/20 pt-28 pb-16 overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#edc155] to-transparent opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#93000a]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Top Newsletter Grid */}
        <div className="glass-card p-10 md:p-14 rounded-2xl mb-20 border border-[#edc155]/25 bg-gradient-to-br from-[var(--sp-surface-card)]/80 to-black/90">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
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
                <div className="p-4 rounded-xl bg-success-bg border border-success text-success flex items-center gap-3 font-mono text-xs">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
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
                    className="flex-1 px-5 py-3.5 rounded-lg bg-background border border-[#4e4636] focus:border-[#edc155] text-sm text-[#e0e2ed] placeholder-[#d1c5b0]/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3.5 rounded-lg bg-gradient-to-r from-[var(--sp-gold)] to-[var(--sp-gold-deep)] text-accent-ink font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(237,193,85,0.4)] transition-all cursor-pointer shrink-0"
                  >
                    Subscribe <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Bio */}
          <div className="lg:col-span-2">
            <Link href="/" className="group text-left cursor-pointer focus:outline-none mb-5 inline-block">
              <StockPulseLogo size="lg" />
            </Link>
            <p className="text-[#a39c8a] text-sm leading-relaxed max-w-sm mb-6">
              Inventory, sales, staff, and suppliers for independent grocers — in one calm dashboard.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#a39c8a]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" /> Row-Level Security
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4" style={{ color: 'var(--sp-gold)' }} /> Role-Based Access
              </span>
            </div>
          </div>

          {/* Navigation Column 1 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">Platform</h4>
            <ul className="space-y-3 font-sans text-sm text-[#d1c5b0]">
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Shelf Telemetry
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors cursor-pointer">
                  AI Spoilage Predictor
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#edc155] transition-colors cursor-pointer flex items-center gap-1.5">
                  Stock Ledger Demo <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab]">LIVE</span>
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Cold-Chain Hardware
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Multi-Store Sync
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">Company & Roles</h4>
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
                <Link href="/login" className="hover:text-[#edc155] transition-colors cursor-pointer">
                  Partner Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4">Resources & Legal</h4>
            <ul className="space-y-3 font-sans text-sm text-[#d1c5b0]">
              {/* Every entry here goes somewhere real. Four of these were
                  href="#" — API Documentation, Privacy Policy, Terms of
                  Service, Hardware Compatibility — for pages that do not
                  exist. A link that goes nowhere is worse than an absent one:
                  it reads as broken rather than as not-yet-written. */}
              <li>
                <a href="#faq" className="hover:text-[#edc155] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#edc155] transition-colors">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[#edc155] transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Status and Copyright */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-[#d1c5b0]/60">
          {/* Removed: a pulsing green "US-East Cloud Active" dot wired to
              nothing, and "Version 4.8.2-Release", a version this software has
              never had. A status light that cannot go red is not a status
              light — it is decoration that will be believed during an outage,
              which is the one moment it matters. */}
          <div className="flex items-center gap-3">
            <Link href="/help" className="hover:text-[#edc155] transition-colors">
              Help &amp; support
            </Link>
          </div>

          <div>© 2026 Stock Pulse Technologies Inc. All rights reserved.</div>

          {/* Privacy / Terms / Contact HQ were all href="#". They are removed
              rather than left dangling. Privacy and Terms genuinely need
              writing before this ships to a paying customer — that is logged
              in FOUND-ISSUES.md, because it is a legal question rather than a
              markup one. */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/help" className="hover:text-[#edc155] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
