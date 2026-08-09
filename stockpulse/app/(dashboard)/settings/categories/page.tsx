import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { canManage } from '@/lib/permissions'
import { getStoreCategories } from '@/lib/categories'
import CategoriesClient from '@/components/settings/CategoriesClient'

export const metadata: Metadata = {
  title: 'Product Categories',
  description: 'Add, rename and reorder the categories your products are filed under.',
  robots: { index: false, follow: false },
}

/**
 * A sibling of /settings rather than a card on it, and guarded by
 * `canManage` rather than `isOwner`.
 *
 * /settings itself is owner-only — 0002 reserves store settings and hiring to
 * the owner, and `NAV_ITEMS` says so. Categories are not in that group: they
 * classify products, and adding a product is `can_manage()` work. Putting this
 * screen *on* /settings would have meant a manager who hits "Manage
 * categories" from the product form gets bounced to /dashboard for a thing
 * their role is allowed to do.
 *
 * So it follows D15's /staff/team pattern with the roles inverted: the child
 * route carries its own guard, and the parent keeps a signpost card. This
 * guard and 0013's insert/update/delete policies both resolve to
 * `can_manage()`; CLAUDE.md documents what happens when the two drift.
 *
 * Deliberately NOT added to `lib/nav.ts`. NAV_ITEMS is the sidebar and the
 * command palette, and /staff/team — the same kind of sub-screen reached from
 * its parent — is not in it either.
 */
export default async function CategoriesPage() {
  const { profile, store } = await getCurrentUser()
  if (!canManage(profile.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { categories, ready } = await getStoreCategories(supabase, store.id)

  // What each category is holding, so the screen can say "3 products" beside a
  // delete button that will refuse. The count is a courtesy: deleteCategory
  // re-counts server-side, because this page's number is only as fresh as the
  // moment it rendered.
  const { data: productRows } = await supabase
    .from('products')
    .select('category')
    .eq('store_id', store.id)

  const counts: Record<string, number> = {}
  for (const row of (productRows ?? []) as { category: string }[]) {
    counts[row.category] = (counts[row.category] ?? 0) + 1
  }

  return (
    <CategoriesClient
      categories={categories}
      productCounts={counts}
      ready={ready}
      isOwner={profile.role === 'owner'}
    />
  )
}
