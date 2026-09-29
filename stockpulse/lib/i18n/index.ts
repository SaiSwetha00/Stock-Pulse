import type { Locale } from './locales'
import { LANDING_COPY, type LandingCopy } from './landing'

/**
 * THE app's language module. There is exactly one, and this is it.
 *
 * WHAT IT COVERS TODAY: the public landing page, and nothing else. The
 * authenticated app is not translated — it has no language selector and reads
 * nothing from here — which is deliberate rather than unfinished. Adding a
 * surface means adding its strings to ./landing (or a sibling file beside it)
 * and reading them the same way; it does NOT mean starting a second system.
 *
 * WHY IT IS HAND-ROLLED AND NOT next-intl. next-intl and friends want
 * locale-prefixed routes (/en, /te, /hi), which would change every existing
 * route and put the locale through proxy.ts — the session-refresh path. Three
 * locales and one page do not justify either. If the app itself is ever
 * translated, that is the moment to reach for a library, and the shape here —
 * one typed dictionary per locale — is what such a migration would read from.
 *
 * WHY A COOKIE RATHER THAN localStorage. The landing page is a Server
 * Component, so with a cookie the server renders the chosen language in the
 * first HTML: no flash of English, no hydration mismatch, and the choice
 * survives a reload and a reopened tab. localStorage cannot be read on the
 * server, so it would have meant rendering English and swapping it after
 * hydration — visible, and on a marketing page it is the first thing a visitor
 * sees. The cookie costs nothing here because app/page.tsx is already dynamic:
 * it calls supabase.auth.getUser() on every request regardless.
 *
 * THE CONSTANTS LIVE IN ./locales, not here, so app/layout.tsx can read the
 * cookie name without pulling the dictionary into every route. Import from
 * either — everything is re-exported below.
 */

export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_SHORT,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  toLocale,
} from './locales'

export type { Locale } from './locales'

/** The landing page's copy in the given language. */
export function landingCopy(locale: Locale): LandingCopy {
  return LANDING_COPY[locale]
}

export type { LandingCopy }
