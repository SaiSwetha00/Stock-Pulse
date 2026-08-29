'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { login } from '@/app/auth/actions'
// Shared with the dashboard layout, which marks the session as a demo.
import { DEMO_EMAIL } from '@/lib/demo'
import {
  AuthError,
  AuthField,
  AuthShell,
  FormPanel,
  SubmitButton,
} from '@/components/auth/AuthUI'
import { fadeUp } from '@/lib/motion'

/**
 * Published on purpose — the same pair is in the repo README and in
 * scripts/acceptance/ensure-demo-user.cjs, which is what creates the account
 * and resets this password on every run so the three cannot drift apart.
 *
 * It signs in as an OWNER of the seeded demo store and nothing else: RLS scopes
 * it to that one store, everything in it is generated acceptance data, and
 * re-running the seed restores it. See the script for the full reasoning.
 */

const DEMO_PASSWORD = 'StockPulseDemo2026!'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  /*
    Focus the demo control when arriving from the landing page's "View a live
    demo" link (/login?demo=1).

    Read from window.location in an effect rather than with useSearchParams:
    this page is statically prerendered, and useSearchParams opts the whole
    route out of that unless it is wrapped in Suspense — measured, the build
    failed with "useSearchParams() should be wrapped in a suspense boundary at
    page /login". Adding a Suspense boundary to buy a focus ring would be a
    poor trade; reading it on the client costs nothing and keeps /login static.

    The link deliberately does NOT sign in by itself. A GET from a plain
    anchor should not create a session, and a page that logs you in because of
    a URL you clicked is a surprise even when the account is public. Focusing
    the control is the honest version of one-click.
  */
  const demoButtonRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      demoButtonRef.current?.focus()
    }
  }, [])

  const [loading, setLoading] = useState(false)

  /**
   * /auth/callback sends failures here as ?error=… (expired or already-used
   * recovery link, most often). Without this they were swallowed and the user
   * just saw a bare login form with no explanation.
   *
   * Read via useSyncExternalStore rather than useSearchParams so the page stays
   * statically rendered, and rather than an effect so no setState happens during
   * one. The server snapshot is empty and the client snapshot is the real param,
   * which is a change React expects — not a hydration mismatch.
   */
  const urlError = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('error') ?? '',
    () => '',
  )
  const shownError = error || urlError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login({ email, password })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  /**
   * One click into the seeded demo store.
   *
   * This exists because the alternative is a reviewer meeting a sign-up form,
   * deciding it is not worth inventing a store to look at somebody's project,
   * and closing the tab having seen nothing. The credentials are printed above
   * the button rather than only injected by it, so it is obvious what the
   * click does and they can be typed by hand or reused later.
   *
   * `login()` is called with the demo values directly instead of setting state
   * and submitting: setState is asynchronous, so submitting in the same tick
   * would post whatever was in the fields BEFORE the click — usually nothing.
   */
  async function handleDemoLogin() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
    setLoading(true)
    const result = await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <FormPanel>
        <div>
          <motion.h2
            variants={fadeUp}
            className="font-serif-brand mt-5 text-[22px] font-semibold tracking-[0.01em] text-foreground"
          >
            Welcome back
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-1 text-sm text-muted-strong">
            Sign in to your store dashboard.
          </motion.p>
        </div>

        {/* Reviewer shortcut, above the form because below it is where nobody
            scrolls on a sign-in page. */}
        <motion.div
          variants={fadeUp}
          className="mt-6 rounded-xl border border-[var(--sp-gold)]/40 bg-[var(--sp-gold)]/[0.07] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-gold)]">
            Reviewing this project?
          </p>
          <p className="mt-1.5 text-sm text-muted-strong">
            Sign in to a demo store with 135 products and 30 days of sales already in it.
          </p>
          <p className="mt-2 font-mono text-xs text-muted-strong">
            {DEMO_EMAIL}
            <span className="mx-1.5 text-muted">/</span>
            {DEMO_PASSWORD}
          </p>
          <button
            type="button"
            ref={demoButtonRef}
            onClick={handleDemoLogin}
            disabled={loading}
            className="mt-3 w-full rounded-lg border border-[var(--sp-gold)]/60 bg-[var(--sp-gold)]/15 px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--sp-gold)]/25 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Explore the demo store'}
          </button>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {shownError && <AuthError message={shownError} />}

          <AuthField
            label="Store Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="manager@localmarket.com"
            autoComplete="email"
            required
            autoFocus
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            action={
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted-strong transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            }
          />

          <div className="pt-1">
            <SubmitButton loading={loading} loadingLabel="Signing in…">
              Log In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </SubmitButton>
          </div>
        </form>

        <motion.p variants={fadeUp} className="mt-6 text-sm text-muted-strong">
          New store owner?{' '}
          <Link href="/signup" className="font-semibold text-foreground hover:underline">
            Set up your store
          </Link>
        </motion.p>
      </FormPanel>
    </AuthShell>
  )
}
