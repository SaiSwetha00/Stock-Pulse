'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

/**
 * The dashboard's one decorative 3D element, and the gate in front of it.
 *
 * SCOPE — read before extending. Phase 5 approved exactly one 3D element, on
 * the dashboard only. This is it. It is deliberately built to be deleted:
 * remove `Crate3D.tsx` and this file, drop `<CrateMark />` from `Greeting.tsx`,
 * and nothing else in the app references either.
 *
 * NO WEBGL, NO DEPENDENCY. This is CSS `transform-style: preserve-3d` with six
 * bordered faces. three.js was not installed and was not needed — a wireframe
 * crate is six rectangles, and the whole point of the constraint is that a
 * decoration must not cost a rendering library.
 *
 * WHAT LOADS WHEN:
 *   First paint, every device      -> `CrateStatic`, an inline SVG isometric
 *                                     crate. No 3D CSS, no extra request.
 *   After idle, capable devices    -> `Crate3D` arrives as its own chunk and
 *                                     swaps in, carrying its own <style>.
 *   Reduced motion / low power     -> the static drawing, forever. The dynamic
 *                                     import is never even reached.
 *
 * So the decoration cannot block LCP: nothing about it is requested until the
 * browser reports itself idle, and the box it occupies is a fixed 64x64 that
 * the static version fills from the first frame. There is no state in which
 * this element changes the size of anything.
 */

/**
 * `ssr: false` because the decision depends on `navigator`, and rendering one
 * thing on the server and another on the client is a hydration mismatch. The
 * `loading` fallback is the static crate, so the box is never empty mid-swap.
 */
const Crate3D = dynamic(() => import('./Crate3D'), {
  ssr: false,
  loading: () => <CrateStatic />,
})

/**
 * Heuristics, not certainties — deliberately biased towards NOT animating.
 *
 * Every signal here is optional in some browser, so each is checked before it
 * is trusted. Getting this wrong in the cautious direction costs a static
 * drawing nobody notices; getting it wrong the other way spends a cheap
 * phone's battery on a decoration.
 */
function prefersLessWork(): boolean {
  if (typeof window === 'undefined') return true

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }

  // Data Saver is an explicit request to do less. Honour it.
  if (nav.connection?.saveData) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return true
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) return true

  return false
}

export default function CrateMark() {
  const [rich, setRich] = useState(false)

  useEffect(() => {
    if (prefersLessWork()) return

    // requestIdleCallback is the whole LCP guarantee: the browser tells us
    // when it has finished the work that matters. Safari still lacks it, so
    // it falls back to a timeout long enough to be after paint either way.
    const w = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
        cancelIdleCallback?: (id: number) => void
      }

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setRich(true), { timeout: 3000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = window.setTimeout(() => setRich(true), 1200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    // The fixed box. Both states fill it exactly, so the swap is invisible to
    // layout and CLS cannot move.
    <div
      aria-hidden="true"
      className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-muted lg:flex"
    >
      {rich ? <Crate3D /> : <CrateStatic />}
    </div>
  )
}

/**
 * The degraded state, and the default one: a flat isometric crate in the same
 * coffee-and-gold line language as the rest of Phase 5's imagery.
 *
 * "Degrades to a static image" without shipping an image — no binary asset, no
 * remote host, the same rule the Unsplash removal established.
 */
export function CrateStatic() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-11 w-11"
      fill="none"
      stroke="var(--border-strong)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="presentation"
      aria-hidden="true"
    >
      <path d="M32 12l20 10v20L32 52 12 42V22z" />
      <path d="M12 22l20 10 20-10M32 32v20" />
      <path d="M32 12l20 10" stroke="var(--accent)" />
    </svg>
  )
}
