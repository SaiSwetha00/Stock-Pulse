'use client'

import { useSyncExternalStore } from 'react'

/**
 * The first thing on the dashboard: who you are, what time it is, and whether
 * anything needs you.
 *
 * The page used to open straight into stat cards, which meant the answer to
 * "is anything wrong?" required reading four numbers and remembering what each
 * threshold was. This says it in a sentence.
 */

/**
 * The greeting depends on the reader's clock, which the server cannot know.
 * useSyncExternalStore with an explicit server snapshot is how to read a
 * browser-only value without the two disagreeing at hydration: the server
 * renders the neutral "Welcome back" and the client corrects it in the same
 * commit rather than flashing.
 *
 * Nothing to subscribe to — the greeting does not need to flip live at noon.
 */
function subscribeNever(): () => void {
  return () => {}
}

function localGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** First word of the stored name. Falls back to the whole string rather than
 *  an empty greeting if someone registered a single-word name. */
function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim()
}

/**
 * The live line. Written as a sentence a person would say rather than a
 * dashboard label — and it says "Everything's in order" instead of showing two
 * zeroes, because a zero still reads as something you have to check.
 */
function contextLine(lowStock: number, busyCounters: number, totalCounters: number): string {
  const parts: string[] = []
  if (lowStock > 0) parts.push(`${lowStock} item${lowStock === 1 ? '' : 's'} low on stock`)
  // "pending" implied queued work; this counts counters that are not free.
  // With no counters configured there is nothing to say, so say nothing.
  if (totalCounters > 0 && busyCounters > 0)
    parts.push(`${busyCounters} of ${totalCounters} counters busy`)
  if (parts.length === 0) return 'Everything’s in order.'
  return parts.join(' · ')
}

export default function Greeting({
  fullName,
  lowStockCount,
  pendingCount,
  counterCount,
}: {
  fullName: string
  lowStockCount: number
  pendingCount: number
  /** Total configured counters. 0 means none, and the clause is dropped. */
  counterCount: number
}) {
  const greeting = useSyncExternalStore(subscribeNever, localGreeting, () => 'Welcome back')
  const needsAttention = lowStockCount > 0 || (counterCount > 0 && pendingCount > 0)

  return (
    <div className="mb-6 flex items-center justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="sp-title">
          {greeting}, {firstNameOf(fullName)}
        </h1>
        <p className="sp-body mt-1.5">
          {needsAttention ? (
            <span className="font-medium text-foreground">
              {contextLine(lowStockCount, pendingCount, counterCount)}
            </span>
          ) : (
            contextLine(lowStockCount, pendingCount, counterCount)
          )}
        </p>
      </div>

      <PulseMark active={needsAttention} />
    </div>
  )
}

/**
 * The small looping visual.
 *
 * Hand-written inline SVG driven by CSS keyframes — no Lottie, no runtime
 * library, nothing added to any bundle beyond this markup. Well under a
 * kilobyte, two orders of magnitude inside the 30KB ceiling, and it ships in
 * the dashboard route's own chunk because nothing else imports it, so the
 * shared bundle is untouched.
 *
 * A pulse line, echoing the product's name. It leans amber and beats faster
 * when something needs attention, so the movement carries meaning rather than
 * being decoration that happens to animate.
 *
 * Every animated element is `motion-safe:`. Under reduced motion the whole
 * thing renders as a static line, which still reads correctly.
 */
function PulseMark({ active }: { active: boolean }) {
  const stroke = active ? 'var(--warning)' : 'var(--success)'
  const duration = active ? '1.6s' : '2.8s'

  return (
    <div
      aria-hidden="true"
      className="hidden h-14 w-24 shrink-0 items-center justify-center rounded-xl bg-surface-muted sm:flex"
    >
      <svg viewBox="0 0 96 40" className="h-9 w-20" fill="none" role="presentation">
        <path
          d="M2 20 H26 L32 8 L40 32 L48 14 L54 20 H94"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          strokeDasharray="100"
          className="sp-trace"
          style={{ animationDuration: duration }}
        />
        <circle cx="94" cy="20" r="2.5" fill={stroke} className="sp-blip" style={{ animationDuration: duration }} />
      </svg>
    </div>
  )
}
