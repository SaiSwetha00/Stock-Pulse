/**
 * The one zone every daily rollup is bucketed in.
 *
 * Day boundaries used to come from `new Date(...)` inside the Node process,
 * which resolves to whatever zone the machine runs in: UTC on Vercel, the
 * developer's own zone locally. The same store's "today's takings" therefore
 * differed between environments, and a sale logged at 02:00 IST landed on the
 * previous day in production. Naming the zone once, here, and passing it to
 * the aggregate functions in migration 0004 removes that.
 *
 * UTC is the default because Vercel is the canonical environment and already
 * behaves this way — so this is a no-op there and a fix locally. Set
 * STORE_TIMEZONE to an IANA name (e.g. 'Asia/Kolkata') to report on the
 * store's own clock instead; it belongs in the environment rather than in the
 * stores table only until a second store needs a different one.
 */
export const REPORTING_TIMEZONE = process.env.STORE_TIMEZONE?.trim() || 'UTC'

/**
 * `en-CA` is not a stylistic choice — it is the locale whose short date format
 * is exactly YYYY-MM-DD, which is what Postgres wants for a `date` argument.
 */
const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORTING_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The calendar date in the reporting zone, as YYYY-MM-DD. */
/**
 * The time-of-day greeting, on the SHOP's clock rather than the reader's.
 *
 * This used to be computed in the browser, because the server cannot know the
 * reader's timezone. Measuring Phase 7B showed what that cost: the greeting
 * `<h1>` is the dashboard's largest text element, so rewriting it at hydration
 * made it a fresh LCP candidate at 5440ms on a 4x-throttled phone — the page's
 * headline arriving seconds after it was first painted. The same rewrite was
 * also the CLS source 7A fixed.
 *
 * Reading the store timezone removes the rewrite entirely, and is the more
 * defensible answer anyway: every other time in this app — reporting periods,
 * rota days, sales days — is already on `STORE_TIMEZONE`. A manager checking
 * in from another country should be greeted by their shop's morning, not their
 * own evening, for the same reason their sales figures are the shop's day.
 *
 * If `STORE_TIMEZONE` is unset this follows UTC, exactly as every other
 * reporting boundary already does — so an unset value is a pre-existing
 * problem this makes visible rather than a new one it creates.
 */
export function storeGreeting(at: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: REPORTING_TIMEZONE,
      hour: '2-digit',
      hour12: false,
    }).format(at),
  )
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function reportingDate(at: Date = new Date()): string {
  return DATE_FORMAT.format(at)
}

/**
 * Calendar arithmetic on a YYYY-MM-DD string.
 *
 * Done in UTC on purpose. Shifting a real instant by 24h crosses DST twice a
 * year and lands on the same calendar day or skips one; shifting the date
 * fields of a zone-less value cannot, because no clock is involved.
 */
export function shiftDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

/** Day-of-week index (0 = Sunday) for a YYYY-MM-DD string, for DAY_LABELS. */
export function weekdayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
