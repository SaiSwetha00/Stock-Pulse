import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
  description: 'StockPulse could not reach the network.',
  robots: { index: false, follow: false },
}

/**
 * What the service worker shows when a navigation cannot reach the network.
 *
 * Deliberately outside the (dashboard) route group, so it does NOT render the
 * sidebar, the topbar, or anything that calls `getCurrentUser()`. A page the
 * worker must serve with no network cannot depend on a session lookup that
 * needs one — and it must not be personalised, because it is the one document
 * cached on what is often a shared shop phone.
 *
 * It also says nothing reassuring about work being saved, because in Phase 1
 * none is. Promising a queue that does not exist would be the most expensive
 * sentence on this screen: a cashier who believed it would keep ringing up
 * sales into a void. When the queue lands, this copy changes with it.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="sp-eyebrow">StockPulse</p>
        <h1 className="sp-title mt-3">No connection</h1>
        <p className="sp-body mt-3">
          This page needs the network and could not reach it. Your shop&apos;s data is safe on the
          server — nothing has been lost.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-surface-muted p-4 text-left">
          <p className="text-sm font-semibold text-foreground">While you are offline</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-strong">
            <li>Sales and stock changes cannot be saved yet.</li>
            <li>Anything you had already saved is unaffected.</li>
            <li>Move somewhere with signal and reload this page.</li>
          </ul>
        </div>

        {/* A plain link, not a button with an onClick. This document is served
            by the service worker and must work whether or not any JavaScript
            beyond it has loaded. */}
        <a
          href="/dashboard"
          className="control-h mt-6 inline-flex items-center justify-center rounded-lg bg-foreground px-5 text-sm font-semibold text-surface"
        >
          Try again
        </a>
      </div>
    </main>
  )
}
