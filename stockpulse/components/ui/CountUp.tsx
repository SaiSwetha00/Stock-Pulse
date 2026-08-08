'use client'

import { useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/format'

/**
 * A number that counts up to its value when it first scrolls into view.
 *
 * Deliberately not CSS-only. Everything else in the depth-and-motion pass is
 * pure CSS, and a pure-CSS counter is possible (`@property` on an integer plus
 * `counter()`), but it can only render a bare integer — it cannot produce
 * "$12,480.50", which is what most figures on this dashboard are. The formatter
 * has to run per frame, so the frame loop has to be ours.
 *
 * What it keeps from the CSS approach: no library, nothing added to the shared
 * bundle, one rAF loop per figure that stops the moment it lands, and a
 * reduced-motion path that never starts a loop at all.
 *
 * IntersectionObserver rather than a mount effect, because the lower stat bands
 * are below the fold on a phone — counting them while off-screen means the user
 * scrolls down to a number that has already finished moving, which is worse
 * than no animation.
 *
 * **The rendered output is the final value**, and the animation is a DOM write
 * on top of it. That ordering is the whole safety argument: the server renders
 * the real figure, hydration matches it, and if the effect never runs — no JS,
 * reduced motion, an old browser, a thrown error — the correct number is
 * already on screen. Holding the in-flight number in state would instead mean
 * the first paint shows a zero, and a stalled loop would leave it there.
 */

/**
 * `format` is a NAME, not a function, and that is load-bearing.
 *
 * DashboardView — the only caller — is a Server Component, and a function
 * cannot cross the server/client boundary: React throws "Functions cannot be
 * passed directly to Client Components". Passing `format={formatCurrency}`
 * type-checked, linted and built completely clean, and then crashed the
 * dashboard at request time, where it showed as a page stuck on its loading
 * skeleton. A string prop is serialisable, so the boundary cannot be crossed
 * wrongly in the first place.
 */
type Format = 'currency' | 'integer'

const FORMATTERS: Record<Format, (n: number) => string> = {
  currency: formatCurrency,
  integer: (n) => Math.round(n).toLocaleString(),
}

export default function CountUp({
  value,
  format = 'integer',
  duration = 600,
  className,
}: {
  value: number
  format?: Format
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const finalText = FORMATTERS[format](value)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Asked for no motion: leave the rendered value exactly as it is. Never a
    // zero, never a spinner.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const write = FORMATTERS[format]
    let frame = 0
    let start = 0

    const step = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic — fast first, settling at the end. A linear count reads
      // as a loading spinner rather than a figure arriving. t reaches exactly
      // 1 on the final frame, so it lands on the true value, not on an eased
      // approximation of it.
      node.textContent = write(value * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    // On mount, once per page load — not on scroll into view. The KPI row is
    // the first thing above the fold, so an IntersectionObserver fired on the
    // same frame anyway while adding a reason for the count to re-trigger
    // later.
    node.textContent = write(0)
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      // A value that changed mid-count (an auto-refresh landing) must not be
      // left showing a half-counted figure from the previous total.
      node.textContent = write(value)
    }
  }, [value, duration, format])

  return (
    <span
      ref={ref}
      // Reserves the final width up front, which is what keeps CLS at 0.
      // Counting starts at "$0.00" and ends at "$12,480.50"; with no floor the
      // text node grows as digits arrive and drags its siblings with it. `ch`
      // is exact here because .sp-kpi sets tabular-nums, so every digit is
      // one ch wide.
      style={{ display: 'inline-block', minWidth: `${finalText.length}ch` }}
      className={className}
    >
      {finalText}
    </span>
  )
}
