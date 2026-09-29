import { expiryRelative, expiryTone, formatExpiry } from '@/lib/expiry'
import type { ExpiryCopy } from '@/lib/i18n/app'

/**
 * English, and the fallback when no dictionary is handed in.
 *
 * The copy arrives as a PROP rather than from useAppCopy(), because this is
 * one of the few components rendered on both sides of the sign-in: the landing
 * page's product panels are Server Components with no AppCopyProvider above
 * them. A prop keeps this a Server Component, and keeps the state word and the
 * relative phrase travelling together so a line cannot come out half
 * translated.
 */
const EN: ExpiryCopy = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  expired: 'Expired',
  expiringSoon: 'Expiring soon',
  expires: 'Expires',
  noDate: 'No expiry date',
  moreLot: '+{n} more lot',
  moreLots: '+{n} more lots',
  relToday: 'today',
  relTomorrow: 'tomorrow',
  relYesterday: 'yesterday',
  relInDays: 'in {n} days',
  relDaysAgo: '{n} days ago',
}

/**
 * One line saying when a product's nearest lot goes off, and how worried to be.
 *
 * WHY ONE LINE AND NOT A LIST. A product can carry many lots, and the scan
 * surfaces are the two places in the app where the reader is holding something
 * — a phone at a shelf, or a customer's shopping at a till. Neither can afford
 * a table. So this shows the NEAREST at-risk date only, which is the same
 * number `nextExpiry` feeds the inventory column and the dashboard tile, and
 * the same number a person would act on: the earliest thing to go off decides
 * whether this item gets sold, discounted or pulled.
 *
 * `lots` is therefore not rendered as a list but as a count, and only when it
 * is greater than one — "+2 more lots" tells the reader a fuller picture
 * exists without making them read it here. That fuller picture already has a
 * home: ProductModal lists every lot with its own quantity and date.
 *
 * NO CLOCK IS READ HERE. `today` and `warningDays` are both passed in, from
 * `reportingDate()` and `storeExpiryWarningDays(store)` on the server. A
 * component that decided either for itself would tone the same lot differently
 * between the server render and hydration across midnight, and would ignore a
 * shop that had moved its threshold off the default.
 */
export default function ExpiryTag({
  date,
  today,
  warningDays,
  lots = 1,
  /** `line` for stacked contexts (a cart row); `inline` to sit after text. */
  variant = 'line',
  copy = EN,
}: {
  date: string | null
  today: string
  warningDays: number
  lots?: number
  variant?: 'line' | 'inline'
  copy?: ExpiryCopy
}) {
  // No date is a real answer, not a missing one — most of what a kirana shop
  // sells never expires. It is said in muted grey and never in a warning
  // colour, because "this soap has no expiry" is not a problem to solve.
  // Saying nothing at all would be worse: the reader could not tell an
  // unexpiring product from one whose date nobody has entered yet.
  if (!date) {
    return (
      <span className={variant === 'line' ? 'block text-xs text-muted' : 'text-xs text-muted'}>
        {copy.noDate}
      </span>
    )
  }

  const tone = expiryTone(date, today, warningDays)
  const colour =
    tone === 'expired' ? 'text-danger' : tone === 'soon' ? 'text-warning' : 'text-muted-strong'

  return (
    <span
      className={`${variant === 'line' ? 'block' : ''} text-xs ${colour}`}
      // Read out as one phrase rather than as the three fragments a screen
      // reader would otherwise announce with the dot separators between them.
      aria-label={`${
        tone === 'expired' ? copy.expired : tone === 'soon' ? copy.expiringSoon : copy.expires
      } ${formatExpiry(date, copy.months)}, ${expiryRelative(date, today, copy)}`}
    >
      {/* The dot is the same size in all three states, so a row does not
          reflow when a lot crosses from soon to expired overnight. */}
      <span
        aria-hidden="true"
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
          tone === 'expired' ? 'bg-danger' : tone === 'soon' ? 'bg-warning' : 'bg-border-strong'
        }`}
      />
      <span className={tone === 'ok' ? '' : 'font-semibold'}>
        {tone === 'expired' ? copy.expired : copy.expires} {formatExpiry(date, copy.months)}
      </span>
      <span className="text-muted"> · {expiryRelative(date, today, copy)}</span>
      {lots > 1 && (
        <span className="text-muted">
          {' '}
          · {(lots === 2 ? copy.moreLot : copy.moreLots).replace('{n}', String(lots - 1))}
        </span>
      )}
    </span>
  )
}
