'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react'

/**
 * The boundary for everything outside the signed-in app — the landing page,
 * the auth screens, /privacy and /terms.
 *
 * `(dashboard)/error.tsx` only covers the authenticated group, and
 * `global-error.tsx` only fires when the root layout itself throws. Between
 * them a failure on /login or the landing page had no boundary at all and fell
 * through to Next's default screen — on the one page a prospective customer is
 * most likely to be looking at.
 *
 * Styled with the landing's permanently-dark scope rather than the app's
 * theme: these routes are dark regardless of the viewer's setting, and a light
 * error card dropped into the middle of them would be its own kind of broken.
 */
export default function PublicError({
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
    <div className="sp-landing flex min-h-screen items-center justify-center bg-background px-6 py-20">
      <div className="sp-rise w-full max-w-lg sp-e1 rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-bg">
          <AlertTriangle className="h-6 w-6 text-danger" aria-hidden="true" />
        </div>
        <h1 className="sp-title mt-5">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-strong">
          This page didn&apos;t load. Trying again usually works — if it doesn&apos;t, the
          service may be briefly unavailable.
        </p>

        {/* The digest is the only handle support has on a production error;
            React strips the message itself before it reaches the browser.
            Shown rather than hidden so someone reporting this has something to
            quote. */}
        {error.digest && (
          <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 font-mono text-xs text-muted">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={unstable_retry}
            className="control-h inline-flex items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="control-h inline-flex items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
