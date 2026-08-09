'use client'

import CrateMark from './CrateMark'

/**
 * The first thing on the dashboard: who you are, what time it is, and whether
 * anything needs you.
 *
 * The page used to open straight into stat cards, which meant the answer to
 * "is anything wrong?" required reading four numbers and remembering what each
 * threshold was. This says it in a sentence.
 */

/**
 * THE GREETING IS NOW A PROP, COMPUTED ON THE SERVER.
 *
 * It used to be read from the browser's clock via `useSyncExternalStore`, with
 * the server rendering a neutral "Welcome back" and the client correcting it.
 * That was a reasonable answer to "the server does not know the reader's
 * timezone", and it cost more than it looked:
 *
 *   - the rewrite made this `<h1>` — the dashboard's largest text element — a
 *     fresh LCP candidate at 5440ms on a 4x-throttled phone (Phase 7B);
 *   - the same rewrite wrapped the heading at 390 and moved the whole page
 *     down 31px, measured at CLS 0.21 (Phase 7A).
 *
 * `storeGreeting()` reads `STORE_TIMEZONE`, the clock every other date in this
 * app already uses. The string is final at first paint, so there is nothing to
 * correct, nothing to re-measure and nothing to shift.
 *
 * The 7A fix — the name on its own line below `sm` — is kept. It costs
 * nothing, it still reads better on a phone, and it means a future change to
 * the greeting string cannot reintroduce the wrap.
 */

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
  greeting,
  fullName,
  lowStockCount,
  pendingCount,
  counterCount,
}: {
  /** "Good morning" / "Good afternoon" / "Good evening", already resolved on
   *  the shop's clock by `storeGreeting()`. */
  greeting: string
  fullName: string
  lowStockCount: number
  pendingCount: number
  /** Total configured counters. 0 means none, and the clause is dropped. */
  counterCount: number
}) {
  const needsAttention = lowStockCount > 0 || (counterCount > 0 && pendingCount > 0)

  return (
    <div className="mb-6 flex items-center justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        {/* The name is on its own line below `sm`, and that is a CLS fix, not
            a typographic preference.

            The greeting is server-rendered as "Welcome back" and corrected to
            "Good afternoon" at hydration, because only the browser knows the
            reader's clock. At 1440 that just makes the line 48px wider. At 390
            it made the heading WRAP TO A SECOND LINE, so the stat tiles, the
            date row, "Quick Actions" and the quick-action grid all moved down
            31px after first paint — measured at CLS 0.21, four times the 0.05
            budget, on the page people open first.

            Forcing the name onto its own line below `sm` makes the heading two
            lines whatever the greeting says, so the correction can change the
            words without changing the geometry. Reserving a min-height would
            have worked too and would have left a gap under every short name.

            The harness had been reporting CLS 0 here for several phases: its
            observer attaches after navigation and intermittently missed the
            correction. cls-probe.js installs one before document start. */}
        <h1 className="sp-title">
          {greeting},{' '}
          <span className="block sm:inline">{firstNameOf(fullName)}</span>
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

      {/* Fixed-size cluster, hidden below sm. Both marks declare their own box,
          so neither can move the greeting text however long it takes to paint. */}
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        <ShopFigure active={needsAttention} />
        <CrateMark />
      </div>
    </div>
  )
}

/**
 * The line-art figure beside the greeting: a shopkeeper at a counter with a
 * crate, under a pulse line.
 *
 * Hand-written inline SVG driven by CSS keyframes — no Lottie, no runtime
 * library, nothing added to any bundle beyond this markup. It ships in the
 * dashboard route's own chunk because nothing else imports it, so the shared
 * bundle is untouched.
 *
 * TWO COLOURS ONLY: coffee (`--border-strong`) draws the scene, gold
 * (`--accent`) draws the pulse. That is D22's rule — gold is the mark, never
 * the ground — and it is the same pairing the four empty-state drawings use,
 * so the figure reads as part of one language rather than a mascot.
 *
 * WHAT REPLACED WHAT, AND WHY IT MATTERS:
 *   This was a bare pulse line coloured `--warning` when something needed
 *   attention and `--success` when it did not. Moving to coffee-and-gold
 *   would have thrown that signal away, so it moved into TEMPO instead: the
 *   loop runs at 1.6s when something needs attention and 2.8s when it does
 *   not. Both are inside the 3s the brief allows. That is also the better
 *   encoding — the old version carried a state in colour alone, which is
 *   exactly the thing a colour-blind reader cannot see, and the sentence to
 *   the left has always said it in words anyway.
 *
 * D18: the resting state is the correct one. `sp-trace` rests at
 * `stroke-dashoffset: 0` — fully drawn — and the keyframes only override it
 * while running, so under `prefers-reduced-motion` this is a complete, static
 * drawing rather than an empty box.
 */
function ShopFigure({ active }: { active: boolean }) {
  const duration = active ? '1.6s' : '2.8s'

  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-28 items-center justify-center rounded-xl bg-surface-muted"
    >
      <svg
        viewBox="0 0 112 64"
        className="h-14 w-24"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="presentation"
      >
        {/* counter */}
        <path d="M12 52h88" />
        <path d="M20 52v5M92 52v5" />
        {/* shopkeeper */}
        <circle cx="38" cy="31" r="6" />
        <path d="M27 52c0-7 5-11 11-11s11 4 11 11" />
        <path d="M48 45l7-5" />
        {/* crate on the counter */}
        <path d="M64 52V39h22v13z" />
        <path d="M64 45h22M75 39v13" />

        {/* The one gold element. */}
        <g stroke="var(--accent)">
          <path
            d="M8 16h18l4-9 6 18 5-9h55"
            strokeWidth="2"
            pathLength={100}
            strokeDasharray="100"
            className="sp-trace"
            style={{ animationDuration: duration }}
          />
          <circle
            cx="96"
            cy="16"
            r="2.5"
            fill="var(--accent)"
            stroke="none"
            className="sp-blip"
            style={{ animationDuration: duration }}
          />
        </g>
      </svg>
    </div>
  )
}
