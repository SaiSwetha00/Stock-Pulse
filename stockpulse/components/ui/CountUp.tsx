'use client'

import { useEffect, useRef } from 'react'

/**
 * A number that counts up to its value when it first scrolls into view.
 *
 * Deliberately not CSS-only. Everything else in the depth-and-motion pass is
 * pure CSS, and a pure-CSS counter is possible (`@property` on an integer plus
 * `counter()`), but it can only render a bare integer — it cannot produce
 * "₹12,480.50", which is what most figures on this dashboard are. The formatter
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
export default function CountUp({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number
  /** Turns the in-flight number into what the user reads. */
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  // `format` is a dependency rather than a ref, so a caller must pass a stable
  // function — every current one passes a module-level import. An inline arrow
  // would restart the count on each parent render, which is a real bug and one
  // this dependency makes visible instead of hiding behind a ref.
  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Asked for no motion, or a browser without IntersectionObserver: leave
    // the rendered value exactly as it is. Never a zero, never a spinner.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const render = (n: number) => {
      const f = format
      node.textContent = f ? f(n) : Math.round(n).toLocaleString()
    }

    let frame = 0
    let start = 0

    const step = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic — fast first, settling at the end. A linear count reads
      // as a loading spinner rather than a figure arriving.
      render(value * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(step)
      // Landing on `value` itself rather than on the eased approximation is
      // handled by t === 1 giving exactly 1, so the final frame is exact.
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        // Once only. Re-running on every scroll back would make the dashboard
        // twitch each time someone scrolled up.
        observer.disconnect()
        render(0)
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.2 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      // A value that changed mid-count (an auto-refresh landing) must not be
      // left showing a half-counted figure from the previous total.
      const f = format
      node.textContent = f ? f(value) : Math.round(value).toLocaleString()
    }
  }, [value, duration, format])

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : Math.round(value).toLocaleString()}
    </span>
  )
}
