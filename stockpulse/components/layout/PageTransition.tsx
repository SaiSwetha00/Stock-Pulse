'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Fade-and-rise on every route change.
 *
 * Keyed on the pathname, which is what makes it re-run: without the key React
 * reconciles the new page into the same element and the animation never
 * restarts.
 *
 * Entrance only, deliberately. An exit animation needs the outgoing route to
 * stay mounted while the incoming one renders, and in the App Router that
 * means holding a stale tree over a Server Component that has already
 * streamed — which shows the previous page's data for the length of the
 * animation. A 250ms entrance reads as a transition either way and cannot lie
 * about what is on screen.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
