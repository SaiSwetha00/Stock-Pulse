'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import StockPulseLogo from './StockPulseLogo'

const LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'FAQ', id: 'faq' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-left cursor-pointer focus:outline-none">
          <StockPulseLogo size="md" showSubtitle={false} />
        </Link>

        {/* Desktop Navigation Links — quiet, no mono/uppercase/tracking noise */}
        <nav className="hidden lg:flex items-center gap-9 font-sans text-[14.5px] font-medium text-[#a39c8a] mx-auto">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="hover:text-[#f2efe6] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side: one quiet link, one real button */}
        <div className="hidden md:flex items-center gap-7">
          <Link
            href="/login"
            className="font-sans text-[14.5px] font-medium text-[#a39c8a] hover:text-[#f2efe6] transition-colors cursor-pointer"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-sans text-[14.5px] font-semibold text-[#16130a] transition-all duration-200 cursor-pointer hover:-translate-y-px"
            style={{
              background: 'var(--sp-gold)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -6px rgba(201,162,39,0.5)',
            }}
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-[#f2efe6] hover:text-[var(--sp-gold)] bg-white/[0.03] border border-white/10"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[64px] bg-black/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-1 font-sans text-[15px] text-[#f2efe6]">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="text-left py-3 hover:text-[var(--sp-gold)] border-b border-white/5"
            >
              {link.label}
            </button>
          ))}

          <div className="flex flex-col gap-3 pt-5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg border border-white/15 text-center text-[#f2efe6]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg text-center font-semibold text-[#16130a]"
              style={{ background: 'var(--sp-gold)' }}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
