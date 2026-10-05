'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react'
import { useAppCopy } from '@/lib/i18n/client'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const t = useAppCopy().errors

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-[1400px] items-center justify-center px-6 py-20 lg:px-8">
      <div className="w-full max-w-lg sp-rise sp-e1 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-bg">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
          {t.errorTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t.errorBody}
        </p>

        <p className="mt-4 break-words rounded-lg bg-surface-muted px-3.5 py-2.5 font-mono text-xs text-muted-strong">
          {error.message || t.unknownError}
          {error.digest && <span className="block text-muted">digest: {error.digest}</span>}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => unstable_retry()}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            {t.tryAgain}
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex control-h items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-strong transition hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    </div>
  )
}
