'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

/**
 * The hero shelf, and the gate in front of it.
 *
 * WHY THIS FILE EXISTS. `ThreeGroceryVisual` is a three.js WebGL scene, and
 * until now it was imported directly and started its requestAnimationFrame
 * loop for every visitor unconditionally — no reduced-motion check, no Data
 * Saver check, no core-count check, and no static version to fall back to.
 * The dashboard's `CrateMark` had all of that; the landing hero, which is far
 * more expensive, had none of it. This closes that gap using CrateMark's
 * pattern rather than inventing a second one.
 *
 * The dynamic import is the other half. `three` is ~150 KB gzipped and was
 * sitting in the landing page's initial JavaScript, which a visitor has to
 * download and parse before the page becomes interactive — for a decoration.
 * With `ssr: false` and a `loading` fallback it moves to its own chunk that is
 * only ever fetched on a machine that opted in, and never before idle.
 */
const ThreeGroceryVisual = dynamic(() => import('./ThreeGroceryVisual'), {
  ssr: false,
  loading: () => <ShelfStatic />,
})

/**
 * Heuristics, not certainties — deliberately biased towards NOT animating.
 * Copied in shape from components/dashboard/CrateMark.tsx so the two agree.
 *
 * Every signal is optional in some browser, so each is checked before it is
 * trusted. Wrong in the cautious direction costs a drawing nobody notices;
 * wrong the other way spends a cheap phone's battery, and its data allowance,
 * on a hero decoration.
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

  // WebGL itself can be absent or blocked. Asking is cheap; a scene that
  // silently renders nothing is not.
  try {
    const c = document.createElement('canvas')
    if (!c.getContext('webgl2') && !c.getContext('webgl')) return true
  } catch {
    return true
  }

  return false
}

/**
 * The resting state, and the DEFAULT — not a placeholder that flashes.
 *
 * Inline SVG: no image, no request, nothing to load. It draws the same three
 * decks and the same product language as the WebGL scene — bottles and a jar
 * up top, open produce crates in the middle, cartons and a sack below — so
 * the swap changes fidelity, not subject.
 *
 * `viewBox` plus `w-full h-full` means it scales to whatever box it is given
 * and reserves exactly the space the canvas will, which is why CLS cannot move
 * when the two exchange places.
 */
function ShelfStatic() {
  const gold = '#c9a227'
  const goldDim = '#8a6206'
  const cream = '#d6c3a3'
  const red = '#8f2a1c'
  const coffee = '#4a3524'
  const rail = '#e0b343'

  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 320 300" className="h-full w-full max-h-[520px]" role="presentation">
        {/* Uprights */}
        <rect x="26" y="18" width="6" height="264" rx="3" fill="#1a1d24" />
        <rect x="288" y="18" width="6" height="264" rx="3" fill="#1a1d24" />

        {[70, 155, 240].map((y) => (
          <g key={y}>
            {/* Deck plus brass front rail, drawn as a shallow parallelogram so
                the static state carries the same viewing angle as the scene. */}
            <path d={`M30 ${y} L290 ${y - 8} L290 ${y + 2} L30 ${y + 10} Z`} fill="#2a2118" />
            <path d={`M30 ${y + 10} L290 ${y + 2} L290 ${y + 6} L30 ${y + 14} Z`} fill={rail} opacity="0.75" />
          </g>
        ))}

        {/* Top shelf — two bottles and a jar */}
        <g>
          <rect x="62" y="30" width="20" height="34" rx="4" fill={goldDim} />
          <rect x="68" y="20" width="8" height="12" fill={goldDim} />
          <rect x="66" y="16" width="12" height="6" rx="2" fill={rail} />
          <rect x="62" y="44" width="20" height="9" fill={cream} opacity="0.85" />

          <rect x="96" y="34" width="18" height="30" rx="4" fill={goldDim} />
          <rect x="101" y="25" width="8" height="10" fill={goldDim} />
          <rect x="99" y="21" width="12" height="6" rx="2" fill={rail} />

          <rect x="196" y="36" width="30" height="28" rx="4" fill={red} />
          <rect x="193" y="27" width="36" height="10" rx="3" fill={rail} />
        </g>

        {/* Middle shelf — two open produce crates */}
        <g>
          <rect x="58" y="126" width="76" height="24" rx="3" fill={coffee} />
          <rect x="58" y="126" width="76" height="5" fill="#5c4530" />
          <circle cx="74" cy="122" r="9" fill={red} />
          <circle cx="94" cy="120" r="9" fill={red} />
          <path d="M110 122 l4 -20 l4 20 z" fill={goldDim} />
          <path d="M116 122 l6 -18 l2 18 z" fill={goldDim} />

          <rect x="186" y="126" width="76" height="24" rx="3" fill={coffee} />
          <rect x="186" y="126" width="76" height="5" fill="#5c4530" />
          <ellipse cx="202" cy="121" rx="10" ry="8" fill="#e3b341" />
          <ellipse cx="224" cy="122" rx="10" ry="8" fill="#e3b341" />
          <path d="M236 126 l22 -6 l1 5 l-22 6 z" fill={gold} />
        </g>

        {/* Bottom shelf — cartons and a sack */}
        <g>
          <rect x="60" y="196" width="32" height="44" fill={cream} />
          <path d="M60 196 l16 -16 l16 16 z" fill={red} />
          <rect x="100" y="202" width="28" height="38" fill={cream} />
          <path d="M100 202 l14 -13 l14 13 z" fill={red} />

          <path d="M196 240 L206 196 L232 196 L242 240 Z" fill={cream} />
          <rect x="204" y="190" width="30" height="8" rx="3" fill={rail} />
          <rect x="198" y="216" width="42" height="7" fill={coffee} opacity="0.7" />
        </g>
      </svg>
    </div>
  )
}

export default function HeroShelf({ interactive = true }: { interactive?: boolean }) {
  const [rich, setRich] = useState(false)

  useEffect(() => {
    if (prefersLessWork()) return

    // requestIdleCallback is the LCP guarantee: the browser tells us when it
    // has finished the work that matters. Safari still lacks it, so there is a
    // timeout long enough to land after paint either way.
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

  // The fixed box. Both states fill it exactly, so the swap is invisible to
  // layout and CLS cannot move.
  return (
    <div className="relative h-full w-full">
      {rich ? <ThreeGroceryVisual interactive={interactive} /> : <ShelfStatic />}
    </div>
  )
}
