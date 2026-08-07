import { useReducedMotion } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'

/** Shared easing so every auth animation feels like one system. */
export const EASE = [0.22, 1, 0.36, 1] as const

export const smooth: Transition = { duration: 0.55, ease: EASE }

/** Parent that reveals its children one after another. */
export const stagger = (staggerChildren = 0.07, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/** Fade in while sliding up — the default entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: smooth },
}

/** Fade in with a gentle scale — used for cards and the logo. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: smooth },
}

/** Horizontal slide, used for multi-step transitions. */
export const slideX = (dir: 1 | -1): Variants => ({
  hidden: { opacity: 0, x: 28 * dir },
  show: { opacity: 1, x: 0, transition: smooth },
  exit: { opacity: 0, x: -28 * dir, transition: { duration: 0.28, ease: EASE } },
})

/** Continuous drift for hero illustrations. */
export const float = (distance = 12, duration = 6, delay = 0) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
})

/** Lift on hover, press down on tap. */
export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.2, ease: EASE } },
  whileTap: { y: 0, scale: 0.985 },
}

/** Quicker entrance for rows in a list or grid. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
}

/** Page-level content entrance. */
export const pageIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}

/** Variants with all movement stripped out, for reduced-motion users. */
const still: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01 } } }

/**
 * Returns the given variants, or a motionless equivalent when the user has
 * asked for reduced motion. Opacity is kept so elements still appear.
 *
 * The CSS animations in globals.css are handled by their own media query; this
 * covers the Framer Motion side.
 */
export function useReducedVariants(variants: Variants): Variants {
  const prefersReduced = useReducedMotion()
  return prefersReduced ? still : variants
}
