/**
 * The locale constants, with no dictionary attached.
 *
 * WHY THEY LIVE IN A LEAF MODULE. app/layout.tsx — the root layout, and so
 * part of every route's server bundle — needs the cookie name and the list of
 * codes to set <html lang> before paint. Importing those from ./index would
 * pull LANDING_COPY (every string, in three languages) along with them, into
 * every route. This module imports nothing, so it costs nothing.
 *
 * It also breaks a genuine cycle: ./landing needs the `Locale` type and
 * ./index needs ./landing's dictionary. That worked only because the first was
 * a type-only import and erased at compile time — fragile, and now moot.
 */

export const LOCALES = ['en', 'te', 'hi'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * Each language named in its own script, which is the only labelling that
 * works: someone looking for Telugu is looking for "తెలుగు", not for the word
 * "Telugu" spelled in an alphabet they may not read.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिन्दी',
}

/** Short form, for anywhere there is room for only a few glyphs. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  te: 'తె',
  hi: 'हि',
}

/**
 * Read on the server, written by the selector in the browser. Not `httpOnly`
 * precisely because the client half sets it; it carries a display preference
 * and nothing else, so it is not a credential and there is nothing in it worth
 * protecting. SameSite=Lax, one year. Disclosed in app/privacy.
 */
export const LOCALE_COOKIE = 'sp-locale'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Anything that is not one of the three supported codes becomes English. The
 * cookie is user-writable, so this is the guard that stops an arbitrary value
 * reaching a dictionary lookup.
 */
export function toLocale(value: string | undefined | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE
}
