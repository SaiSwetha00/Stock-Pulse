'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronUp, ChevronDown, Pencil, Trash2, Plus, Tags } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import EmptyState from '@/components/ui/EmptyState'
import type { CategoryOption } from '@/lib/categories'
import { validateCategory, type CategoryErrors } from '@/lib/validation/category'
import {
  createCategory,
  renameCategory,
  moveCategory,
  deleteCategory,
} from '@/app/(dashboard)/settings/categories/actions'

/**
 * The shop's own product categories.
 *
 * Every mutation here is a Server Action, not a browser write — same reasoning
 * as inventory: `revalidatePath` is server-only, the client validation is a
 * convenience a crafted request skips, and `store_id` comes from the session
 * rather than from this component.
 *
 * The delete refusal is deliberately NOT decided here. This list knows what
 * was true when the page rendered; somebody else moving a product into a
 * category while this tab sat open would make that stale. The count below
 * disables the button as a courtesy, and `deleteCategory` re-counts and
 * refuses server-side — D21's reasoning, the same as leave-day shift blocking.
 */
export default function CategoriesClient({
  categories,
  productCounts,
  ready,
  isOwner,
}: {
  categories: CategoryOption[]
  productCounts: Record<string, number>
  /** False until migration 0013 has been applied. */
  ready: boolean
  /** /settings is owner-only, so a manager must not be offered a link back
   *  to a screen that would bounce them to /dashboard. */
  isOwner: boolean
}) {
  const router = useRouter()
  const toast = useToast()

  const [newName, setNewName] = useState('')
  const [newErrors, setNewErrors] = useState<CategoryErrors>({})

  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editErrors, setEditErrors] = useState<CategoryErrors>({})

  const [confirmSlug, setConfirmSlug] = useState<string | null>(null)

  /** Which row (or 'new') has a request in flight, so only that control shows
   *  a spinner instead of the whole list going busy. */
  const [busy, setBusy] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()

    const found = validateCategory({ name: newName }, categories)
    setNewErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy('new')
    startTransition(async () => {
      const result = await createCategory({ name: newName })
      setBusy(null)
      if (!result.ok) {
        setNewErrors(result.errors ?? {})
        if (result.message) toast.error('Could not add category', result.message)
        return
      }
      toast.success('Category added', newName.trim())
      setNewName('')
      setNewErrors({})
      router.refresh()
    })
  }

  function startRename(c: CategoryOption) {
    setConfirmSlug(null)
    setEditingSlug(c.slug)
    setEditName(c.name)
    setEditErrors({})
  }

  function handleRename(e: React.FormEvent, slug: string) {
    e.preventDefault()

    const found = validateCategory({ name: editName }, categories, slug)
    setEditErrors(found)
    if (Object.keys(found).length > 0) return

    setBusy(slug)
    startTransition(async () => {
      const result = await renameCategory(slug, { name: editName })
      setBusy(null)
      if (!result.ok) {
        setEditErrors(result.errors ?? {})
        if (result.message) {
          toast.error('Could not rename category', result.message)
          // A zero-row result means this list is out of date either way, so
          // it is refreshed rather than left showing a row that may be gone.
          router.refresh()
        }
        return
      }
      toast.success('Category renamed', editName.trim())
      setEditingSlug(null)
      router.refresh()
    })
  }

  function handleMove(slug: string, direction: 'up' | 'down') {
    setBusy(slug)
    startTransition(async () => {
      const result = await moveCategory(slug, direction)
      setBusy(null)
      if (!result.ok) toast.error('Could not reorder categories', result.message)
      router.refresh()
    })
  }

  function handleDelete(slug: string, name: string) {
    setBusy(slug)
    startTransition(async () => {
      const result = await deleteCategory(slug)
      setBusy(null)
      setConfirmSlug(null)
      if (!result.ok) {
        // The readable refusal — "3 products still use this category. Move
        // them to another category first, then delete this one." A toast
        // rather than an inline banner because the row it belongs to may be
        // the last one on a long list at 390px.
        toast.error('Category not removed', result.message)
        router.refresh()
        return
      }
      toast.success('Category removed', name)
      router.refresh()
    })
  }

  return (
    <div className="sp-page">
      <div>
        {isOwner && (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-sm text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Store Settings
          </Link>
        )}
        <p className="sp-eyebrow mt-3">Configuration</p>
        <h1 className="sp-title mt-2">Product Categories</h1>
        <p className="sp-body mt-2">
          The categories your products are filed under, in the order they appear on the
          product form.
        </p>
      </div>

      {/* Always mounted, opened by an attribute — a conditionally rendered
          banner has no previous frame to transition from, so it pops in and
          shoves the list down. Same pattern as the save banner on /settings. */}
      <div className="sp-collapse" data-open={ready ? 'false' : 'true'}>
        <div>
          {!ready && (
            <div
              role="alert"
              className="mt-4 rounded-lg bg-warning-bg px-4 py-3 text-sm text-warning"
            >
              <span className="font-semibold">Showing the five built-in categories.</span>{' '}
              Your own list is stored in the database, and{' '}
              <code className="font-mono text-xs">0013_categories.sql</code> has not been run
              on this project yet. Adding, renaming and reordering stay disabled until it is.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="sp-rise sp-delay-1 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Tags className="h-4.5 w-4.5 text-muted-strong" aria-hidden="true" />
            <h2 className="sp-heading">Your categories</h2>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Add the first one to start filing products under it."
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {categories.map((c, i) => {
                const count = productCounts[c.slug] ?? 0
                const rowBusy = busy === c.slug && pending
                const editing = editingSlug === c.slug
                const confirming = confirmSlug === c.slug

                return (
                  <li
                    key={c.slug}
                    className="rounded-lg border border-border bg-surface-muted p-3"
                  >
                    {editing ? (
                      <form onSubmit={(e) => handleRename(e, c.slug)} className="space-y-3">
                        <Field label="Category name" error={editErrors.name} required>
                          {(p) => (
                            <Input
                              {...p}
                              required
                              maxLength={40}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          )}
                        </Field>
                        <div className="flex gap-3">
                          {/* flex-1 min-w-0, not fullWidth: `Button` carries
                              `shrink-0`, so two fullWidth buttons in a flex row
                              cannot shrink and the second is pushed past the
                              card's inner edge, where overflow-hidden clips it
                              away. That bug cost a whole control on
                              /monitoring. */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1 min-w-0"
                            onClick={() => setEditingSlug(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="flex-1 min-w-0"
                            loading={rowBusy}
                            disabled={!ready}
                          >
                            Save name
                          </Button>
                        </div>
                      </form>
                    ) : confirming ? (
                      <div className="space-y-3">
                        <p className="text-sm text-foreground">
                          Remove <span className="font-semibold">{c.name}</span>?
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 min-w-0"
                            onClick={() => setConfirmSlug(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 min-w-0"
                            loading={rowBusy}
                            onClick={() => handleDelete(c.slug, c.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {count === 0
                              ? 'No products'
                              : `${count} product${count === 1 ? '' : 's'}`}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Move ${c.name} up`}
                            disabled={i === 0 || !ready || pending}
                            onClick={() => handleMove(c.slug, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Move ${c.name} down`}
                            disabled={i === categories.length - 1 || !ready || pending}
                            onClick={() => handleMove(c.slug, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Rename ${c.name}`}
                            disabled={!ready || pending}
                            onClick={() => startRename(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Rename
                          </Button>
                          {/* Disabled when the category holds products — a
                              courtesy, not the control. The Server Action
                              re-counts and refuses, because this number is
                              only as fresh as the last render. */}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={
                              count > 0
                                ? `Cannot remove ${c.name} — ${count} product${count === 1 ? '' : 's'} still use it`
                                : `Remove ${c.name}`
                            }
                            disabled={count > 0 || !ready || pending || categories.length <= 1}
                            onClick={() => setConfirmSlug(c.slug)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="sp-rise sp-delay-2 sp-e1 h-fit rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Plus className="h-4.5 w-4.5 text-muted-strong" aria-hidden="true" />
            <h2 className="sp-heading">Add a category</h2>
          </div>

          <form onSubmit={handleAdd} className="mt-4 space-y-4">
            <Field
              label="Category name"
              hint="Shown on the product form and the inventory filter."
              error={newErrors.name}
              required
            >
              {(p) => (
                <Input
                  {...p}
                  required
                  maxLength={40}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Frozen Foods"
                  disabled={!ready}
                />
              )}
            </Field>

            {/* The one high-emphasis button on this screen. The row actions are
                secondary and ghost — per D32 the rule is a ceiling, and a list
                of N equally-weighted row buttons is not a page's primary
                action. */}
            <Button type="submit" fullWidth loading={busy === 'new' && pending} disabled={!ready}>
              Add category
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted">
            Renaming a category only changes its label. Products stay where they are, and
            past sales keep the category they were filed under.
          </p>
        </div>
      </div>
    </div>
  )
}
