'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '@/app/auth/actions'
import {
  AuthError,
  AuthField,
  AuthShell,
  FormPanel,
  SubmitButton,
} from '@/components/auth/AuthUI'
import { fadeUp } from '@/lib/motion'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await requestPasswordReset(email)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <AuthShell>
      <FormPanel>
        <div className="text-center">
          <motion.h2
            variants={fadeUp}
            className="font-serif-brand mt-5 text-[22px] font-semibold tracking-[0.01em] text-foreground"
          >
            Reset Password
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-1 text-sm text-muted-strong">
            {sent
              ? 'Check your inbox for a reset link.'
              : "Enter your work email and we'll send you a reset link."}
          </motion.p>
        </div>

        {sent ? (
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-success bg-success/10 px-6 py-8 text-center"
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-sm text-muted-strong">
              If an account exists for <span className="font-semibold text-[#e0e2ed]">{email}</span>,
              you&apos;ll receive an email with instructions shortly.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && <AuthError message={error} />}

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

            <div className="pt-1">
              <SubmitButton loading={loading} loadingLabel="Sending…">
                Send Reset Link
                <ArrowRight className="h-4 w-4" />
              </SubmitButton>
            </div>
          </form>
        )}

        <motion.div variants={fadeUp}>
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-strong hover:text-[#e0e2ed]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </motion.div>
      </FormPanel>
    </AuthShell>
  )
}
