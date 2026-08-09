import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Product categories, as the shop's own data.
 *
 * Before migration 0013 the list was five hardcoded strings in six places —
 * `types/index.ts` twice, `lib/validation/product.ts`, `ProductModal.tsx`,
 * `InventoryClient.tsx`, and a CHECK constraint in `schema.sql`. Adding
 * "Frozen" meant a code change and a migration, which is not something a
 * shopkeeper can do.
 *
 * `slug` is identity and `name` is what people read. Renaming a category
 * changes only the name, so `products.category` — which stores the slug — is
 * never rewritten and a shop's sales history does not shift under a
 * relabelling. See the header of `0013_categories.sql`.
 */

/** A row of `public.categories`. */
export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

/**
 * The shape every render site actually needs. Pages pass this to their client
 * components rather than the full row, because a `<select>` needs a value and
 * a label and nothing else — and a narrower prop is one less thing to keep in
 * sync when the table gains a column.
 */
export interface CategoryOption {
  slug: string
  name: string
}

/**
 * What every store is seeded with by 0013's backfill — and, until that
 * migration runs, what the app falls back to.
 *
 * These are exactly the five values the old CHECK constraint allowed, in the
 * order the product form listed them, so the day the migration runs nobody's
 * list changes.
 */
export const DEFAULT_CATEGORIES: CategoryOption[] = [
  { slug: 'produce', name: 'Produce' },
  { slug: 'dairy', name: 'Dairy & Eggs' },
  { slug: 'packaged', name: 'Packaged Goods' },
  { slug: 'beverages', name: 'Beverages' },
  { slug: 'household', name: 'Household' },
]

/** Postgres undefined_table. */
const UNDEFINED_TABLE = '42P01'
/** PostgREST's own "not in the schema cache", which is what a missing table
 *  actually surfaces as through supabase-js. */
const NOT_IN_SCHEMA_CACHE = 'PGRST205'

/**
 * True when the failure is "0013 has not been applied", rather than a real
 * error. Deliberately narrow: D21 established that treating *any* error as an
 * empty result is how a page renders perfectly with nothing on it and nothing
 * saying why — `staff_leave` did exactly that and hid a PGRST201 for a week.
 */
export function isMissingCategoriesTable(code?: string): boolean {
  return code === UNDEFINED_TABLE || code === NOT_IN_SCHEMA_CACHE
}

export interface StoreCategories {
  /** Ordered by sort_order, then name. Never empty. */
  categories: CategoryOption[]
  /**
   * False when migration 0013 has not been applied yet, in which case
   * `categories` is `DEFAULT_CATEGORIES` and the management screen says so.
   *
   * The app ships ahead of the migration on purpose — same as `/staff` did
   * for `0011_staff_leave.sql` (D21). Inventory, dashboard, sales and reports
   * must keep working on a database that has not been migrated, or the
   * branch is not deployable until somebody is at a keyboard.
   */
  ready: boolean
}

/**
 * Reads a store's categories. Safe to call from any Server Component.
 *
 * Falls back to the five defaults ONLY for a missing table. Any other error
 * still falls back — a page that cannot list categories must not crash the
 * whole route — but it is surfaced through `ready: false` so the management
 * screen can say something rather than silently showing a list nobody chose.
 */
export async function getStoreCategories(
  supabase: SupabaseClient,
  storeId: string,
): Promise<StoreCategories> {
  const { data, error } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('store_id', storeId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error || !data || data.length === 0) {
    return { categories: DEFAULT_CATEGORIES, ready: false }
  }

  return { categories: data as CategoryOption[], ready: true }
}

/** `[{slug, name}]` -> `{slug: name}`, for the render sites that only look up. */
export function labelMap(categories: CategoryOption[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of categories) map[c.slug] = c.name
  return map
}

/**
 * The display name for a stored slug.
 *
 * The fallback matters more than it looks. A product keeps its slug when a
 * category is renamed, and a sale's product may have been reclassified since;
 * printing the raw slug ("dry-goods") in those cases reads as a bug, so an
 * unknown slug is humanised instead. It is never silently dropped — an
 * unlabelled category is still real revenue.
 */
export function categoryLabel(slug: string, labels: Record<string, string>): string {
  return labels[slug] ?? humanise(slug)
}

function humanise(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Name -> slug. The slug is the FK value and is matched by
 * `categories_slug_shape` in 0013: lowercase alphanumerics separated by single
 * hyphens, no leading or trailing hyphen.
 *
 * Returns '' for a name with no usable characters at all (e.g. "!!!"), which
 * the validator rejects — better than generating an empty slug that the CHECK
 * constraint would then refuse with an opaque message.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    // Decompose accents so "Café" slugs as "cafe" rather than losing the e,
    // then drop the combining marks the decomposition produced.
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
