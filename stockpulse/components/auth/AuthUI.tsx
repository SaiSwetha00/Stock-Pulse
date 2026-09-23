'use client'

import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarClock, Eye, EyeOff, Moon, PackageSearch, Sun, WifiOff, type LucideIcon } from 'lucide-react'
import { EASE, fadeUp, hoverLift, scaleIn, stagger } from '@/lib/motion'
import DashboardShot, { type Palette } from '@/components/product/DashboardShot'
import { TOTALS } from '@/components/landing/snapshot'
import StockPulseLogo from '@/components/marketing/StockPulseLogo'
import { authSans } from './fonts'
import './auth-theme.css'

/**
 * The auth screens, in the landing page's key: deep navy, one blue accent, a
 * soft blue/purple glow, Inter Tight, and the form on a raised navy panel.
 *
 * WHAT THIS REPLACES. These pages were an "ember panel beside a paper page":
 * a dark maroon column carrying a gold wordmark, a Cinzel pull-quote and a
 * trading-day chart, beside a cream form with a red margin rule and a red
 * submit button, in five typefaces. The app's brand moved to the blue/purple
 * system (see the landing design and the new app icon), and a sign-in page in
 * the previous brand is the seam a visitor notices first — they arrive on a
 * navy page and land on a cream one.
 *
 * WHAT IT KEEPS, deliberately:
 *   - the split rather than a centred card, and the brand on the left;
 *   - the approved Concept 3 composition: one 1400px container, header /
 *     content / footer rows, and the card on columns 8-12 so its right edge is
 *     the container's;
 *   - `dayFill`, now a progress bar over the form (sign-up passes its step
 *     progress, sign-in leaves it at 1, which hides it);
 *   - every export's name and signature, so no page had to be rewritten.
 *
 * NOTHING HERE TOUCHES AUTHENTICATION. The pages still call the real
 * `login()` and `signUpOwner()` Server Actions; no credential is read, held or
 * logged in this file. The palette arrives through ./auth-theme.css, which
 * re-points the tokens the pages already name (including the old `--sp-gold`
 * and `--sp-red`) rather than editing markup that sits beside a password
 * field.
 *
 * The chips beside the form name real capabilities and carry the demo store's
 * real counts (components/landing/snapshot.ts). The dashboard behind them is
 * the app's own DashboardShot, blurred and dimmed; ./auth-theme.css re-points
 * its amber/red status colours to periwinkle for the backdrop only, so no warm
 * legacy colour survives on these screens.
 */


/* ------------------------------------------------------------------ */
/* Shell: the product behind, the form on a raised panel in front       */
/* ------------------------------------------------------------------ */

const CHIPS = [
  { icon: PackageSearch, label: 'Inventory', value: `${TOTALS.products} products` },
  { icon: CalendarClock, label: 'Expiry alerts', value: `${TOTALS.expiringSoonLots} lots expiring` },
  { icon: WifiOff, label: 'Offline till', value: 'Sales queue on the device' },
]

/** The dashboard's palette for the backdrop — the app's own light product UI. */
const BACKDROP_PALETTE: Palette = {
  tint: '#F6F7FA',
  line: '#E6E8EE',
  accent: '#4F6BFF',
  accentSoft: '#EEF0FF',
  radius: '16px',
  shadow: '0 70px 120px -50px rgba(0,0,0,0.95)',
}

/** One container, one padding scale — header, content and footer all align to it. */
const WRAP = 'mx-auto w-full max-w-[1400px] px-6 sm:px-10 lg:px-14'

export function AuthShell({
  children,
  dayFill = 1,
}: {
  children: ReactNode
  /**
   * Progress through a multi-step flow, 0-1. Sign-up passes its step progress
   * and it renders as a bar above the form; sign-in leaves it at 1, which
   * hides the bar. (It drove the old gold trading-day column.)
   */
  dayFill?: number
}) {
  const showProgress = dayFill < 1

  return (
    <div
      className={`sp-auth ${authSans.variable} relative min-h-dvh w-full overflow-hidden font-[family-name:var(--font-auth-sans)] antialiased`}
    >
      {/* ─── The environment: the real dashboard, pushed back ─── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none lg:block">
        <div
          className="absolute -left-[12%] top-[6%] h-[820px] w-[820px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(79,107,255,0.30), transparent)' }}
        />
        <div
          className="absolute -left-[4%] bottom-[-14%] h-[620px] w-[620px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(150,110,255,0.20), transparent)' }}
        />
        <div className="sp-auth-backdrop absolute left-[-7%] top-1/2 w-[1000px] -translate-y-1/2">
          <div
            className="opacity-[0.26] blur-[10px]"
            style={{ filter: 'saturate(0.85)', boxShadow: '0 80px 140px -60px rgba(0,0,0,1)' }}
          >
            <DashboardShot palette={BACKDROP_PALETTE} />
          </div>
        </div>
        <div
          className="absolute inset-y-0 left-0 w-[52%]"
          style={{
            background: 'linear-gradient(to right, rgba(10,15,31,0.94) 12%, rgba(10,15,31,0.55) 58%, transparent)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 85% 80% at 34% 50%, transparent 20%, rgba(10,15,31,0.86) 100%)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[58%]"
          style={{ background: 'linear-gradient(to left, #0A0F1F 42%, rgba(10,15,31,0.72) 72%, transparent)' }}
        />
      </div>

      {/* ─── Content: one grid, three rows ─── */}
      <div className="relative grid min-h-dvh grid-rows-[auto_1fr_auto]">
        <header className={`${WRAP} flex flex-wrap items-center justify-between gap-4 py-6 lg:py-8`}>
          <Link href="/" className="inline-flex shrink-0 rounded-md">
            <StockPulseLogo size="md" showSubtitle={false} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13.5px] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to site
          </Link>
        </header>

        <main className={`${WRAP} grid items-center gap-10 py-6 lg:grid-cols-12 lg:gap-8 lg:py-4`}>
          {/* Left: the room you are signing into. Dropped on phones. */}
          <div className="hidden lg:col-span-6 lg:block">
            <h1 className="max-w-[16ch] text-[clamp(1.8rem,2.4vw,2.4rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground">
              Sign in to your store.
            </h1>
            <p className="mt-3 max-w-md text-[15.5px] leading-[1.6] text-muted-strong">
              Stock, sales, suppliers and every expiry date — the dashboard behind this form is the one you land on.
            </p>
            <ul className="mt-8 max-w-[19rem] space-y-2.5">
              {CHIPS.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
                  style={{ background: 'rgba(16,22,43,0.66)', borderColor: 'var(--border)' }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgba(79,107,255,0.15)] text-[color:var(--sp-periwinkle)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[12.5px] text-muted">{label}</span>
                    <span className="block text-[14px] font-medium text-foreground">{value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: the form. Columns 8-12 put its right edge on the container's.
              `min-w-0` + `break-words`: a grid item defaults to min-width:auto, so
              the demo credentials line (one long unbreakable token) pushed the card
              wider than its column and the root's overflow-hidden silently clipped
              it on a phone. */}
          <div className="min-w-0 lg:col-span-5 lg:col-start-8">
            <div
              className="w-full break-words rounded-[24px] border p-6 sm:p-8"
              style={{
                background: '#111830',
                borderColor: 'var(--border)',
                boxShadow:
                  '0 0 0 1px rgba(143,162,255,0.06), 0 40px 90px -40px rgba(0,0,0,1), 0 0 80px -30px rgba(79,107,255,0.28)',
              }}
            >
              {showProgress && (
                <div
                  className="mb-6 h-1 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(dayFill * 100)}
                  aria-label="Sign-up progress"
                >
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ background: 'var(--sp-blue)' }}
                    initial={false}
                    animate={{ width: `${Math.max(0, Math.min(1, dayFill)) * 100}%` }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                </div>
              )}
              {children}
            </div>
          </div>
        </main>

        <footer className={`${WRAP} py-6 lg:py-8`}>
          <p className="text-[12px] text-muted">The StockPulse dashboard · demo store</p>
        </footer>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Brand mark with a soft glow                                          */
/* ------------------------------------------------------------------ */

export function BrandMark() {
  return (
    <motion.div variants={scaleIn} className="relative mx-auto">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{ backgroundColor: 'rgba(107,109,246,0.40)' }}
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex justify-center">
        <StockPulseLogo size="md" showSubtitle={false} />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Form panel — staggers its children in                                */
/* ------------------------------------------------------------------ */

export function FormPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={stagger(0.1, 0.2)}
      initial="hidden"
      animate="show"
      className={`relative w-full ${className}`}
    >
      <motion.div variants={scaleIn}>{children}</motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Input with icon + focus ring + password toggle                       */
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
          className="text-[12.5px] font-medium text-muted transition-colors duration-200 group-focus-within:text-[color:var(--sp-periwinkle)]"
        >
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-200 group-focus-within:text-[color:var(--sp-periwinkle)]" />
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
          className={`w-full rounded-xl border border-border bg-[rgba(255,255,255,0.04)] py-3.5 pl-10 text-[14.5px] text-foreground outline-none transition-all duration-200 placeholder:text-muted focus:border-[color:var(--sp-blue)] focus:bg-[rgba(255,255,255,0.06)] focus:ring-4 focus:ring-[rgba(79,107,255,0.18)] aria-[invalid=true]:border-danger aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[rgba(255,143,143,0.18)] ${
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

      {hint && <p className="mt-1.5 text-[12.5px] text-muted">{hint}</p>}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Primary button: the landing page's blue pill                         */
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
      className={`group relative flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
        isPrimary
          ? 'text-white shadow-[0_14px_34px_-14px_rgba(79,107,255,0.9)] hover:bg-[color:var(--sp-blue-hover)]'
          : 'border border-border text-foreground hover:bg-[rgba(255,255,255,0.06)]'
      } ${className}`}
      /* A flat fill, not a gradient: the landing page's one filled control. */
      style={isPrimary ? { background: 'var(--sp-blue)' } : undefined}
    >
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
      className="rounded-xl border border-danger bg-danger-bg px-4 py-2.5 text-[14px] text-danger"
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
 * Still exported so existing imports resolve, but not mounted by `AuthShell`:
 * these screens are fixed dark, and a control that claims to change a theme it
 * cannot change is worse than no control at all. It stays usable anywhere the
 * app's own light/dark surface is in play.
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
