'use client'

import './landing.css'
import { outfit, plusJakartaSans, cinzelDecorative, cinzel, jetbrainsMono } from './fonts'
import ShaderBackground from './ShaderBackground'
import CustomCursor from './CustomCursor'
import LandingNav from './LandingNav'
import HeroSection from './HeroSection'
import TrustedByStats from './TrustedByStats'
import FeaturesSection from './FeaturesSection'
import LandingDashboardPreview from './LandingDashboardPreview'
import HowItWorksSection from './HowItWorksSection'
import BenefitsSection from './BenefitsSection'
import TestimonialsSection from './TestimonialsSection'
import PricingPreviewSection from './PricingPreviewSection'
import FAQSection from './FAQSection'
import FinalCTASection from './FinalCTASection'
import Footer from './Footer'

/**
 * Document-level styling for the landing page, ported from the root Vite
 * prototype's index.html (`<html class="dark">`, body background #10131b).
 * Scoped the same way the design this replaces scoped its own background:
 * this <style> lives inside the landing tree, so React removes it on
 * navigation and the app's own light/dark surface returns underneath.
 */
const PAGE_STYLES = `
html, body {
  background-color: #000000;
  color-scheme: dark;
}
`

const FONT_VARIABLES = `${outfit.variable} ${plusJakartaSans.variable} ${cinzelDecorative.variable} ${cinzel.variable} ${jetbrainsMono.variable}`

export default function Landing() {
  return (
    <div className={`sp-landing ${FONT_VARIABLES} min-h-screen bg-black text-[#e0e2ed] relative font-sans selection:bg-[var(--sp-gold)] selection:text-black`}>
      {/* Rendered verbatim — fixed literal above, nothing from user input. */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* Background WebGL Shader & Film Grain */}
      <ShaderBackground />

      {/* Custom Mouse Cursor */}
      <CustomCursor />

      {/* Modular Navbar */}
      <LandingNav />

      {/* Main Landing Page Content */}
      <main>
        <HeroSection />
        <TrustedByStats />
        <FeaturesSection />
        <LandingDashboardPreview />
        <HowItWorksSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingPreviewSection />
        <FAQSection />
        <FinalCTASection />
      </main>

      {/* Modular Footer */}
      <Footer />
    </div>
  )
}
