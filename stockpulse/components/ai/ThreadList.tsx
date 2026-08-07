'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react'
import type { ThreadSummary } from '@/app/(dashboard)/ai/actions'

/**
 * Groups the history into Today / Yesterday / Earlier.
 *
 * Absolute timestamps are the wrong unit here. Nobody remembers that they asked
 * about milk at 14:07 on the 3rd; they remember it was this morning. Three
 * coarse buckets answer "was this the conversation I had earlier?" without
 * pulling in a date library.
 */
function bucketOf(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const then = new Date(iso).getTime()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (then >= startOfToday) return 'Today'
  if (then >= startOfToday - 86_400_000) return 'Yesterday'
  return 'Earlier'
}

const ORDER = ['Today', 'Yesterday', 'Earlier'] as const

export default function ThreadList({
  threads,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: {
  threads: ThreadSummary[]
  activeId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  // Deleting asks once, inline, by swapping the row for a confirm/cancel pair.
  // A full modal for "remove a chat about milk" is disproportionate; no
  // confirmation at all is not, because the thread and everything in it goes
  // for good.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const grouped = ORDER.map((label) => ({
    label,
    items: threads.filter((t) => bucketOf(t.last_message_at) === label),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <p className="flex items-center gap-2 px-2 py-6 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading conversations…
          </p>
        ) : threads.length === 0 ? (
          <p className="px-2 py-6 text-sm text-muted">
            No past conversations yet. Anything you ask is saved here so you can pick it up later.
          </p>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-3">
              <h4 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {group.label}
              </h4>
              <ul className="space-y-0.5">
                {group.items.map((thread) => {
                  const isActive = thread.id === activeId
                  const label = thread.title ?? 'New conversation'

                  if (thread.id === confirmingId) {
                    return (
                      <li key={thread.id}>
                        <div className="flex items-center gap-1 rounded-lg bg-surface-muted px-3 py-2">
                          <span className="flex-1 truncate text-xs text-muted-strong">
                            Delete this chat?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(thread.id)
                              setConfirmingId(null)
                            }}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:underline"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </li>
                    )
                  }

                  return (
                    <li key={thread.id} className="group flex items-center">
                      <button
                        type="button"
                        onClick={() => onSelect(thread.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-surface-muted font-semibold text-foreground'
                            : 'text-muted-strong hover:bg-surface-muted'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </button>
                      {/* Always in the DOM, revealed on hover or keyboard focus.
                          Hover alone would put delete out of reach for anyone
                          not using a mouse. */}
                      <button
                        type="button"
                        onClick={() => setConfirmingId(thread.id)}
                        aria-label={`Delete conversation: ${label}`}
                        className="ml-1 shrink-0 rounded-md p-2 text-muted opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
