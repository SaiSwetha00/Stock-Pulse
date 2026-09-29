'use client'

import { useSyncExternalStore } from 'react'
import { useAppCopy, useLocale } from '@/lib/i18n/client'
import { clockOptions, intlLocale } from '@/lib/i18n/dates'
import type { RelativeTimeCopy } from '@/lib/format'

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

/**
 * `locale` is a BCP-47 tag from intlLocale(), never a raw 'te'/'hi' code, and
 * never omitted: leaving it out formats in the *machine's* locale, which
 * differs between the server render and the browser and ignores the language
 * the shopkeeper actually chose.
 */
function formatIn(
  iso: string,
  locale: string,
  timeZone: string | undefined,
  opts: Intl.DateTimeFormatOptions,
) {
  return new Date(iso).toLocaleString(locale, timeZone ? { ...opts, timeZone } : opts)
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
const DATE_YEAR_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

/** A calendar date in the viewer's timezone. */
export function LocalDate({ iso, withYear = false }: { iso: string; withYear?: boolean }) {
  const hydrated = useIsHydrated()
  const locale = intlLocale(useLocale())
  const opts = withYear ? DATE_YEAR_OPTS : DATE_OPTS
  return <>{formatIn(iso, locale, hydrated ? undefined : 'UTC', opts)}</>
}

/** Date and clock time in the viewer's timezone. */
export function LocalDateTime({ iso }: { iso: string }) {
  const hydrated = useIsHydrated()
  const locale = intlLocale(useLocale())
  const tz = hydrated ? undefined : 'UTC'
  return (
    <>
      {formatIn(iso, locale, tz, DATE_OPTS)}, {formatIn(iso, locale, tz, clockOptions(locale))}
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

/**
 * Same wording as lib/format.ts#formatRelativeTime, against a supplied `now`
 * rather than the clock, because this one re-renders on a 30s tick. The copy
 * type is shared so the two say the same thing in every language.
 */
function relativeLabel(iso: string, now: number, copy: RelativeTimeCopy): string {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (mins < 1) return copy.relJustNow
  if (mins < 60) return copy.relMinutesAgo.replace('{n}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return copy.relHoursAgo.replace('{n}', String(hours))
  return copy.relDaysAgo.replace('{n}', String(Math.floor(hours / 24)))
}

/**
 * "2h ago". Relative to *now*, which the server doesn't share with the client,
 * so the server renders an absolute date and the client takes over after mount.
 */
export function RelativeTime({ iso }: { iso: string }) {
  const hydrated = useIsHydrated()
  const locale = intlLocale(useLocale())
  const copy = useAppCopy().common
  const now = useSyncExternalStore(
    subscribeToClock,
    () => {
      if (cachedNow === 0) cachedNow = Date.now()
      return cachedNow
    },
    () => 0,
  )

  if (!hydrated || now === 0) return <>{formatIn(iso, locale, 'UTC', DATE_OPTS)}</>
  return <>{relativeLabel(iso, now, copy)}</>
}
