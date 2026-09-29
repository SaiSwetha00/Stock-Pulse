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

/** The four messages this can produce. "{n}" is MAX_CATEGORY_NAME. */
export type CategoryValidationCopy = {
  vNameRequired: string
  vNameTooLong: string
  vNameNoAlnum: string
  vNameDuplicate: string
}

/** English, and what a caller that passes nothing still gets. */
const EN_CATEGORY: CategoryValidationCopy = {
  vNameRequired: 'Give the category a name.',
  vNameTooLong: 'Keep the name to {n} characters or fewer.',
  vNameNoAlnum: 'Use at least one letter or number.',
  vNameDuplicate: 'You already have a category with that name.',
}

export function validateCategory(
  values: CategoryInput,
  /**
   * The store's existing categories, so a duplicate is caught with a sentence
   * rather than an opaque 23505. Pass the row being renamed as `excludeSlug`
   * so "save" on an unchanged name is not reported as a clash with itself.
   */
  existing: CategoryOption[] = [],
  excludeSlug?: string,
  copy: CategoryValidationCopy = EN_CATEGORY,
): CategoryErrors {
  const errors: CategoryErrors = {}

  const name = values.name.trim()

  if (!name) {
    errors.name = copy.vNameRequired
    return errors
  }

  if (name.length > MAX_CATEGORY_NAME) {
    errors.name = copy.vNameTooLong.replace('{n}', String(MAX_CATEGORY_NAME))
    return errors
  }

  // A name of nothing but punctuation ("!!!") is not blank and passes every
  // check above, but slugs to '' — which the FK column cannot hold and
  // `categories_slug_shape` would refuse with a constraint violation nobody
  // can read. Caught here instead, where it can name the actual problem.
  if (!slugify(name)) {
    errors.name = copy.vNameNoAlnum
    return errors
  }

  const clash = existing.find(
    (c) => c.slug !== excludeSlug && c.name.trim().toLowerCase() === name.toLowerCase(),
  )
  if (clash) {
    errors.name = copy.vNameDuplicate
  }

  return errors
}

/** Call only after validateCategory returns no errors. */
export function toCategoryName(values: CategoryInput): string {
  return values.name.trim()
}
