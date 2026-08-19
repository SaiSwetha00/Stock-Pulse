import type { Product, ProductBatch } from '@/types'
import { shiftDays } from '@/lib/reportingTimezone'

/**
 * Reading `product_batches` back out: which date to show, and how loudly.
 *
 * Everything here works on YYYY-MM-DD STRINGS and never constructs a Date to
 * compare them. Two reasons, both of which this project has been bitten by
 * once already:
 *
 *  - `new Date('2026-08-24')` is parsed as UTC midnight, so in any zone ahead
 *    of UTC it renders as the 23rd. `toLocalISODate` carries the same warning.
 *  - ISO dates sort and compare correctly as plain strings, so `a < b` is the
 *    whole of the arithmetic and there is no clock in it.
 *
 * `today` is always PASSED IN, never read here. The inventory page computes it
 * once with `reportingDate()` — the shop's clock, the same boundary every
 * report already uses — and hands it to the client component. If this module
 * read the clock itself, the server render and the hydration render could fall
 * on different days for anyone browsing near midnight, and React would swap an
 * "Expired" badge under the reader between the two passes.
 */


/**
 * The default window, and the fallback when 0017 has not been applied.
 *
 * Seven days is the brief's number and it is also the one a grocer can act on:
 * long enough to discount and move a crate, short enough that the list is not
 * everything perishable in the shop.
 */
export const EXPIRY_WARNING_DAYS_DEFAULT = 7

/** The widest the setting may be, mirroring 0017's CHECK exactly. */
export const MIN_EXPIRY_WARNING_DAYS = 1
export const MAX_EXPIRY_WARNING_DAYS = 90

export type ExpiryTone = 'expired' | 'soon' | 'ok'

/**
 * The date the shopkeeper needs to act on: the earliest expiry among lots that
 * still have something in them.
 *
 * Lots with `quantity = 0` are skipped. 0016 keeps those deliberately — a lot
 * that has sold out but is retained for its history — and warning about stock
 * that is no longer on the shelf is how a warning becomes background noise.
 *
 * Returns null both when a product has no lots and when none of its lots carry
 * a date. Those are the same answer to the question this asks ("what is the
 * next thing to go off?"), and the list shows the same em dash for both.
 */
export function nextExpiry(batches: ProductBatch[] | undefined): string | null {
  if (!batches || batches.length === 0) return null
  let earliest: string | null = null
  for (const b of batches) {
    if (b.quantity <= 0 || !b.expiry_date) continue
    if (earliest === null || b.expiry_date < earliest) earliest = b.expiry_date
  }
  return earliest
}

/** Convenience for the call sites that hold a product, not its lots. */
export function productNextExpiry(product: Product): string | null {
  return nextExpiry(product.product_batches)
}

/**
 * How urgent this date is, given the shop's today and the shop's window.
 *
 * A date in the PAST is 'expired' — a real and useful state, not an input
 * error, which is why validation accepts past dates in the first place. A date
 * FAR in the future is simply 'ok': it is stored and shown, and nothing
 * pretends to be more interested in 2071 than in 2029.
 *
 * `warningDays` became a PARAMETER in Phase 4, and the reason is a bug this
 * function was already carrying. Phase 3 made the window a per-store setting
 * (`stores.expiry_warning_days`, migration 0017) and taught the dashboard to
 * read it — but this function kept its own hardcoded `EXPIRY_SOON_DAYS = 7`,
 * so a shop that set 14 would have been told "expiring soon" on the dashboard
 * while the inventory list showed the very same lot in neutral grey until day
 * 7. Nothing surfaced it because every store still holds the default of 7, so
 * the two numbers agreed by coincidence rather than by construction.
 *
 * The default is kept so a caller that genuinely has no store in hand still
 * gets the documented behaviour instead of NaN — but every caller in the app
 * passes `storeExpiryWarningDays(store)`.
 */
export function expiryTone(
  isoDate: string,
  today: string,
  warningDays: number = EXPIRY_WARNING_DAYS_DEFAULT,
): ExpiryTone {
  if (isoDate < today) return 'expired'
  if (isoDate <= shiftDays(today, warningDays)) return 'soon'
  return 'ok'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "2026-08-24" -> "24 Aug 2026".
 *
 * Built from the string's own parts rather than from `toLocaleDateString`,
 * which needs a Date and therefore reintroduces the UTC shift this module
 * exists to avoid. It also makes the output identical on the server and in the
 * browser regardless of either machine's locale settings.
 */
export function formatExpiry(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  const month = MONTHS[Number(m) - 1]
  // A value that is not a date we recognise is shown as it was stored rather
  // than as "undefined" — validation should make this unreachable, and a row
  // that reaches it is more useful readable than tidy.
  if (!month) return isoDate
  return `${Number(d)} ${month} ${y}`
}


/**
 * This store's warning window.
 *
 * Read through here, never off the property, because `expiry_warning_days` is
 * optional in the type: the app has to render against a database where 0017
 * has not been applied, and `undefined * 1` silently becomes NaN, which would
 * make `shiftDays` produce "NaN-aN-aN" and every comparison false — a
 * dashboard that quietly reports nothing expiring, which is the worst possible
 * failure for an alerting feature because it looks exactly like good news.
 */
export function storeExpiryWarningDays(store: { expiry_warning_days?: number }): number {
  const days = store.expiry_warning_days
  if (typeof days !== 'number' || !Number.isFinite(days) || days < MIN_EXPIRY_WARNING_DAYS) {
    return EXPIRY_WARNING_DAYS_DEFAULT
  }
  return Math.min(days, MAX_EXPIRY_WARNING_DAYS)
}

/**
 * How many days from `today` until `isoDate`. Negative when already past.
 *
 * Whole days on the calendar, not elapsed time — `shiftDays` walks date fields
 * in UTC precisely so DST cannot make a day 23 or 25 hours long here.
 */
export function daysUntil(isoDate: string, today: string): number {
  // Linear search would be silly; step by comparing shifted strings instead.
  // Bounded either side by the widest window plus a year of already-expired
  // stock, which is far past the point where the exact number stops mattering.
  const [ty, tm, td] = today.split('-').map(Number)
  const [ey, em, ed] = isoDate.split('-').map(Number)
  const MS = 24 * 60 * 60 * 1000
  return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / MS)
}

/**
 * "in 3 days" / "today" / "5 days ago".
 *
 * Said in words rather than left as a date, because the whole point of the
 * list is urgency and a reader should not be subtracting dates in their head.
 */
export function expiryRelative(isoDate: string, today: string): string {
  const d = daysUntil(isoDate, today)
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d > 1) return `in ${d} days`
  if (d === -1) return 'yesterday'
  return `${Math.abs(d)} days ago`
}
