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

/** How far ahead counts as "use it now" rather than merely "dated". */
export const EXPIRY_SOON_DAYS = 7

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
 * How urgent this date is, given the shop's today.
 *
 * A date in the PAST is 'expired' — a real and useful state, not an input
 * error, which is why validation accepts past dates in the first place. A date
 * FAR in the future is simply 'ok': it is stored and shown, and nothing
 * pretends to be more interested in 2071 than in 2029.
 */
export function expiryTone(isoDate: string, today: string): ExpiryTone {
  if (isoDate < today) return 'expired'
  if (isoDate <= shiftDays(today, EXPIRY_SOON_DAYS)) return 'soon'
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
