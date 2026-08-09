'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import {
  isMissingCategoriesTable,
  slugify,
  type CategoryOption,
} from '@/lib/categories'
import {
  validateCategory,
  toCategoryName,
  type CategoryErrors,
  type CategoryInput,
} from '@/lib/validation/category'

export type CategoryActionResult =
  | { ok: true }
  | { ok: false; message?: string; errors?: CategoryErrors }

/** Postgres unique_violation — the (store_id, slug) key or the
 *  lower(name) index in 0013. */
const UNIQUE_VIOLATION = '23505'
/** Postgres foreign_key_violation — products still reference this category.
 *  The RESTRICT half of `products_category_fkey`. */
const FK_VIOLATION = '23503'
/** Postgres check_violation — categories_name_not_blank / _slug_shape. */
const CHECK_VIOLATION = '23514'

const NEEDS_MIGRATION =
  'Categories are not set up on this database yet. Run supabase/migrations/0013_categories.sql in the SQL editor.'

/**
 * The refusal every zero-row write shares.
 *
 * D24: a supabase-js write returns an error object that only covers *errors*,
 * and an RLS refusal is not one — it is a successful statement that matched no
 * rows. So every update and delete here asks for the affected rows back with
 * `.select('id')`, and an empty result lands on this message.
 *
 * It names BOTH causes on purpose. The first draft of the equivalent message
 * on `/monitoring` blamed the missing migration, so a shopkeeper double-clicking
 * a button — acting on a list that had not refreshed yet — was told to go and
 * run SQL. Either way what is on screen is out of date, so either way the
 * answer is to refresh.
 */
const ZERO_ROWS =
  'Nothing changed — either that category has already been removed, or your role does not allow this. Refreshing the list.'

/**
 * Every category write goes through here.
 *
 * `canManage` mirrors `public.can_manage()`, which is what 0013's insert,
 * update and delete policies check. CLAUDE.md documents the drift bug this
 * pairing exists to prevent: the database gained `manager` in migration 0002
 * and `lib/nav.ts` was not updated, so managers signed in to an empty sidebar.
 * The database is still the real boundary — RLS applies to a crafted request
 * that never reaches this file — but checking here first turns an opaque
 * zero-row result into a sentence.
 */
async function requireManager() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) {
    return {
      ok: false as const,
      message: 'You do not have permission to change categories.',
    }
  }
  return { ok: true as const, store, supabase: await createClient() }
}

/** Ordered exactly as `getStoreCategories` orders them, so an index here and a
 *  row on screen mean the same thing. */
async function readCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeId: string,
) {
  return supabase
    .from('categories')
    .select('id, slug, name, sort_order')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
}

/** The routes that render a category name or offer the list as a choice. */
function revalidateCategoryConsumers() {
  revalidatePath('/settings/categories')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
  revalidatePath('/sales')
  revalidatePath('/reports')
}

export async function createCategory(input: CategoryInput): Promise<CategoryActionResult> {
  const guard = await requireManager()
  if (!guard.ok) return guard
  const { store, supabase } = guard

  const { data: existing, error: readError } = await readCategories(supabase, store.id)
  if (readError) {
    return {
      ok: false,
      message: isMissingCategoriesTable(readError.code) ? NEEDS_MIGRATION : readError.message,
    }
  }

  const rows = (existing ?? []) as (CategoryOption & { sort_order: number })[]

  const errors = validateCategory(input, rows)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const name = toCategoryName(input)
  const slug = slugify(name)

  // Two different names can slug identically — "Dairy & Eggs" and "Dairy Eggs"
  // both become 'dairy-eggs'. The name check above passes both, so the slug is
  // checked separately rather than left to surface as a 23505 the user cannot
  // interpret. The slug is never shown, so the message talks about the name.
  if (rows.some((c) => c.slug === slug)) {
    return { ok: false, errors: { name: 'That is too close to a category you already have.' } }
  }

  // Appended, not inserted: a new category goes to the end of the shop's own
  // ordering rather than jumping into the middle of a list somebody arranged.
  const nextOrder = rows.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1

  // No `.select()` needed here, unlike the update and delete below: D24 is
  // explicit that it does not apply to inserts, which fail loudly with 42501
  // when a policy refuses rather than succeeding against zero rows.
  const { error } = await supabase
    .from('categories')
    .insert({ store_id: store.id, name, slug, sort_order: nextOrder })

  if (error) {
    if (isMissingCategoriesTable(error.code)) return { ok: false, message: NEEDS_MIGRATION }
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, errors: { name: 'You already have a category with that name.' } }
    }
    if (error.code === CHECK_VIOLATION) {
      return { ok: false, errors: { name: 'That name cannot be used.' } }
    }
    return { ok: false, message: error.message }
  }

  revalidateCategoryConsumers()
  return { ok: true }
}

/**
 * Renames a category — and renames ONLY it.
 *
 * The slug is deliberately left alone. It is the value `products.category`
 * holds and the target of `products_category_fkey`, so changing it would
 * rewrite every product row in the category. Worse, it would do so silently
 * via ON UPDATE CASCADE, meaning a relabelling would quietly touch a shop's
 * historical data. `name` is the label; `slug` is identity.
 */
export async function renameCategory(
  slug: string,
  input: CategoryInput,
): Promise<CategoryActionResult> {
  const guard = await requireManager()
  if (!guard.ok) return guard
  const { store, supabase } = guard

  const { data: existing, error: readError } = await readCategories(supabase, store.id)
  if (readError) {
    return {
      ok: false,
      message: isMissingCategoriesTable(readError.code) ? NEEDS_MIGRATION : readError.message,
    }
  }

  const rows = (existing ?? []) as (CategoryOption & { sort_order: number })[]

  const errors = validateCategory(input, rows, slug)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  // D24: `.select('id')` is the whole point. Without it an RLS refusal is
  // HTTP 200, no error, zero rows changed — indistinguishable from a
  // successful rename, and the UI would report one.
  const { data, error } = await supabase
    .from('categories')
    .update({ name: toCategoryName(input) })
    .eq('store_id', store.id)
    .eq('slug', slug)
    .select('id')

  if (error) {
    if (isMissingCategoriesTable(error.code)) return { ok: false, message: NEEDS_MIGRATION }
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, errors: { name: 'You already have a category with that name.' } }
    }
    if (error.code === CHECK_VIOLATION) {
      return { ok: false, errors: { name: 'That name cannot be used.' } }
    }
    return { ok: false, message: error.message }
  }

  if (!data || data.length === 0) return { ok: false, message: ZERO_ROWS }

  revalidateCategoryConsumers()
  return { ok: true }
}

/**
 * Moves one category up or down by one place.
 *
 * Renumbers the whole list 1..n rather than swapping two `sort_order` values,
 * because swapping only works if the two values differ — and they need not.
 * 0013's backfill gives every stray category `99`, the column defaults to `0`,
 * and the secondary sort is by name, so a list can legitimately arrive with
 * ties in it. Swapping two equal numbers is a write that changes nothing and
 * reports success, which is the failure shape this whole phase keeps finding.
 *
 * Only rows whose number actually changes are written.
 */
export async function moveCategory(
  slug: string,
  direction: 'up' | 'down',
): Promise<CategoryActionResult> {
  const guard = await requireManager()
  if (!guard.ok) return guard
  const { store, supabase } = guard

  const { data: existing, error: readError } = await readCategories(supabase, store.id)
  if (readError) {
    return {
      ok: false,
      message: isMissingCategoriesTable(readError.code) ? NEEDS_MIGRATION : readError.message,
    }
  }

  const rows = (existing ?? []) as { id: string; slug: string; sort_order: number }[]
  const index = rows.findIndex((c) => c.slug === slug)
  if (index === -1) return { ok: false, message: ZERO_ROWS }

  const target = direction === 'up' ? index - 1 : index + 1
  // Already at the end it is being asked to move towards. The buttons are
  // disabled there, so this is the crafted-request path, not a UI path.
  if (target < 0 || target >= rows.length) return { ok: true }

  const reordered = [...rows]
  ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

  for (let i = 0; i < reordered.length; i++) {
    const wanted = i + 1
    if (reordered[i].sort_order === wanted) continue

    const { data, error } = await supabase
      .from('categories')
      .update({ sort_order: wanted })
      .eq('store_id', store.id)
      .eq('id', reordered[i].id)
      .select('id')

    if (error) return { ok: false, message: error.message }
    // D24 again. A partial renumber is worse than none, so the first refusal
    // stops the loop rather than leaving the list half-ordered silently.
    if (!data || data.length === 0) return { ok: false, message: ZERO_ROWS }
  }

  revalidateCategoryConsumers()
  return { ok: true }
}

/**
 * Deletes a category, unless products are still in it.
 *
 * The block is HERE and not in the form, for the reason `saveShift` blocks
 * leave-day assignment server-side (D21): the form knows what was true when
 * the page loaded, and a tab left open while somebody else moved a product
 * into this category knows nothing about it. The slug also arrives from the
 * browser.
 *
 * `products_category_fkey ... on delete restrict` is the belt to this braces.
 * The count below is what produces a sentence a shopkeeper can act on; the FK
 * is what makes the outcome correct even if the count is raced, and it is
 * caught as 23503 rather than shown raw.
 */
export async function deleteCategory(slug: string): Promise<CategoryActionResult> {
  const guard = await requireManager()
  if (!guard.ok) return guard
  const { store, supabase } = guard

  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', store.id)
    .eq('category', slug)

  if (countError) return { ok: false, message: countError.message }

  if ((count ?? 0) > 0) {
    const n = count ?? 0
    return {
      ok: false,
      message:
        `${n} product${n === 1 ? '' : 's'} still use this category. ` +
        `Move ${n === 1 ? 'it' : 'them'} to another category first, then delete this one.`,
    }
  }

  // A shop with no categories has a product form with an empty dropdown and no
  // way to add anything. Refusing the last one is not a permission question,
  // so it is checked separately from the count above.
  const { data: all, error: readError } = await readCategories(supabase, store.id)
  if (readError) {
    return {
      ok: false,
      message: isMissingCategoriesTable(readError.code) ? NEEDS_MIGRATION : readError.message,
    }
  }
  if ((all ?? []).length <= 1) {
    return {
      ok: false,
      message: 'This is your only category. Add another before removing this one.',
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('store_id', store.id)
    .eq('slug', slug)
    .select('id')

  if (error) {
    if (isMissingCategoriesTable(error.code)) return { ok: false, message: NEEDS_MIGRATION }
    if (error.code === FK_VIOLATION) {
      return {
        ok: false,
        message:
          'Products were moved into this category a moment ago, so it can no longer be removed. Refresh and check.',
      }
    }
    return { ok: false, message: error.message }
  }

  if (!data || data.length === 0) return { ok: false, message: ZERO_ROWS }

  revalidateCategoryConsumers()
  return { ok: true }
}
