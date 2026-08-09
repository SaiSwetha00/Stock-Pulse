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

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type StoreSettingsInput = {
  name: string
  address: string
  phone: string
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

export function validateStoreSettings(values: StoreSettingsInput): StoreSettingsErrors {
  const errors: StoreSettingsErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = 'Your store needs a name — it appears across the app.'
  else if (name.length > MAX_STORE_NAME) {
    errors.name = `Keep the name to ${MAX_STORE_NAME} characters or fewer.`
  }

  // Address and phone are both optional: the columns are nullable and a shop
  // that has not filled them in is not in an error state.
  const address = values.address.trim()
  if (address.length > MAX_ADDRESS) {
    errors.address = `Keep the address to ${MAX_ADDRESS} characters or fewer.`
  }

  const phone = values.phone.trim()
  if (phone) {
    if (phone.length > MAX_PHONE) errors.phone = 'That phone number is too long.'
    else if (!PHONE_SHAPE.test(phone)) {
      errors.phone = 'Use digits, spaces and + ( ) - only.'
    }
  }

  return errors
}
