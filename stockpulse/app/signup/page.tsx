'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Lock, Mail, Store, User } from 'lucide-react'
import { signUpOwner } from '@/app/auth/actions'
import AuthHero from '@/components/auth/AuthHero'
import {
  AuthError,
  AuthField,
  AuthShell,
  BrandMark,
  GlassCard,
  SubmitButton,
} from '@/components/auth/AuthUI'
import { EASE, fadeUp, slideX } from '@/lib/motion'

const STEPS = [
  { title: 'Name your store', blurb: 'What should we call your workspace?' },
  { title: 'About you', blurb: 'Tell us who owns this store.' },
  { title: 'Secure your account', blurb: 'Set your sign-in credentials.' },
] as const

export default function SignupPage() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [storeName, setStoreName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current)
    },
    []
  )

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const stepValid = [
    storeName.trim().length > 1,
    fullName.trim().length > 1,
    emailValid && password.length >= 8,
  ][step]

  function go(next: 1 | -1) {
    setError('')
    setDir(next)
    setStep((s) => Math.min(2, Math.max(0, s + next)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stepValid) return
    setError('')
    setSubmitting(true)

    // No error back within this window means the account was accepted and the
    // server action is redirecting — show the success state while it lands.
    successTimer.current = setTimeout(() => setSucceeded(true), 1200)

    const result = await signUpOwner({ storeName, fullName, email, password })

    if (result?.error) {
      if (successTimer.current) clearTimeout(successTimer.current)
      setSucceeded(false)
      setSubmitting(false)
      setError(result.error)
    }
  }

  const progress = succeeded ? 3 : step + 1

  return (
    <AuthShell
      hero={
        <AuthHero
          title="Launch Your Store in Minutes"
          subtitle="Create your workspace and start managing inventory instantly."
        />
      }
    >
      <GlassCard>
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#d1c5b0]">
            <span>Step {Math.min(step + 1, 3)} of 3</span>
            <span>{Math.round((progress / 3) * 100)}%</span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            <motion.div
              className="h-full rounded-full bg-[#edc155]"
              initial={false}
              animate={{ width: `${(progress / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {succeeded ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edc155]/15"
              >
                <Check className="h-8 w-8 text-[#edc155]" strokeWidth={3} />
              </motion.div>
              <h2 className="font-display mt-5 text-xl font-bold text-[#e0e2ed]">Store created</h2>
              <p className="mt-1 text-sm text-[#d1c5b0]">Taking you to your dashboard…</p>
            </motion.div>
          ) : (
            <motion.form
              key={step}
              variants={slideX(dir)}
              initial="hidden"
              animate="show"
              exit="exit"
              onSubmit={
                step === 2
                  ? handleSubmit
                  : (e) => {
                      e.preventDefault()
                      if (stepValid) go(1)
                    }
              }
            >
              <div className="text-center">
                <BrandMark />
                <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-[#e0e2ed]">
                  {STEPS[step].title}
                </h2>
                <p className="mt-1 text-sm text-[#d1c5b0]">{STEPS[step].blurb}</p>
              </div>

              <div className="mt-6 space-y-4">
                {error && <AuthError message={error} />}

                {step === 0 && (
                  <AuthField
                    label="Store Name"
                    icon={Store}
                    value={storeName}
                    onChange={setStoreName}
                    placeholder="e.g. Corner Grocer"
                    autoComplete="organization"
                    required
                    autoFocus
                  />
                )}

                {step === 1 && (
                  <AuthField
                    label="Full Name"
                    icon={User}
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    required
                    autoFocus
                  />
                )}

                {step === 2 && (
                  <>
                    <AuthField
                      label="Work Email"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="jane@cornergrocer.com"
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
                      autoComplete="new-password"
                      required
                      hint="Must be at least 8 characters long."
                    />
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {step > 0 && (
                  <SubmitButton
                    type="button"
                    variant="ghost"
                    onClick={() => go(-1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </SubmitButton>
                )}
                <SubmitButton
                  loading={submitting}
                  loadingLabel="Creating…"
                  className={step > 0 ? 'flex-1' : ''}
                >
                  {step === 2 ? 'Create Account' : 'Continue'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </SubmitButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {!succeeded && (
          <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-[#d1c5b0]">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-[#e0e2ed] hover:underline">
              Sign in
            </Link>
          </motion.p>
        )}
      </GlassCard>
    </AuthShell>
  )
}
