import React, { useState } from 'react';
import { PageView } from './types';
import { CustomCursor } from './components/CustomCursor';
import { ShaderBackground } from './components/ShaderBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TrustedByStats } from './components/TrustedByStats';
import { FeaturesSection } from './components/FeaturesSection';
import { DashboardPreview } from './components/DashboardPreview';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BenefitsSection } from './components/BenefitsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { PricingPreviewSection } from './components/PricingPreviewSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DemoVideoModal } from './components/DemoVideoModal';
import { FullDashboardView } from './components/FullDashboardView';

export default function App() {
  const [activePage, setActivePage] = useState<PageView>('landing');
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleNavigate = (page: PageView) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (activePage === 'login') {
    return <AuthModal initialMode="login" onNavigate={handleNavigate} />;
  }

  if (activePage === 'signup') {
    return <AuthModal initialMode="signup" onNavigate={handleNavigate} />;
  }

  if (activePage === 'dashboard') {
    return <FullDashboardView onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e0e2ed] relative font-sans selection:bg-[#edc155] selection:text-[#10131b]">
      {/* Background WebGL Shader & Film Grain */}
      <ShaderBackground />

      {/* Custom Mouse Cursor */}
      <CustomCursor />

      {/* Modular Navbar */}
      <Navbar
        onNavigate={handleNavigate}
        activePage={activePage}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      {/* Main Landing Page Content */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection
          onNavigate={handleNavigate}
          onOpenDemo={() => setIsDemoOpen(true)}
        />

        {/* 2. Trusted By & Statistics */}
        <TrustedByStats />

        {/* 3. Features Bento Grid */}
        <FeaturesSection />

        {/* 4. Dashboard Interactive Preview */}
        <DashboardPreview onNavigate={handleNavigate} />

        {/* 5. How It Works Workflow */}
        <HowItWorksSection />

        {/* 6. Benefits & ROI Calculator */}
        <BenefitsSection />

        {/* 7. Operator Testimonials */}
        <TestimonialsSection />

        {/* 8. Pricing Preview */}
        <PricingPreviewSection onNavigate={handleNavigate} />

        {/* 9. FAQ Accordion */}
        <FAQSection />

        {/* 10. Final CTA Banner */}
        <FinalCTASection onNavigate={handleNavigate} />
      </main>

      {/* Modular Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Demo Video Walkthrough Modal */}
      <DemoVideoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
}
