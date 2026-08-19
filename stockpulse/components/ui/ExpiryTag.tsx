import { expiryRelative, expiryTone, formatExpiry } from '@/lib/expiry'

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
}: {
  date: string | null
  today: string
  warningDays: number
  lots?: number
  variant?: 'line' | 'inline'
}) {
  // No date is a real answer, not a missing one — most of what a kirana shop
  // sells never expires. It is said in muted grey and never in a warning
  // colour, because "this soap has no expiry" is not a problem to solve.
  // Saying nothing at all would be worse: the reader could not tell an
  // unexpiring product from one whose date nobody has entered yet.
  if (!date) {
    return (
      <span className={variant === 'line' ? 'block text-xs text-muted' : 'text-xs text-muted'}>
        No expiry date
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
        tone === 'expired' ? 'Expired' : tone === 'soon' ? 'Expiring soon' : 'Expires'
      } ${formatExpiry(date)}, ${expiryRelative(date, today)}`}
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
        {tone === 'expired' ? 'Expired' : 'Expires'} {formatExpiry(date)}
      </span>
      <span className="text-muted"> · {expiryRelative(date, today)}</span>
      {lots > 1 && (
        <span className="text-muted">
          {' '}
          · +{lots - 1} more lot{lots === 2 ? '' : 's'}
        </span>
      )}
    </span>
  )
}
