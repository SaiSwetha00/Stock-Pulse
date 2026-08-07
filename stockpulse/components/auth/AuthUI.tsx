'use client'

import { useCallback, useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Moon, Sun, type LucideIcon } from 'lucide-react'
import { EASE, fadeUp, hoverLift, scaleIn, stagger } from '@/lib/motion'
import '@/components/marketing/landing.css'
import {
  outfit,
  plusJakartaSans,
  cinzelDecorative,
  cinzel,
  jetbrainsMono,
} from '@/components/marketing/fonts'
import StockPulseLogo from '@/components/marketing/StockPulseLogo'

/**
 * The auth screens, in the landing page's cinematic key.
 *
 * These are the same components as before and every export keeps its name and
 * signature — only the surface changed. Nothing here touches authentication:
 * the pages still call the real `login()` and `signUpOwner()` Server Actions,
 * and no credential is read, held or logged in this file.
 *
 * The palette is fixed near-black rather than following the app's theme. These
 * two screens sit either side of the landing page in the flow, and a form that
 * flipped to warm white between a dark hero and a dark dashboard would break
 * the thread.
 *
 * `.sp-landing` + the font `.variable` classes below opt this tree into the
 * exact same tokens (`glass-card`, `font-mono`, `var(--sp-gold)`, ...) the
 * landing page uses, from `landing.css` — sharing, not duplicating.
 */

const FONT_VARIABLES = `${outfit.variable} ${plusJakartaSans.variable} ${cinzelDecorative.variable} ${cinzel.variable} ${jetbrainsMono.variable}`

/* ------------------------------------------------------------------ */
/* Shell: centred card over a drawn gold-silk backdrop                  */
/* ------------------------------------------------------------------ */

export function AuthShell({ hero, children }: { hero?: ReactNode; children: ReactNode }) {
  // `hero` is accepted and ignored on purpose. The old 60/40 split put an
  // illustration beside the form; this layout centres the card over a drawn
  // gold-silk backdrop instead. Keeping the prop is what let the styling change
  // editing the four calling pages — and so without going anywhere near their
  // auth logic.
  void hero

  return (
    <div
      className={`sp-landing ${FONT_VARIABLES} relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black px-5 py-16 font-sans`}
    >
      {/* Quiet backdrop: a faint dot-grid for structure and one soft gold
          bloom behind the card — replacing the earlier gold-silk SVG paths
          and stacked radial gradients, which read as decoration for its own
          sake rather than a considered ground for a form. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201,162,39,0.16) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Back to the landing hero. */}
      <Link
        href="/"
        className="absolute left-5 top-6 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 text-sm text-zinc-300 backdrop-blur-xl transition-colors hover:border-white/25 hover:text-white sm:left-8"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>

      <main className="relative z-10 flex w-full items-center justify-center">{children}</main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Brand mark with a breathing glow                                     */
/* ------------------------------------------------------------------ */

export function BrandMark() {
  return (
    <motion.div variants={scaleIn} className="relative mx-auto">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{ backgroundColor: 'rgba(237,193,85,0.45)' }}
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative">
        <StockPulseLogo size="lg" iconOnly showSubtitle={false} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Glassmorphism card — staggers its children in                        */
/* ------------------------------------------------------------------ */

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  // Mouse-follow tilt: normalised -0.5…0.5 cursor position within the card,
  // sprung and mapped to a small rotation. Resets to flat on mouse leave.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springed = { stiffness: 150, damping: 18, mass: 0.5 }
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), springed)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), springed)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      mx.set((e.clientX - rect.left) / rect.width - 0.5)
      my.set((e.clientY - rect.top) / rect.height - 0.5)
    },
    [mx, my]
  )

  const handleMouseLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  return (
    <motion.div
      variants={stagger(0.1, 0.2)}
      initial="hidden"
      animate="show"
      className={`relative w-full max-w-[26rem] ${className}`}
      style={{ perspective: 1200 }}
    >
      <motion.div
        variants={scaleIn}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="glass-card rounded-3xl p-8 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9)] backdrop-blur-2xl backdrop-saturate-150 sm:p-10"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Input with icon + animated focus ring + password toggle              */
/* ------------------------------------------------------------------ */

interface AuthFieldProps {
  label: string
  icon: LucideIcon
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  hint?: string
  action?: ReactNode
  autoFocus?: boolean
  /** Marks the control invalid so it paints red and is announced as such. */
  invalid?: boolean
}

export function AuthField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  hint,
  action,
  autoFocus,
  invalid,
}: AuthFieldProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <motion.div variants={fadeUp} className="group">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400 transition-colors duration-300 group-focus-within:text-[#d8cba8]"
        >
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-[var(--sp-gold)]" />
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-[var(--sp-gold)]/55 focus:bg-white/[0.07] focus:ring-4 focus:ring-[var(--sp-gold)]/12 aria-[invalid=true]:border-red-500/70 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-500/10 ${
            isPassword ? 'pr-12' : 'pr-4'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="tap-target absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-md text-zinc-500 transition-colors hover:text-white"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Primary button: hover lift, ripple sheen, loading spinner            */
/* ------------------------------------------------------------------ */

export function SubmitButton({
  children,
  loading,
  loadingLabel = 'Please wait…',
  type = 'submit',
  onClick,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode
  loading?: boolean
  loadingLabel?: string
  type?: 'submit' | 'button'
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  const isPrimary = variant === 'primary'

  return (
    <motion.button
      variants={fadeUp}
      {...hoverLift}
      type={type}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-4 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
        isPrimary
          ? 'text-black shadow-[0_10px_28px_-10px_rgba(201,162,39,0.55)] hover:shadow-[0_14px_36px_-10px_rgba(201,162,39,0.75)]'
          : 'border border-white/12 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08]'
      } ${className}`}
      style={
        isPrimary
          ? { background: 'linear-gradient(135deg, var(--sp-gold), var(--sp-gold-deep))' }
          : undefined
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      {loading ? (
        <>
          <span
            aria-hidden
            className={`h-4 w-4 animate-spin rounded-full border-2 ${
              isPrimary ? 'border-black/25 border-t-black/70' : 'border-white/30 border-t-white'
            }`}
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Error banner                                                         */
/* ------------------------------------------------------------------ */

export function AuthError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      role="alert"
      className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
    >
      {message}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Theme toggle                                                         */
/* ------------------------------------------------------------------ */

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/**
 * Still exported so existing imports resolve, but no longer mounted by
 * `AuthShell`: these screens are fixed dark now, and a control that claims to
 * change a theme it cannot change is worse than no control at all. It stays
 * usable anywhere the app's own light/dark surface is in play.
 */
export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  )

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('sp-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode — theme still applies for this session */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="tap-target absolute right-4 top-4 z-30 rounded-full border border-border bg-surface/70 text-foreground backdrop-blur transition hover:bg-surface"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
