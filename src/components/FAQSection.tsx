import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQItem } from '../types';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string>('faq-1');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How long does physical hardware deployment take in a retail store?',
      answer:
        'Most boutique markets deploy Stock Pulse within 45 minutes. Our optical tags and ambient cold-chain probes connect directly over standard encrypted Wi-Fi or cellular IoT. No structural wiring or store downtime is required.',
      category: 'Hardware & Scanning',
    },
    {
      id: 'faq-2',
      question: 'Can Stock Pulse integrate with our existing POS and ERP software?',
      answer:
        'Yes. Stock Pulse features bi-directional API connectors for Toast, Square Retail, Lightspeed, SAP, Oracle NetSuite, and NCR Emerald. Transaction data syncs in real-time.',
      category: 'General',
    },
    {
      id: 'faq-3',
      question: 'What happens if our store internet connection drops?',
      answer:
        'Stock Pulse edge nodes maintain an offline encrypted SQLite buffer. All shelf telemetry, temperature probes, and scanning events continue logging seamlessly and auto-reconcile with the cloud once connectivity resumes.',
      category: 'Security',
    },
    {
      id: 'faq-4',
      question: 'How accurate is the AI produce spoilage prediction model?',
      answer:
        'Our computer vision and ethylene models achieve 94.2% predictive accuracy across fruits, vegetables, and floral perishables, giving store operators up to 72 hours of advanced warning before visible decay.',
      category: 'General',
    },
    {
      id: 'faq-5',
      question: 'Is there a free trial period for new store locations?',
      answer:
        'Yes. We offer a 14-day risk-free pilot program including pre-configured starter hardware for up to 500 SKUs. If you don’t measure a reduction in spoilage, return the hardware with zero obligation.',
      category: 'Pricing',
    },
  ];

  return (
    <section id="faq" className="relative py-28 bg-[#10131b] overflow-hidden perspective-1500">
      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#edc155] mb-4 px-3 py-1 rounded-full bg-[#1d2027] border border-[#edc155]/30">
            <HelpCircle className="w-3.5 h-3.5" /> FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="font-sans font-medium text-3xl sm:text-4xl text-[#e0e2ed] tracking-normal mb-6">
            Everything You Need to Know About Stock Pulse
          </h2>
        </motion.div>

        {/* Accordions with 3D animation */}
        <div className="space-y-4 preserve-3d">
          {faqs.map((faq, idx) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ translateZ: 10 }}
                className={`glass-card rounded-2xl border transition-all duration-300 overflow-hidden preserve-3d ${
                  isOpen ? 'border-[#edc155]/60 bg-[#1d2027]/90 shadow-[0_10px_30px_rgba(237,193,85,0.15)]' : 'border-white/10 bg-[#181b23]/60'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? '' : faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-sans font-medium text-base sm:text-lg text-[#e0e2ed]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-[#10131b] border border-[#edc155]/30 flex items-center justify-center text-[#edc155] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#edc155] text-[#10131b]' : ''
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-[#d1c5b0] text-sm leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
