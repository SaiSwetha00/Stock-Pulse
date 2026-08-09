import { slugify, type CategoryOption } from '@/lib/categories'

/**
 * Category validation.
 *
 * Written to `storeSettings.ts`'s pattern deliberately, because this is a new
 * `text not null` column and FOUND-ISSUES logs the shape it would otherwise
 * repeat: **`not null` is not `not blank`**. Postgres rejects the absence of a
 * value, never the emptiness of one, so a form posting `''` satisfies the
 * constraint completely — the write succeeds, the API returns no error, the
 * toast says saved, and the list now has a row with no name on it.
 *
 * Three layers, none of them redundant:
 *   1. here, on the client, for an inline message next to the field;
 *   2. here again, inside the Server Action, because a crafted request never
 *      runs the client;
 *   3. `categories_name_not_blank check (length(trim(name)) > 0)` in 0013,
 *      which is the only one that cannot be bypassed.
 *
 * Values are trimmed on the way out so `" "` cannot pass a check that ran
 * against `""`.
 */

export type CategoryInput = {
  name: string
}

export type CategoryErrors = Partial<Record<keyof CategoryInput, string>>

/** Matches `categories_name_length` in 0013. A category is a shelf label, not
 *  a description; anything longer breaks the inventory filter row. */
export const MAX_CATEGORY_NAME = 40

export function validateCategory(
  values: CategoryInput,
  /**
   * The store's existing categories, so a duplicate is caught with a sentence
   * rather than an opaque 23505. Pass the row being renamed as `excludeSlug`
   * so "save" on an unchanged name is not reported as a clash with itself.
   */
  existing: CategoryOption[] = [],
  excludeSlug?: string,
): CategoryErrors {
  const errors: CategoryErrors = {}

  const name = values.name.trim()

  if (!name) {
    errors.name = 'Give the category a name.'
    return errors
  }

  if (name.length > MAX_CATEGORY_NAME) {
    errors.name = `Keep the name to ${MAX_CATEGORY_NAME} characters or fewer.`
    return errors
  }

  // A name of nothing but punctuation ("!!!") is not blank and passes every
  // check above, but slugs to '' — which the FK column cannot hold and
  // `categories_slug_shape` would refuse with a constraint violation nobody
  // can read. Caught here instead, where it can name the actual problem.
  if (!slugify(name)) {
    errors.name = 'Use at least one letter or number.'
    return errors
  }

  const clash = existing.find(
    (c) => c.slug !== excludeSlug && c.name.trim().toLowerCase() === name.toLowerCase(),
  )
  if (clash) {
    errors.name = 'You already have a category with that name.'
  }

  return errors
}

/** Call only after validateCategory returns no errors. */
export function toCategoryName(values: CategoryInput): string {
  return values.name.trim()
}
