import type { Locale } from './locales'

/**
 * The BCP-47 tag Intl formats dates and times with, one per language.
 *
 * WHY A TABLE AND NOT THE BARE CODE. `toLocaleString('te')` resolves, but to
 * the language with no region, leaving the calendar and the 12/24-hour choice
 * to ICU's defaults rather than to India's. Every shop using this app keeps
 * Indian hours, so the region is pinned.
 *
 * WHY ENGLISH IS `en-US` AND NOT `en-IN`. It is what every call site passed
 * before this table existed, so English output is byte-identical to what
 * shipped. Translating the other two languages must not quietly rewrite every
 * date in the default one, and `en-IN` would ("Aug 24" becomes "24 Aug").
 *
 * WHY NOT `undefined`, the runtime's own locale. That is the machine's
 * setting, not the reader's choice: the same page would format one way on the
 * server and another in the browser, and a shopkeeper who picked Telugu on a
 * phone set to English would still be shown English dates.
 *
 * This module imports nothing but a type, for the same reason ./locales does:
 * it is read from Client Components that must not pull a dictionary in with it.
 */
const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN',
}

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale]
}

/**
 * Options for a clock time ("05:56 AM") in the given BCP-47 tag.
 *
 * English keeps exactly what every call site passed before, so its output is
 * byte-identical. Telugu and Hindi ask ICU for its FLEXIBLE day period
 * instead ("సాయంత్రం 3:16", "दोपहर 3:16"): ICU's te-IN and hi-IN 12-hour
 * forms print the Latin letters AM/PM and am/pm, which put English in the
 * middle of every Telugu or Hindi timestamp. The flexible period is ICU's own
 * word in each language, so nothing here is translated by hand.
 */
export function clockOptions(tag: string): Intl.DateTimeFormatOptions {
  return tag.startsWith('en')
    ? { hour: '2-digit', minute: '2-digit' }
    : { hour: 'numeric', minute: '2-digit', dayPeriod: 'short' }
}
