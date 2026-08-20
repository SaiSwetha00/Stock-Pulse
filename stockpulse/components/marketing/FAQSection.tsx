'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FAQItem } from './landingTypes'
import { ChevronDown, HelpCircle } from 'lucide-react'

export default function FAQSection() {
  const [openId, setOpenId] = useState<string>('faq-1')

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'What hardware do we need to install?',
      answer:
        'None. There are no tags, sensors or probes to fit — Stock Pulse runs in a web browser on whatever you already have, whether that is the office computer or a phone behind the counter. Setting up means entering your stock, which you can do by hand or by importing a spreadsheet.',
      category: 'Hardware & Scanning',
    },
    {
      id: 'faq-2',
      question: 'Does it connect to our existing till or accounting software?',
      answer:
        'Not yet. There are no POS or accounting integrations today, and we would rather tell you that up front than have you find out after signing up. Sales are entered in Stock Pulse itself, and you can export any list to CSV to take into a spreadsheet or send to your accountant.',
      category: 'General',
    },
    {
      id: 'faq-3',
      question: 'What happens if our internet connection drops?',
      answer:
        'Stock Pulse needs a connection to work — there is no offline mode. If the line goes down you will not be able to record sales or check stock until it is back, so if your connection is unreliable, keep a paper fallback for the till and enter the day when you are back online.',
      category: 'Security',
    },
    {
      id: 'faq-4',
      question: 'Does StockPulse predict when produce will spoil?',
      answer:
        'No — and we would rather say so than imply otherwise. There is no camera, no sensor and no prediction model. What StockPulse does is simpler and it works: you record an expiry date against a perishable line, you choose how much warning you want (one day up to a month), and those items surface on your dashboard while there is still time to move them. The judgement about the produce stays yours.',
      category: 'General',
    },
    {
      id: 'faq-5',
      question: 'What does it cost?',
      answer:
        'Nothing. Stock Pulse is free to use — there is no trial to run out, no card to enter and no tier to upgrade to. There is also no hardware to send back, because there is none to begin with.',
      category: 'Pricing',
    },
  ]

  return (
    <section id="faq" className="relative py-32 sp-band-night overflow-hidden perspective-1500">
      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: -12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-gold)] mb-5 px-3 py-1 rounded-full bg-[var(--sp-surface-card)] border border-border">
            <HelpCircle className="w-3.5 h-3.5" /> FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="font-sans font-medium text-3xl sm:text-4xl text-foreground tracking-normal mb-7">
            Everything You Need to Know About Stock Pulse
          </h2>
        </motion.div>

        {/* Accordions with 3D animation */}
        <div className="space-y-5 preserve-3d">
          {faqs.map((faq, idx) => {
            const isOpen = openId === faq.id
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ translateZ: 10 }}
                className={`glass-card rounded-2xl border transition-all duration-300 overflow-hidden preserve-3d ${
                  isOpen ? 'border-[var(--sp-gold)]/60 bg-[var(--sp-surface-card)]/90 shadow-[0_10px_30px_rgba(201,162,39,0.15)]' : 'border-border bg-[var(--sp-surface-alt)]/60'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? '' : faq.id)}
                  className="w-full p-7 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-sans font-medium text-base sm:text-lg text-foreground">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-background border border-[var(--sp-gold)]/30 flex items-center justify-center text-[var(--sp-gold)] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[var(--sp-gold)] text-accent-ink' : ''
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
                      className="px-7 pb-7 text-muted-strong text-sm leading-relaxed border-t border-border pt-5"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
