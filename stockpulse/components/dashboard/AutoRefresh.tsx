'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_INTERVAL_MS = 60_000
/** How often the "updated Ns ago" label re-renders. */
const LABEL_TICK_MS = 10_000

// Same approach as the station clock in MonitoringClient: reading Date.now()
// during render would make server and client disagree and break hydration, so
// the server snapshot is 0 and the real time arrives after hydration.
let cachedNow = 0
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribeToClock(onChange: () => void) {
  listeners.add(onChange)
  if (!timer) {
    timer = setInterval(() => {
      cachedNow = Date.now()
      listeners.forEach((l) => l())
    }, LABEL_TICK_MS)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

function getClientClock() {
  if (cachedNow === 0) cachedNow = Date.now()
  return cachedNow
}

function getServerClock() {
  return 0
}

function agoLabel(since: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - since) / 1000))
  if (seconds < 15) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  return minutes === 1 ? '1 min ago' : `${minutes} min ago`
}

/**
 * Re-runs the dashboard's server queries on an interval so the "live" badge
 * tells the truth. Backgrounded tabs are skipped and refreshed on return,
 * rather than polling Supabase for a screen nobody is looking at.
 */
export default function AutoRefresh({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter()
  const now = useSyncExternalStore(subscribeToClock, getClientClock, getServerClock)

  // Only ever set from an interval or event callback, never from an effect
  // body. Until the first refresh the page data is as old as this render, so
  // `now` is the correct baseline.
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const baseline = lastUpdated ?? now

  const refresh = useCallback(() => {
    router.refresh()
    cachedNow = Date.now()
    setLastUpdated(cachedNow)
  }, [router])

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return
      refresh()
    }, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  // Coming back to the tab should show current numbers immediately.
  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [refresh])

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5 text-xs font-semibold text-success">
      <span className="sp-pulse h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      {now > 0 ? (
        <>
          Updated <span className="tabular-nums">{agoLabel(baseline, now)}</span>
        </>
      ) : (
        'Live Updates Active'
      )}
    </span>
  )
}
