'use client'

import { useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import {
  Apple,
  Boxes,
  Carrot,
  Cherry,
  Egg,
  Grape,
  Leaf,
  Milk,
  Package,
  ScanBarcode,
  ShoppingBag,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react'
import { fadeUp, float, stagger } from '@/lib/motion'

interface AuthHeroProps {
  title: string
  subtitle: string
}

/**
 * `depth` drives the parallax: larger values travel further with the cursor,
 * so nearer objects move more than distant ones.
 */
interface HeroIcon {
  Icon: LucideIcon
  top: string
  left?: string
  right?: string
  size: number
  depth: number
  tint: string
}

const ICONS: HeroIcon[] = [
  // near layer — larger, most movement
  { Icon: ShoppingBasket, top: '16%', left: '11%', size: 46, depth: 34, tint: 'text-accent/35' },
  { Icon: Milk, top: '62%', right: '20%', size: 40, depth: 30, tint: 'text-foreground/20' },
  { Icon: ScanBarcode, top: '78%', left: '16%', size: 38, depth: 28, tint: 'text-accent/30' },
  // mid layer
  { Icon: ShoppingBag, top: '34%', left: '26%', size: 30, depth: 20, tint: 'text-foreground/16' },
  { Icon: Boxes, top: '84%', left: '38%', size: 32, depth: 18, tint: 'text-foreground/16' },
  { Icon: Carrot, top: '46%', right: '11%', size: 30, depth: 22, tint: 'text-warning/35' },
  { Icon: Apple, top: '22%', right: '17%', size: 28, depth: 19, tint: 'text-danger/30' },
  // far layer — smaller, subtle drift
  { Icon: Grape, top: '9%', left: '34%', size: 22, depth: 11, tint: 'text-foreground/12' },
  { Icon: Cherry, top: '70%', left: '6%', size: 22, depth: 10, tint: 'text-danger/22' },
  { Icon: Package, top: '8%', right: '31%', size: 22, depth: 12, tint: 'text-foreground/12' },
  { Icon: Egg, top: '52%', left: '4%', size: 20, depth: 9, tint: 'text-foreground/12' },
  { Icon: Leaf, top: '90%', right: '30%', size: 22, depth: 13, tint: 'text-accent/25' },
]

export default function AuthHero({ title, subtitle }: AuthHeroProps) {
  const reduced = useReducedMotion()

  // Normalised cursor position, -0.5 … 0.5, smoothed by a spring.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.6 })

  const handleMouse = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduced) return
      const r = e.currentTarget.getBoundingClientRect()
      mx.set((e.clientX - r.left) / r.width - 0.5)
      my.set((e.clientY - r.top) / r.height - 0.5)
    },
    [mx, my, reduced]
  )

  const reset = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  return (
    <section
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className="relative flex h-full min-h-[26rem] w-full items-center overflow-hidden lg:min-h-0"
    >
      {/* soft gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-accent/12 via-background to-background dark:from-accent/10"
      />

      {/* light grid */}
      <div aria-hidden className="auth-grid absolute inset-0 opacity-[0.3] dark:opacity-20" />

      {/* animated gradient blobs */}
      <ParallaxLayer sx={sx} sy={sy} depth={14}>
        <div
          aria-hidden
          className="auth-blob absolute -left-24 top-[-12%] h-80 w-80 rounded-full bg-accent/25 blur-3xl dark:bg-accent/20"
        />
        <div
          aria-hidden
          className="auth-blob absolute bottom-[-18%] right-[-12%] h-96 w-96 rounded-full bg-success-bg blur-3xl dark:bg-success/15"
          style={{ animationDelay: '-6s' }}
        />
        <div
          aria-hidden
          className="auth-blob absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-warning-bg blur-3xl dark:bg-warning-bg"
          style={{ animationDelay: '-12s' }}
        />
      </ParallaxLayer>

      {/* soft particles */}
      <ParallaxLayer sx={sx} sy={sy} depth={22}>
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full bg-accent/40 dark:bg-accent/50"
            style={{
              top: `${((i * 31) % 92) + 4}%`,
              left: `${((i * 47) % 90) + 5}%`,
              height: i % 3 === 0 ? 3 : 2,
              width: i % 3 === 0 ? 3 : 2,
            }}
            animate={{ y: [0, -26, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{
              duration: 8 + (i % 6),
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </ParallaxLayer>

      {/* floating grocery items */}
      {ICONS.map(({ Icon, top, left, right, size, depth, tint }, i) => (
        <ParallaxLayer key={i} sx={sx} sy={sy} depth={depth}>
          <motion.div
            aria-hidden
            className={`absolute hidden lg:block ${tint}`}
            style={{ top, left, right }}
            {...float(10 + (i % 4) * 4, 7 + (i % 5), i * 0.45)}
          >
            <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
          </motion.div>
        </ParallaxLayer>
      ))}

      {/* copy — above everything, drifts least */}
      <ParallaxCopy sx={sx} sy={sy} depth={8}>
        <motion.div
          variants={stagger(0.13, 0.15)}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-xl px-8 py-14 text-center lg:px-14 lg:text-left"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl xl:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-base text-muted sm:text-lg">
            {subtitle}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-7 flex items-center justify-center gap-2 lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Live inventory sync
            </span>
          </motion.div>
        </motion.div>
      </ParallaxCopy>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Parallax helpers                                                     */
/* ------------------------------------------------------------------ */

type Spring = ReturnType<typeof useSpring>

/** Absolutely-positioned decorative layer that shifts as one plane. */
function ParallaxLayer({
  sx,
  sy,
  depth,
  children,
}: {
  sx: Spring
  sy: Spring
  depth: number
  children: React.ReactNode
}) {
  const x = useTransform(sx, (v) => v * depth)
  const y = useTransform(sy, (v) => v * depth)
  return (
    <motion.div aria-hidden style={{ x, y }} className="pointer-events-none absolute inset-0">
      {children}
    </motion.div>
  )
}

/** Parallax wrapper for the hero copy, which stays in normal flow. */
function ParallaxCopy({
  sx,
  sy,
  depth,
  children,
}: {
  sx: Spring
  sy: Spring
  depth: number
  children: React.ReactNode
}) {
  const x = useTransform(sx, (v) => v * depth)
  const y = useTransform(sy, (v) => v * depth)
  return (
    <motion.div style={{ x, y }} className="relative z-10 w-full">
      {children}
    </motion.div>
  )
}
