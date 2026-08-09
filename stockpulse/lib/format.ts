/**
 * The one place the app decides what money looks like.
 *
 * Everything below derives from this token, so switching the shop to another
 * currency is a two-line edit here rather than a hunt through every component
 * that prints a number. That matters because the previous version hard-coded
 * `$` and `en-US` inline in the formatter, and the symbol then leaked into
 * places the formatter never reached — a chart axis and a tooltip built their
 * own `$${...}` strings, so those two kept printing dollars no matter what
 * this function returned.
 *
 * Deliberately locale + code, NOT a symbol string. Intl derives `₹` from the
 * pair, and it also derives the digit grouping: en-IN groups by lakh and
 * crore, so 100000 renders `₹1,00,000.00` and not `₹100,000.00`. A hard-coded
 * symbol with a Western locale would have got the sign right and the grouping
 * wrong, which is the more embarrassing half to get wrong in a shop that
 * counts in lakhs.
 */
export const CURRENCY = {
  locale: 'en-IN',
  code: 'INR',
} as const

// Built once. Constructing an Intl.NumberFormat is the expensive part, and
// these run per row on tables that now carry hundreds of them.
const MONEY = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const MONEY_WHOLE = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  maximumFractionDigits: 0,
})

export function formatCurrency(n: number): string {
  return MONEY.format(n)
}

/**
 * Whole rupees, for chart axes and anywhere else two decimals are noise
 * rather than information.
 *
 * Not `notation: 'compact'`: en-IN compacts 4715 to "₹4.7T", where T is
 * thousand — indistinguishable at a glance from trillion, on an axis where
 * the reader has no other cue to the magnitude. `₹4,715` is longer and cannot
 * be misread.
 */
export function formatCurrencyWhole(n: number): string {
  return MONEY_WHOLE.format(n)
}

const MONEY_ASCII = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * "INR 1,00,000.00" — the same number, same grouping, no `₹`.
 *
 * For the PDF export only, and it is a measured requirement rather than a
 * preference. jsPDF's built-in Helvetica is WinAnsiEncoding (cp1252), which
 * has no rupee sign; `doc.internal.pdfEscape('₹')` returns `þÿ ¹`, a UTF-16
 * fallback the font cannot draw. The export would have shipped every figure
 * with a broken glyph in front of it, and it would have looked fine on screen
 * right up to the moment somebody opened the file.
 *
 * The alternative is embedding a Unicode font, which means carrying a ~100KB
 * binary in the repo for one glyph. A currency CODE is standard in financial
 * exports, so this is the cheaper correct answer rather than a compromise.
 * If a font is ever embedded, delete this and use formatCurrency.
 */
export function formatCurrencyAscii(n: number): string {
  return MONEY_ASCII.format(n)
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Formats a Date's LOCAL calendar date as YYYY-MM-DD. Never use .toISOString()
// for this — it converts to UTC and silently shifts the date in timezones
// ahead of UTC (e.g. local midnight IST becomes the previous day in UTC).
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * "Corner Market Grocery" -> "CM". Falls back to the first two characters of a
 * single-word name.
 *
 * Used wherever a logo or avatar might be missing. The sidebar, the topbar and
 * the mobile header each had their own copy of this, and the mobile one
 * disagreed with the other two — it took the first two letters of the whole
 * string rather than the initials of the first two words, so the same store
 * read "CO" in one place and "CM" in another.
 */
export function storeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
