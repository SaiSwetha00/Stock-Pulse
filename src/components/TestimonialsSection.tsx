import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TestimonialItem } from '../types';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials: TestimonialItem[] = [
    {
      id: 't1',
      name: 'Dr. Aris Thorne',
      role: 'Principal AI Supply Chain Researcher',
      company: 'MIT Retail Automation Labs',
      location: 'Cambridge, MA',
      avatarUrl:
        '',
      rating: 5,
      quote:
        'Our empirical research study across 48 regional grocery stores demonstrated that Stock Pulse’s predictive optical telemetry reduced perishable spoilage by 41.8% while maintaining 99.98% shelf availability across high-turnover produce and dairy SKUs.',
      metrics: 'Validated 41.8% Spoilage Reduction in Research Study',
    },
    {
      id: 't2',
      name: 'Dr. Marcus Vance',
      role: 'Lead Food Logistics Scientist',
      company: 'Global Cold-Chain Systems Institute',
      location: 'London, UK',
      avatarUrl:
        '',
      rating: 5,
      quote:
        'The cold-chain probe telemetry and micro-climate shelf mapping are extraordinarily precise. Real-time temperature and ethylene sensors prevent inventory loss hours before visual decay can even begin.',
      metrics: 'Prevented £90,000 Perishable Inventory Spoilage',
    },
    {
      id: 't3',
      name: 'Elena Rostova',
      role: 'Chief Product Officer & Operations Director',
      company: 'Artisan Grocery Tech Consortium',
      location: 'Tokyo, Japan',
      avatarUrl:
        '',
      rating: 5,
      quote:
        'Stock Pulse gives our operations team real-time cryptographic audit precision across our retail floor and cold vaults. It is the definitive technology standard for high-turnover modern food retail.',
      metrics: '99.98% Inventory Ledger Accuracy',
    },
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[activeIndex];

  return (
    <section id="testimonials" className="relative py-28 bg-[#10131b] overflow-hidden perspective-1500">
      {/* Background flare */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#edc155]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4 px-3 py-1 rounded-full bg-[#1d2027] border border-[#edc155]/30">
            VERIFIED OPERATOR REVIEWS
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#e0e2ed] tracking-tight mb-6">
            Trusted by the World’s Premier Grocers
          </h2>
        </motion.div>

        {/* Featured Large Testimonial Card with 3D Rotate */}
        <div className="max-w-4xl mx-auto preserve-3d">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, rotateY: 20, scale: 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -20, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              whileHover={{ translateZ: 15 }}
              className="glass-card p-8 sm:p-12 rounded-2xl border border-[#edc155]/30 relative overflow-hidden bg-gradient-to-br from-[#1d2027]/90 to-[#10131b]/95 shadow-2xl preserve-3d animate-3d-glow"
            >
              <Quote className="absolute top-8 right-8 w-16 h-16 text-[#edc155]/10" />

              <div className="flex items-center gap-1 mb-6">
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#edc155] fill-[#edc155]" />
                ))}
              </div>

              <p className="font-display italic text-xl sm:text-2xl text-[#e0e2ed] leading-relaxed mb-8">
                "{current.quote}"
              </p>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={current.avatarUrl}
                    alt={current.name}
                    className="w-14 h-14 rounded-full border-2 border-[#edc155]/50 object-cover shadow-lg"
                  />
                  <div>
                    <div className="font-display font-bold text-lg text-[#e0e2ed]">
                      {current.name}
                    </div>
                    <div className="font-mono text-xs text-[#d1c5b0]">
                      {current.role} • <span className="text-[#edc155]">{current.company}</span> ({current.location})
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-[#10131b] border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2 w-fit">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {current.metrics}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls & Pagination Dots */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'w-8 bg-[#edc155]' : 'w-2 bg-[#d1c5b0]/30'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-xl bg-[#1d2027] border border-[#4e4636] hover:border-[#edc155] text-[#e0e2ed] hover:text-[#edc155] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Previous Testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-xl bg-[#1d2027] border border-[#4e4636] hover:border-[#edc155] text-[#e0e2ed] hover:text-[#edc155] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Next Testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
