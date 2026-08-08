'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-[1400px] items-center justify-center px-6 py-20 lg:px-8">
      <div className="w-full max-w-lg sp-rise rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-bg">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This page couldn&apos;t finish loading. Retrying will re-fetch the data; if it keeps
          failing, the store database may be unreachable.
        </p>

        <p className="mt-4 break-words rounded-lg bg-surface-muted px-3.5 py-2.5 font-mono text-xs text-muted-strong">
          {error.message || 'Unknown error'}
          {error.digest && <span className="block text-muted">digest: {error.digest}</span>}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => unstable_retry()}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex control-h items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-strong transition hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
