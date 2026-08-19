'use client'

import './landing.css'
import { outfit, plusJakartaSans, cinzelDecorative, cinzel, jetbrainsMono } from './fonts'
import ShaderBackground from './ShaderBackground'
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
    <div className={`sp-landing ${FONT_VARIABLES} min-h-screen bg-background text-[#e0e2ed] relative font-sans selection:bg-[var(--sp-gold)] selection:text-accent-ink`}>
      {/* Rendered verbatim — fixed literal above, nothing from user input. */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* Background WebGL Shader & Film Grain */}
      <ShaderBackground />

      {/*
        `CustomCursor` used to render here and has been removed.

        It drew TWO marks that followed the pointer: an 8px gold dot at the
        cursor position (z-index 10000) and, trailing it on a 0.15 lerp, a
        32px ring holding a 6px crimson dot. Nothing set `cursor: none`
        anywhere in this project, so those were drawn ON TOP of the visitor's
        own cursor rather than replacing it — three marks in the same spot.

        It was reported as a suspected rendering artifact by someone looking
        at the hero, which is the verdict that matters: a decoration nobody
        can tell apart from a bug is doing the job of a bug. Measured before
        removing, with the pointer on the hero CTA: the gold dot's centre sat
        exactly on the pointer at (636, 533), the ring at z-index 9999.

        It also contradicts the hero it now sits above, which is deliberately
        still. Restoring it is one import and one line, but decide about
        `cursor: none` at the same time.
      */}

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
