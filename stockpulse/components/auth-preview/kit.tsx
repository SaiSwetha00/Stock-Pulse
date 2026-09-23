'use client'

import { useId, useState, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, Mail, Store, User, type LucideIcon } from 'lucide-react'

/**
 * Shared parts for the three authentication CONCEPTS under /auth-preview.
 *
 * These are visual mockups, not the auth pages. Nothing here imports a Server
 * Action, a Supabase client or `@/components/auth/*`: the real login, signup,
 * forgot-password and reset-password pages are untouched, and a preview that
 * could sign someone in would be a second auth surface to keep secure.
 *
 * Every form here is INERT and says so on the page — submit is prevented, no
 * value leaves the component, and no autofill is invited (`autoComplete="off"`,
 * `name` omitted) so a password manager is not asked to fill a form that
 * cannot sign anyone in.
 *
 * The copy, field labels, hints and step titles are copied verbatim from the
 * real pages (app/login, /signup, /forgot-password, /reset-password) so a
 * concept can be judged on the content it will actually carry.
 */

export type ScreenKey = 'login' | 'signup' | 'forgot' | 'reset'

export const SCREEN_TABS: ReadonlyArray<{ key: ScreenKey; label: string }> = [
  { key: 'login', label: 'Log in' },
  { key: 'signup', label: 'Sign up' },
  { key: 'forgot', label: 'Forgot password' },
  { key: 'reset', label: 'Reset password' },
]

/** The real demo-store shortcut from app/login/page.tsx. */
export const DEMO = {
  kicker: 'Reviewing this project?',
  body: 'Sign in to a demo store with 135 products and 30 days of sales already in it.',
  cta: 'Explore the demo store',
}

export const SIGNUP_STEPS = [
  { title: 'Name your store', blurb: 'What should we call your workspace?' },
  { title: 'About you', blurb: 'Tell us who owns this store.' },
  { title: 'Secure your account', blurb: 'Set your sign-in credentials.' },
]

export function screenHead(screen: ScreenKey, step = 0) {
  switch (screen) {
    case 'login':
      return { title: 'Welcome back', blurb: 'Sign in to your store dashboard.' }
    case 'signup':
      return SIGNUP_STEPS[step]
    case 'forgot':
      return { title: 'Reset Password', blurb: 'Enter your work email and we’ll send you a reset link.' }
    case 'reset':
      return { title: 'Set New Password', blurb: 'Choose a new password for your account.' }
  }
}

/* ───────────────────────── controls ───────────────────────── */

export function Field({
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  hint,
  action,
  tone = 'dark',
}: {
  label: string
  icon: LucideIcon
  type?: string
  placeholder?: string
  hint?: string
  action?: ReactNode
  /** `dark` sits on navy; `raised` on a lighter panel. */
  tone?: 'dark' | 'raised'
}) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[12.5px] font-medium text-[#98A1B8] group-focus-within:text-[#8FA2FF]">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#7B85A0] transition-colors group-focus-within:text-[#8FA2FF]"
          aria-hidden="true"
        />
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-xl border py-3.5 pl-10 text-[14.5px] text-[#EEF0F6] outline-none transition placeholder:text-[#6B7489] focus:border-[#4F6BFF] focus:ring-4 focus:ring-[#4F6BFF]/20 ${
            isPassword ? 'pr-12' : 'pr-4'
          } ${tone === 'raised' ? 'border-white/[0.12] bg-white/[0.05]' : 'border-white/10 bg-white/[0.03]'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-[#7B85A0] transition-colors hover:text-[#EEF0F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8FA2FF]"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[12.5px] text-[#7B85A0]">{hint}</p>}
    </div>
  )
}

export function PrimaryButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4F6BFF] py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#6580FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF] ${className}`}
    >
      {children}
    </button>
  )
}

export function QuietButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-[14.5px] font-medium text-[#EEF0F6] transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF] ${className}`}
    >
      {children}
    </button>
  )
}

export function TextLink({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`cursor-default text-[#8FA2FF] underline-offset-4 hover:underline ${className}`}>{children}</span>
  )
}

/* ───────────────────────── the mark ───────────────────────── */

export function Mark({ className = 'h-9 w-9' }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B7CFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-f)`} />
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-s)`} />
      <path
        d="M6.5 16.5h4.6l2.4-5.6 3.9 10.2 3-7.6 1.5 3H25.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark />
      <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#EEF0F6]">StockPulse</span>
    </span>
  )
}

/* ───────────────────────── preview plumbing ───────────────────────── */

/**
 * Lets the reviewer walk all four screens in one concept. It is a PREVIEW
 * control and is styled to read as one — it is not part of any concept's
 * design, and would not ship.
 */
export function ScreenTabs({
  screen,
  onChange,
  className = '',
}: {
  screen: ScreenKey
  onChange: (s: ScreenKey) => void
  className?: string
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1 rounded-full border border-dashed border-white/15 p-1 ${className}`}
    >
      <span className="px-2.5 text-[11px] uppercase tracking-[0.12em] text-[#6B7489]">Preview</span>
      {SCREEN_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-current={screen === t.key || undefined}
          className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF] ${
            screen === t.key ? 'bg-white/[0.10] text-[#EEF0F6]' : 'text-[#98A1B8] hover:text-[#EEF0F6]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Says plainly that these forms do nothing. */
export function InertNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-[1.5] text-[#6B7489] ${className}`}>
      Design preview — this form is inactive and cannot sign you in. The live pages are unchanged.
    </p>
  )
}

/**
 * The body of each screen, shared by all three concepts so they differ in
 * composition rather than in content. `tone` matches the surface it sits on.
 */
export function ScreenFields({
  screen,
  step,
  tone = 'dark',
}: {
  screen: ScreenKey
  step: number
  tone?: 'dark' | 'raised'
}) {
  if (screen === 'login') {
    return (
      <>
        <Field label="Store Email" icon={Mail} type="email" placeholder="manager@localmarket.com" tone={tone} />
        <Field
          label="Password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          tone={tone}
          action={<TextLink className="text-[12.5px]">Forgot password?</TextLink>}
        />
      </>
    )
  }
  if (screen === 'signup') {
    if (step === 0) return <Field label="Store Name" icon={Store} placeholder="e.g. Corner Grocer" tone={tone} />
    if (step === 1) return <Field label="Full Name" icon={User} placeholder="Jane Doe" tone={tone} />
    return (
      <>
        <Field label="Work Email" icon={Mail} type="email" placeholder="jane@cornergrocer.com" tone={tone} />
        <Field
          label="Password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          hint="Must be at least 8 characters long."
          tone={tone}
        />
      </>
    )
  }
  if (screen === 'forgot') {
    return <Field label="Store Email" icon={Mail} type="email" placeholder="manager@localmarket.com" tone={tone} />
  }
  return (
    <>
      <Field
        label="New Password"
        icon={Lock}
        type="password"
        placeholder="••••••••"
        hint="Must be at least 8 characters long."
        tone={tone}
      />
      <Field label="Confirm Password" icon={Lock} type="password" placeholder="••••••••" tone={tone} />
    </>
  )
}

export function submitLabel(screen: ScreenKey, step: number) {
  if (screen === 'login') return 'Log In'
  if (screen === 'signup') return step < 2 ? 'Continue' : 'Create Account'
  if (screen === 'forgot') return 'Send Reset Link'
  return 'Update Password'
}
