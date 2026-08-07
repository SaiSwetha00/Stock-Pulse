'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { login } from '@/app/auth/actions'
import AuthHero from '@/components/auth/AuthHero'
import {
  AuthError,
  AuthField,
  AuthShell,
  BrandMark,
  GlassCard,
  SubmitButton,
} from '@/components/auth/AuthUI'
import { fadeUp } from '@/lib/motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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

  return (
    <AuthShell
      hero={
        <AuthHero
          title="Manage Your Store Smarter"
          subtitle="Inventory, billing, staff and analytics in one place."
        />
      }
    >
      <GlassCard>
        <div className="text-center">
          <BrandMark />
          <motion.h2
            variants={fadeUp}
            className="font-display mt-4 text-2xl font-bold tracking-tight text-[#e0e2ed]"
          >
            Welcome back
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-1 text-sm text-[#d1c5b0]">
            Sign in to your store dashboard.
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
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
                className="text-xs font-medium text-[#d1c5b0] transition-colors hover:text-[#e0e2ed]"
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

        <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-[#d1c5b0]">
          New store owner?{' '}
          <Link href="/signup" className="font-semibold text-[#e0e2ed] hover:underline">
            Set up your store
          </Link>
        </motion.p>
      </GlassCard>
    </AuthShell>
  )
}
