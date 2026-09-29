import { appCopy } from './app'
import { intlLocale } from './dates'
import type { Locale } from './locales'
import { PRODUCT_SHOT_STRINGS, type ProductShotCopy } from './productShot'
import { SNAPSHOT_DATE } from '@/components/landing/snapshot'

/**
 * The product previews' words for one language, completed with the app's own
 * vocabulary. SERVER ONLY — it imports the full app dictionary, which must
 * never reach a browser bundle. Callers hand the resolved object down as a
 * prop, the same shape every other translated surface uses.
 *
 * Nav labels, expiry words and the seeded category names are taken from the
 * app dictionary rather than restated, so the preview cannot disagree with the
 * app it depicts.
 *
 * Dates are formatted by ICU in the reader's locale. The dashboard's day line
 * is the preview's own fixed date (19 September 2026, a Saturday), and the
 * caption date is the snapshot's. English keeps the exact strings it shipped
 * with rather than being re-derived.
 */
export function resolveProductShot(locale: Locale): ProductShotCopy {
  const base = PRODUCT_SHOT_STRINGS[locale]
  const app = appCopy(locale)
  const withApp: ProductShotCopy = {
    ...base,
    nav: app.nav,
    expiry: app.expiry,
    categoryNames: app.categoryNames,
  }
  if (locale === 'en') return withApp

  const tag = intlLocale(locale)
  const utc = (iso: string) => new Date(`${iso}T00:00:00Z`)
  return {
    ...withApp,
    dateLine: new Intl.DateTimeFormat(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(utc('2026-09-19')),
    snapshotLabel: new Intl.DateTimeFormat(tag, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(utc(SNAPSHOT_DATE)),
  }
}
