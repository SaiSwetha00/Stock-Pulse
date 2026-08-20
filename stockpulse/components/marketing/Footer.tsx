'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowRight, Lock, Sparkles } from 'lucide-react'
import StockPulseLogo from './StockPulseLogo'

export default function Footer() {
  return (
    <footer className="relative sp-band-night text-foreground pt-28 pb-16 overflow-hidden">
      {/* Background glow flares */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#edc155] to-transparent opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#93000a]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/*
          The newsletter block that sat here has been removed outright.

          It took an email address, said "Subscribed! Check your inbox for our
          latest Inventory Briefing", and did nothing with it — no request, no
          storage, no list. The handler set a flag and cleared the field. There
          is no bi-weekly research report and never was.

          Collecting someone's address under a promise you cannot keep is worse
          than not asking. If a mailing list is wanted later it needs a real
          destination first; the CTA below sends people somewhere that works.
        */}
        <div className="glass-card p-10 md:p-14 rounded-2xl mb-20 border border-[#edc155]/25 bg-gradient-to-br from-[var(--sp-surface-card)]/80 to-black/90">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-[var(--sp-gold)] tracking-[0.2em] mb-3">
                <Sparkles className="w-4 h-4" /> Free to use
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Run your shop from one dashboard
              </h3>
              <p className="text-muted-strong text-sm leading-relaxed max-w-xl">
                Stock, sales, suppliers and staff in one place. No hardware, no card, no tiers —
                set up your stock and start.
              </p>
            </div>

            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-lg bg-gradient-to-r from-[var(--sp-gold)] to-[var(--sp-gold-deep)] text-accent-ink font-mono text-xs uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(237,193,85,0.4)] transition-all shrink-0"
            >
              Create your store <ArrowRight className="w-4 h-4" />
            </Link>
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
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-4">Platform</h4>
            <ul className="space-y-3 font-sans text-sm text-muted-strong">
              {/* Named after modules that exist. "Shelf Telemetry", "AI
                  Spoilage Predictor", "Cold-Chain Hardware" and "Multi-Store
                  Sync" were none of them built — verified by grep across lib,
                  app and components. */}
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Inventory &amp; Low Stock
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Sales &amp; Daily Takings
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Suppliers &amp; Deliveries
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Staff &amp; Shifts
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-4">Company & Roles</h4>
            <ul className="space-y-3 font-sans text-sm text-muted-strong">
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors">
                  Store Operators
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--sp-gold)] transition-colors">
                  Category Managers
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-[var(--sp-gold)] transition-colors">
                  Client Success
                </a>
              </li>
              {/* "Enterprise Plans" and "Partner Portal" both went, for the
                  same reason: there are no tiers — the product is free — and
                  there is no partner portal, that link pointed at the ordinary
                  sign-in page. */}
              <li>
                <a href="#pricing" className="hover:text-[var(--sp-gold)] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--sp-gold)] transition-colors cursor-pointer">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3 */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-4">Resources & Legal</h4>
            <ul className="space-y-3 font-sans text-sm text-muted-strong">
              {/* Every entry here goes somewhere real. Four of these were
                  href="#" — API Documentation, Privacy Policy, Terms of
                  Service, Hardware Compatibility — for pages that do not
                  exist. A link that goes nowhere is worse than an absent one:
                  it reads as broken rather than as not-yet-written. */}
              <li>
                <a href="#faq" className="hover:text-[var(--sp-gold)] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link href="/help" className="hover:text-[var(--sp-gold)] transition-colors">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[var(--sp-gold)] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--sp-gold)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--sp-gold)] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Status and Copyright */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-muted">
          {/* Removed: a pulsing green "US-East Cloud Active" dot wired to
              nothing, and "Version 4.8.2-Release", a version this software has
              never had. A status light that cannot go red is not a status
              light — it is decoration that will be believed during an outage,
              which is the one moment it matters. */}
          <div className="flex items-center gap-3">
            <Link href="/help" className="hover:text-[var(--sp-gold)] transition-colors">
              Help &amp; support
            </Link>
          </div>

          <div>© 2026 Stock Pulse. All rights reserved.</div>

          {/* Privacy / Terms / Contact HQ were all href="#". They are removed
              rather than left dangling. Privacy and Terms genuinely need
              writing before this ships to a paying customer — that is logged
              in FOUND-ISSUES.md, because it is a legal question rather than a
              markup one. */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="hover:text-[var(--sp-gold)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--sp-gold)] transition-colors">
              Terms
            </Link>
            <Link href="/help" className="hover:text-[var(--sp-gold)] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
