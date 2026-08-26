'use client'


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
  meta,
}: {
  /** "Good morning" / "Good afternoon" / "Good evening", already resolved on
   *  the shop's clock by `storeGreeting()`. */
  greeting: string
  fullName: string
  lowStockCount: number
  pendingCount: number
  /** Total configured counters. 0 means none, and the clause is dropped. */
  counterCount: number
  /** Right-hand header slot: the date and the freshness pill. */
  meta?: React.ReactNode
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

      {/*
        The decorative cluster that used to sit here - a line-art shopkeeper
        figure and a 3D crate - is gone. It carried no information, and beside
        a live "N items low on stock" line it read as an unfinished placeholder
        rather than as art.

        Rather than leave the hole, the freshness row that used to sit BELOW
        this header moves into it: the date and "Updated ..." are the one thing
        a shopkeeper glancing here needs in order to trust the numbers
        underneath, and they balance the greeting instead of pushing it up the
        page. This is the same single AutoRefresh instance, relocated - not a
        second copy.
      */}
      {meta && <div className="hidden shrink-0 items-center gap-3 sm:flex">{meta}</div>}
    </div>
  )
}

