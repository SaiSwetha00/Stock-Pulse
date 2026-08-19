'use client'

import { useEffect } from 'react'

/**
 * Registers /sw.js, and nothing else.
 *
 * Renders no markup on purpose — it exists so the root layout can stay a
 * Server Component. `navigator.serviceWorker` only exists in the browser, so
 * this cannot happen during the server render.
 *
 * Registered AFTER load rather than during it. The worker's install step
 * fetches the offline page, and doing that while the first screen is still
 * competing for bandwidth is how a service worker makes a phone feel slower
 * rather than faster.
 *
 * A failure is swallowed on purpose. Registration is refused in several
 * perfectly healthy situations — Safari private browsing, an insecure origin,
 * a user who has disabled storage — and in every one of them the app works
 * exactly as it did before this file existed. Surfacing an error would tell a
 * shopkeeper about a capability they never asked for and cannot act on. It is
 * still logged, so the reason is recoverable from a console.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Dev serves modules unbundled and Turbopack rewrites them constantly; a
    // worker caching that churn produces "why is my edit not showing" bugs
    // that have nothing to do with the app. Production is where installability
    // matters anyway.
    if (process.env.NODE_ENV !== 'production') return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.warn('[pwa] service worker registration failed:', err)
      })
    }

    if (document.readyState === 'complete') {
      register()
      return
    }
    window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
