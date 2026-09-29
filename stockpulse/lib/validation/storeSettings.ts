/**
 * Store settings validation.
 *
 * Settings had none. `stores.name` is `not null` but not `not blank`, so
 * clearing the field and saving wrote an empty string successfully — the page
 * header then rendered "Configuration and operational parameters for ." and
 * every other surface that prints the shop's name went blank with it. The
 * database was satisfied; the product was not.
 *
 * Lengths here are the app's own limits rather than a mirror of a CHECK
 * constraint — unlike `supportRequest.ts`, the schema puts no bound on these
 * columns. They are chosen to sit far above any real shop name and far below
 * the point where a stray paste breaks a layout.
 */

import { MAX_EXPIRY_WARNING_DAYS, MIN_EXPIRY_WARNING_DAYS } from '@/lib/expiry'

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type StoreSettingsInput = {
  name: string
  address: string
  phone: string
  /**
   * Already a number — it comes from a range input, not a text box.
   *
   * Validated anyway, and this is the one field here that mirrors a database
   * CHECK rather than setting the app's own limit: `stores_expiry_warning_days_check`
   * in migration 0017 is `between 1 and 90`, and CLAUDE.md records a past bug
   * where an app-layer rule and a database rule drifted. These two must be
   * changed together. It matters more than usual here because this page writes
   * `stores` straight from the browser, so a crafted request meets the CHECK
   * with no Server Action in between to give it a readable message first.
   */
  expiryWarningDays: number
}

export type StoreSettingsErrors = Partial<Record<keyof StoreSettingsInput, string>>

export const MAX_STORE_NAME = 120
export const MAX_ADDRESS = 500
export const MAX_PHONE = 40

/**
 * Deliberately permissive: a shop's contact number may be international, carry
 * an extension, or be written with spaces, dashes or brackets. This rejects
 * text that cannot be a phone number at all rather than enforcing one format —
 * a validator that refuses "+91 98765 43210" is worse than none, because the
 * owner's real number becomes the thing the form will not accept.
 */
const PHONE_SHAPE = /^[0-9+()\-.\s]{6,}$/

/** The six messages this can produce. "{n}"/"{min}"/"{max}" are the limits. */
export type StoreSettingsCopy = {
  vNameRequired: string
  vNameTooLong: string
  vAddressTooLong: string
  vPhoneTooLong: string
  vPhoneShape: string
  vExpiryRange: string
}

/** English, and what a caller that passes nothing still gets. */
const EN_STORE_SETTINGS: StoreSettingsCopy = {
  vNameRequired: 'Your store needs a name — it appears across the app.',
  vNameTooLong: 'Keep the name to {n} characters or fewer.',
  vAddressTooLong: 'Keep the address to {n} characters or fewer.',
  vPhoneTooLong: 'That phone number is too long.',
  vPhoneShape: 'Use digits, spaces and + ( ) - only.',
  vExpiryRange: 'Choose between {min} and {max} days.',
}

export function validateStoreSettings(
  values: StoreSettingsInput,
  copy: StoreSettingsCopy = EN_STORE_SETTINGS,
): StoreSettingsErrors {
  const errors: StoreSettingsErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = copy.vNameRequired
  else if (name.length > MAX_STORE_NAME) {
    errors.name = copy.vNameTooLong.replace('{n}', String(MAX_STORE_NAME))
  }

  // Address and phone are both optional: the columns are nullable and a shop
  // that has not filled them in is not in an error state.
  const address = values.address.trim()
  if (address.length > MAX_ADDRESS) {
    errors.address = copy.vAddressTooLong.replace('{n}', String(MAX_ADDRESS))
  }

  const phone = values.phone.trim()
  if (phone) {
    if (phone.length > MAX_PHONE) errors.phone = copy.vPhoneTooLong
    else if (!PHONE_SHAPE.test(phone)) {
      errors.phone = copy.vPhoneShape
    }
  }

  const days = values.expiryWarningDays
  if (
    !Number.isInteger(days) ||
    days < MIN_EXPIRY_WARNING_DAYS ||
    days > MAX_EXPIRY_WARNING_DAYS
  ) {
    errors.expiryWarningDays = copy.vExpiryRange
      .replace('{min}', String(MIN_EXPIRY_WARNING_DAYS))
      .replace('{max}', String(MAX_EXPIRY_WARNING_DAYS))
  }

  return errors
}
