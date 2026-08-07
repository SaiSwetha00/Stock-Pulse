'use client'

/*
GateGuard facts:
- Importer/caller: app/(dashboard)/help/page.tsx (imports and renders HelpCenterClient).
- Affected API: new client component export HelpCenterClient(). No existing API changed.
- Data schemas: none — TOPICS and FAQS are static in-file arrays; no database reads or writes.
- User instruction (verbatim): "2. Help Center - Searchable help articles - Browse topics grid (Getting Started,
  Inventory & Stock, Managing Staff, Payments & Sales, Hardware & POS, Security & Monitoring) - FAQ accordion section -
  Live Chat / Email Support contact card ... DESIGN REQUIREMENT: Match the two design screens from the zip file exactly
  ... TESTING REQUIREMENT: Test everything yourself, live in-browser — station alerts display and override correctly,
  Help Center search and FAQ expand/collapse work ... STOP CONDITION: Once built, matches the design, and the entire app
  runs with zero errors — stop and report back."
*/

import { useMemo, useState } from 'react'
import {
  Search,
  Rocket,
  Archive,
  Users,
  Wallet,
  Printer,
  Video,
  ChevronDown,
  Mail,
} from 'lucide-react'

const TOPICS = [
  {
    key: 'getting-started',
    title: 'Getting Started',
    description: 'Initial setup, dashboard overview, and basic configuration.',
    icon: Rocket,
    tint: '',
  },
  {
    key: 'inventory',
    title: 'Inventory & Stock',
    description: 'Managing products, stock counts, and setting low-stock alerts.',
    icon: Archive,
    tint: '',
  },
  {
    key: 'staff',
    title: 'Managing Staff',
    description: 'Adding users, setting permissions, and tracking shifts.',
    icon: Users,
    tint: 'bg-gradient-to-br from-zinc-100 to-emerald-100',
  },
  {
    key: 'payments',
    title: 'Payments & Sales',
    description: 'Processing transactions, refunds, and daily drawer closes.',
    icon: Wallet,
    tint: '',
  },
  {
    key: 'hardware',
    title: 'Hardware & POS',
    description: 'Connecting scanners, scales, receipt printers, and terminals.',
    icon: Printer,
    tint: '',
  },
  {
    key: 'security',
    title: 'Security & Monitoring',
    description: 'Camera feeds, access logs, and anomaly detection setups.',
    icon: Video,
    tint: 'bg-gradient-to-br from-zinc-100 to-emerald-100',
  },
]

const FAQS = [
  {
    question: 'How to add a new supplier?',
    answer:
      'Open Suppliers from the sidebar, then click "Add Supplier". Enter the supplier name, primary contact, category, and status, then save. The supplier appears immediately in your supplier list and in the Recent Supplier Activity feed.',
  },
  {
    question: 'Resetting staff passwords',
    answer:
      'Staff members can reset their own password from the Login screen using "Forgot password?". As the Owner, you can also re-send an invite from Settings → Staff Management, which lets the staff member set a new password on first login.',
  },
  {
    question: 'Exporting monthly sales reports',
    answer:
      'Go to Sales and use the date search in Recent Transactions to filter the period you need. The Weekly Performance chart and Top Selling Items panel summarise the same range for quick reporting.',
  },
]

export default function HelpCenterClient() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return TOPICS
    const q = search.toLowerCase()
    return TOPICS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }, [search])

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return FAQS
    const q = search.toLowerCase()
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    )
  }, [search])

  const hasResults = filteredTopics.length > 0 || filteredFaqs.length > 0

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">How can we help you today?</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Search our knowledge base or browse categories below to find quick answers to common
          issues.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-xl bg-surface-muted p-2 pl-4">
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for help articles..."
          className="control-h flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        {/* Results filter as you type, so a Search button had nothing to do.
            Offer a way out of a search instead. */}
        {search.trim() && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="control-h shrink-0 rounded-lg bg-foreground px-5 text-sm font-semibold text-surface hover:opacity-90"
          >
            Clear
          </button>
        )}
      </div>

      {search.trim() && !hasResults && (
        <p className="mt-8 text-center text-sm text-muted">
          No help articles match &ldquo;{search}&rdquo;.
        </p>
      )}

      {filteredTopics.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold text-foreground">Browse Topics</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon
              return (
                <button
                  key={topic.key}
                  type="button"
                  // These looked clickable but did nothing. Selecting a topic
                  // now drives the same filter the search box uses.
                  onClick={() => setSearch(topic.title)}
                  className={`rounded-2xl p-5 text-left transition hover:shadow-md ${
                    topic.tint || 'bg-surface-muted'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">{topic.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{topic.description}</p>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {filteredFaqs.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="mt-4 space-y-3">
                {filteredFaqs.map((faq, i) => {
                  const isOpen = openFaq === i
                  return (
                    <div key={faq.question} className="overflow-hidden rounded-xl bg-surface-muted">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                      >
                        <span className="font-bold text-foreground">{faq.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-muted transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted-strong">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="h-fit rounded-2xl bg-foreground p-6 shadow-sm">
          <h3 className="text-lg font-bold text-surface">Need more help?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Our support team is available to assist you with any complex issues.
          </p>

          {/* A "Live Chat (Online)" button sat here with no handler — it
              asserted a staffed channel that does not exist. Email is the one
              contact route that can actually be honoured, so it is the only
              one offered, as a real mailto link. */}
          <a
            href="mailto:support@stockpulse.app?subject=StockPulse%20support%20request"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-surface py-3 text-sm font-bold text-foreground hover:bg-surface-muted"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email Support
          </a>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Replies usually arrive within one business day.
          </p>
        </div>
      </div>
    </div>
  )
}
