'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * False during SSR and the hydration pass, true afterwards.
 *
 * The server cannot know the viewer's timezone, so any timestamp it formats in
 * "local" time is really the *server's* local time. Rendering that and then
 * correcting it on the client is a hydration mismatch. Instead every component
 * here renders a deterministic UTC form first, then switches to the viewer's
 * real zone once mounted — React expects the snapshot to change, so there is no
 * mismatch warning and no flash of wrong-by-a-day dates.
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/** Ticks so relative labels don't go stale while the page sits open. */
let cachedNow = 0
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribeToClock(onChange: () => void) {
  listeners.add(onChange)
  if (!timer) {
    timer = setInterval(() => {
      cachedNow = Date.now()
      listeners.forEach((l) => l())
    }, 30_000)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

function formatIn(iso: string, timeZone: string | undefined, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-US', timeZone ? { ...opts, timeZone } : opts)
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
const DATE_YEAR_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/** A calendar date in the viewer's timezone. */
export function LocalDate({ iso, withYear = false }: { iso: string; withYear?: boolean }) {
  const hydrated = useIsHydrated()
  const opts = withYear ? DATE_YEAR_OPTS : DATE_OPTS
  return <>{formatIn(iso, hydrated ? undefined : 'UTC', opts)}</>
}

/** Date and clock time in the viewer's timezone. */
export function LocalDateTime({ iso }: { iso: string }) {
  const hydrated = useIsHydrated()
  const tz = hydrated ? undefined : 'UTC'
  return (
    <>
      {formatIn(iso, tz, DATE_OPTS)}, {formatIn(iso, tz, TIME_OPTS)}
    </>
  )
}

/**
 * Today's calendar date in the viewer's zone as YYYY-MM-DD, or null until
 * hydrated. Callers must treat null as "unknown" rather than substituting the
 * server's date — that is exactly the mismatch this avoids.
 */
export function useLocalToday(): string | null {
  const hydrated = useIsHydrated()
  if (!hydrated) return null
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function relativeLabel(iso: string, now: number): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * "2h ago". Relative to *now*, which the server doesn't share with the client,
 * so the server renders an absolute date and the client takes over after mount.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const hydrated = useIsHydrated()
  const now = useSyncExternalStore(
    subscribeToClock,
    () => {
      if (cachedNow === 0) cachedNow = Date.now()
      return cachedNow
    },
    () => 0,
  )

  if (!hydrated || now === 0) return <>{formatIn(iso, 'UTC', DATE_OPTS)}</>
  return <>{relativeLabel(iso, now)}</>
}
