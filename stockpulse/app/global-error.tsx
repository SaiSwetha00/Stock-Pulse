'use client'

/**
 * Last-resort boundary. `(dashboard)/error.tsx` only covers that segment, so
 * anything thrown by the root layout — or by the marketing and auth pages,
 * which sit outside the dashboard group — previously fell through to Next's
 * unstyled default screen.
 *
 * A global-error boundary replaces the whole document, so it must render its
 * own <html> and <body> and cannot rely on the root layout's fonts or styles.
 * Everything here is therefore inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fbfaf8',
          color: '#14171a',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 24px', lineHeight: 1.6, color: '#4a5157' }}>
            StockPulse hit an unexpected error and could not finish loading. Your
            data has not been changed.
          </p>
          {/* The digest is the only handle support has for finding this in the
              server logs; the message itself is deliberately not shown, as it
              can contain internals. */}
          {error.digest && (
            <p style={{ margin: '0 0 24px', fontSize: '0.75rem', color: '#6b7379' }}>
              Reference: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: '44px',
                padding: '0 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#14171a',
                color: '#fbfaf8',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* Deliberately a plain anchor, not next/link: this boundary only
                renders when the React tree has already failed, so a
                client-side navigation would re-enter the broken app. A full
                document load is the recovery. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 20px',
                borderRadius: '10px',
                border: '1px solid #e6e2db',
                color: '#14171a',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
