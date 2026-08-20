'use client'

import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
import DayColumn from './DayColumn'

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
/* Shell: ember panel beside a paper page                               */
/* ------------------------------------------------------------------ */

/**
 * The auth screens, redesigned as a split rather than a centred card.
 *
 * WHAT THIS REPLACES. Until now these pages were a glass card, centred, on a
 * gradient background - dark ground, one bright accent, blurred panel. That
 * combination is currently the default look of every generated interface, and
 * being competent at it is not the same as being distinctive. So the card is
 * gone entirely.
 *
 * THE DISTINCTIVE SPEND IS THE LAYOUT, and it is spent once rather than
 * scattered. Three moves, all structural:
 *
 *   1. No container. The form sits directly on the surface. Every SaaS auth
 *      screen is a centred card; a form that simply is not in one reads as
 *      considered before a single word is read.
 *   2. The convention is inverted. Brand on the dark side, form on the LIGHT
 *      side, asymmetric rather than centred.
 *   3. One red vertical rule down the left edge of the form - the margin rule
 *      of a shop's ruled register. That is where the accent lives here:
 *      structural, not a glow. It also makes the mono field labels, which
 *      were already there, stop reading as "technical" and start reading as
 *      a register.
 *
 * The two halves use the landing page's own `sp-band-night` and
 * `sp-band-paper` stations, so the entry flow stays coherent with the
 * marketing page through the PALETTE rather than by repeating the same
 * background. Both classes redefine every semantic token for their subtree,
 * which is why `AuthField`, `AuthError` and the rest resolve correctly on a
 * light ground without being edited.
 *
 * THIS REVISES A RECORDED DECISION - see D64. The note that used to sit here
 * argued these screens must stay fully dark, because "a form that flipped to
 * warm white between a dark hero and a dark dashboard would break the
 * thread". That concern was real and is answered rather than dismissed: the
 * ember panel keeps a dark half on screen at all times, so the thread is
 * never actually cut. It is recorded properly rather than quietly deleted.
 *
 * Nothing here touches authentication. Every export keeps its name and
 * signature except `GlassCard`, which is renamed to `FormPanel` because it is
 * no longer glass and a name that lies outlives the person who wrote it.
 */
export function AuthShell({
  children,
  dayFill = 1,
}: {
  children: ReactNode
  /**
   * How much of the trading day the signature column has drawn, 0-1.
   * Sign-in leaves it at 1 (a settled day); sign-up passes its step progress
   * so the day fills as the shop is created. Read-only - see DayColumn.
   */
  dayFill?: number
}) {
  return (
    <div
      className={`sp-landing ${FONT_VARIABLES} flex min-h-dvh w-full flex-col font-sans lg:flex-row`}
    >
      {/* ---------------------------------------------------------------
          The ember panel. On desktop a fixed-width left column; on mobile it
          collapses to a header band and the day column is DROPPED rather than
          squeezed - a fifteen-row figure at 375px wide is a smear, and a
          signature that cannot be read is not one.
          --------------------------------------------------------------- */}
      <aside className="sp-band-night relative flex shrink-0 flex-col justify-between overflow-hidden px-7 py-8 sm:px-10 lg:w-[38%] lg:max-w-[30rem] lg:px-12 lg:py-14">
        {/* A single gold hairline down the seam between the two panels - the
            same one-line device the landing footer uses to say "same product"
            before anything else has loaded. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px lg:block"
          style={{ background: 'linear-gradient(180deg, transparent, var(--sp-gold) 45%, transparent)', opacity: 0.5 }}
        />

        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="inline-flex shrink-0">
            <StockPulseLogo size="md" showSubtitle={false} />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </Link>
        </div>

        {/* The pull-quote. Cinzel, set large and given room - the one place on
            these screens where type is the event. */}
        <p className="mt-10 max-w-[15ch] font-serif-brand text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.15] tracking-[0.01em] text-foreground lg:mt-0">
          Open to close, in one place.
        </p>

        <div className="mt-10 hidden lg:block">
          <DayColumn fill={dayFill} />
        </div>

        <Link
          href="/"
          className="mt-10 hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground lg:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to site
        </Link>
      </aside>

      {/* ---------------------------------------------------------------
          The paper page. The form sits on it directly - no card, no blur, no
          border - behind a red margin rule.
          --------------------------------------------------------------- */}
      <main className="sp-band-paper relative flex flex-1 items-center justify-center px-6 py-14 sm:px-10 lg:py-16">
        {/* Ruled ground. Faint horizontal rules at the rhythm of a register,
            masked out well before the form's own edges so they read as paper
            texture and never as a table someone forgot to style. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 31px, var(--border) 31px 32px)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 78%)',
          }}
        />

        <div className="relative w-full max-w-[27rem] pl-6 sm:pl-8">
          {/* THE MARGIN RULE. One red vertical line, full height of the form
              block. The only red on the paper side other than the submit
              button, and the two are the same colour on purpose. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-px"
            style={{ background: 'var(--sp-red)', opacity: 0.62 }}
          />
          {children}
        </div>
      </main>
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
      {/* The full wordmark, not `iconOnly`. These pages carried the mark's
          icon and nothing else, so the one element that says which product
          this is — and the one place the Cinzel character lives — was
          missing entirely. */}
      <div className="relative flex justify-center">
        <StockPulseLogo size="md" showSubtitle={false} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Glassmorphism card — staggers its children in                        */
/* ------------------------------------------------------------------ */

export function FormPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={stagger(0.1, 0.2)}
      initial="hidden"
      animate="show"
      className={`relative w-full ${className}`}
    >
      {/* No card, no blur, no tilt. The mouse-follow rotation that used to
          live here belonged to a floating pane; a form printed on a page does
          not tip toward the cursor, and the point of this redesign is that it
          is printed on a page. */}
      <motion.div variants={scaleIn}>{children}</motion.div>
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
          className="font-mono text-xs font-semibold uppercase tracking-wide text-muted transition-colors duration-300 group-focus-within:text-[var(--sp-gold)]"
        >
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-300 group-focus-within:text-[var(--sp-gold)]" />
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
          className={`w-full rounded-xl border border-border bg-surface/[0.04] py-3.5 pl-10 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted focus:border-[var(--sp-gold)]/55 focus:bg-surface/[0.07] focus:ring-4 focus:ring-[var(--sp-gold)]/12 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-danger ${
            isPassword ? 'pr-12' : 'pr-4'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="tap-target absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-md text-muted transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
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
          ? 'text-white shadow-[0_10px_28px_-10px_rgba(216,31,38,0.55)] hover:shadow-[0_14px_36px_-10px_rgba(216,31,38,0.75)]'
          : 'border border-border bg-surface/[0.04] text-muted-strong hover:border-border-strong hover:bg-surface/[0.08]'
      } ${className}`}
      style={
        isPrimary
          ? // Red, not gold. The landing page reserves one filled red control
            // for "the way in"; the form at the end of that journey is the
            // same action finishing, so it is the same colour. Gold stays the
            // brand accent - the wordmark, the seam hairline, focus rings.
            { background: 'linear-gradient(160deg, var(--sp-red) 0%, #b81a20 62%, var(--sp-red-deep) 100%)' }
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
              isPrimary ? 'border-white/30 border-t-white' : 'border-border-strong border-t-foreground'
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
      className="rounded-xl border border-danger bg-danger-bg px-4 py-2.5 text-sm text-danger"
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
