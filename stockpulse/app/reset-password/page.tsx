'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthError, AuthField, AuthShell, BrandMark, GlassCard, SubmitButton } from '@/components/auth/AuthUI'
import { fadeUp } from '@/lib/motion'

const MIN_LENGTH = 8
const SUCCESS_REDIRECT_MS = 2500

type Status = 'checking' | 'ready' | 'invalid' | 'success'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [linkError, setLinkError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * By the time this page renders the session should already exist: the email
   * link goes to /auth/callback, which exchanges the PKCE code for cookies and
   * forwards here.
   *
   * The hash branch below is a fallback for the older implicit flow, where the
   * tokens arrive in the URL fragment and never reach the server. Relying on
   * that alone was the original bug — @supabase/ssr pins PKCE, so the hash is
   * always empty and no session was ever established.
   */
  useEffect(() => {
    let cancelled = false

    async function establish() {
      const supabase = createClient()

      const hash = window.location.hash.slice(1)
      if (hash) {
        const params = new URLSearchParams(hash)

        // Implicit-flow failures (expired or already-used link) come back in
        // the fragment too, not the query string.
        const hashError = params.get('error_description') ?? params.get('error')
        if (hashError) {
          window.history.replaceState(null, '', window.location.pathname)
          if (!cancelled) {
            setLinkError(decodeURIComponent(hashError.replace(/\+/g, ' ')))
            setStatus('invalid')
          }
          return
        }

        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
          // Clear the tokens out of the address bar so they aren't left in
          // history or shoulder-surfable.
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      // No session means the link was expired or already used. Cross-device is
      // fine: /auth/callback verifies a stateless token_hash, so opening the
      // email on a phone after requesting on a laptop still lands here signed in.
      setStatus(user ? 'ready' : 'invalid')
    }

    establish()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters long.`)
      return
    }
    if (password !== confirm) {
      setError('Both passwords must match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setError(updateError.message)
      return
    }

    // Sign out so the recovery session can't be used to browse the app, and so
    // the next sign-in genuinely exercises the new password.
    await supabase.auth.signOut()
    setLoading(false)
    setStatus('success')
    setTimeout(() => router.push('/login'), SUCCESS_REDIRECT_MS)
  }

  return (
    <AuthShell>
      <GlassCard>
        <div className="text-center">
          <BrandMark />

          {status === 'success' ? (
            <>
              <CheckCircle2 className="mx-auto mt-4 h-8 w-8 text-success" aria-hidden="true" />
              <h2 className="font-serif-brand mt-3 text-[22px] font-semibold tracking-[0.01em] text-foreground">Password updated</h2>
              <p className="mt-1 text-sm text-muted-strong">
                Taking you to the login page so you can sign in with your new password…
              </p>
              <Link
                href="/login"
                className="mt-6 flex w-full items-center justify-center rounded-xl py-4 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, var(--sp-gold), var(--sp-gold-deep))' }}
              >
                Go to login now
              </Link>
            </>
          ) : status === 'invalid' ? (
            <>
              <AlertTriangle className="mx-auto mt-4 h-8 w-8 text-danger" aria-hidden="true" />
              <h2 className="font-serif-brand mt-3 text-[22px] font-semibold tracking-[0.01em] text-foreground">This link has expired</h2>
              <p className="mt-1 text-sm text-muted-strong">
                {linkError ||
                  'Password reset links expire and can only be used once. Request a new one and it will work from any device.'}
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 flex w-full items-center justify-center rounded-xl py-4 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, var(--sp-gold), var(--sp-gold-deep))' }}
              >
                Request a new link
              </Link>
            </>
          ) : (
            <motion.div variants={fadeUp}>
              <h2 className="font-serif-brand mt-5 text-[22px] font-semibold tracking-[0.01em] text-foreground">Set New Password</h2>
              <p className="mt-1 text-sm text-muted-strong">Choose a new password for your account.</p>
            </motion.div>
          )}
        </div>

        {status === 'checking' && (
          <p className="mt-8 text-center text-sm text-muted-strong" role="status">
            Verifying your link…
          </p>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && <AuthError message={error} />}

            <AuthField
              label="New Password"
              icon={Lock}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              hint={`Must be at least ${MIN_LENGTH} characters long.`}
            />

            <AuthField
              label="Confirm Password"
              icon={Lock}
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <div className="pt-1">
              <SubmitButton loading={loading} loadingLabel="Updating…">
                Update Password
                <ArrowRight className="h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        )}
      </GlassCard>
    </AuthShell>
  )
}
