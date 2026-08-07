'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import EmptyState from '@/components/ui/EmptyState'

export type Command = {
  id: string
  label: string
  group: string
  icon: LucideIcon
  /** Extra terms that should match this command but aren't in the label. */
  keywords?: string
  run: () => void
}

/**
 * Subsequence match, so "invt" finds "Inventory" and "adprd" finds "Add
 * Product". Returns a score where lower is better: an exact prefix beats a
 * scattered match.
 */
function score(haystack: string, needle: string): number | null {
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  if (!n) return 0
  if (h.startsWith(n)) return 0
  const direct = h.indexOf(n)
  if (direct > -1) return 1 + direct

  let i = 0
  let gaps = 0
  let last = -1
  for (const char of n) {
    const found = h.indexOf(char, i)
    if (found === -1) return null
    if (last > -1) gaps += found - last - 1
    last = found
    i = found + 1
  }
  return 100 + gaps
}

export default function CommandPalette({
  commands,
  onClose,
}: {
  commands: Command[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const results = useMemo(() => {
    if (!query.trim()) return commands
    return commands
      .map((cmd) => {
        const target = cmd.keywords ? `${cmd.label} ${cmd.keywords}` : cmd.label
        const s = score(target, query.trim())
        return s === null ? null : { cmd, s }
      })
      .filter((r): r is { cmd: Command; s: number } => r !== null)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.cmd)
  }, [commands, query])

  // Clamp during render rather than resetting from an effect: filtering can
  // shrink the list below the stored index, and acting on a stale index would
  // run the wrong command on Enter.
  const safeIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  // Lock the page behind the palette.
  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${safeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [safeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((safeIndex + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((safeIndex - 1 + results.length) % results.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(results.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = results[safeIndex]
      if (cmd) {
        onClose()
        cmd.run()
      }
    }
  }

  // Group headings, in the order the groups first appear in the results.
  const grouped = useMemo(() => {
    const out: { group: string; items: { cmd: Command; index: number }[] }[] = []
    results.forEach((cmd, index) => {
      const bucket = out.find((g) => g.group === cmd.group)
      if (bucket) bucket.items.push({ cmd, index })
      else out.push({ group: cmd.group, items: [{ cmd, index }] })
    })
    return out
  }, [results])

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions..."
            aria-label="Search pages and actions"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              results.length > 0 ? `${listboxId}-opt-${safeIndex}` : undefined
            }
            className="w-full bg-transparent py-4 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} id={listboxId} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No results"
              description={`Nothing matches “${query}”. Try a page name, or an action like “add product”.`}
              // Compact: this sits inside a dropdown, not a full page.
              className="px-4 py-8"
            />
          ) : (
            grouped.map((group) => (
              <div key={group.group} className="mb-1">
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {group.group}
                </p>
                {group.items.map(({ cmd, index }) => {
                  const Icon = cmd.icon
                  const active = index === safeIndex
                  return (
                    <div
                      key={cmd.id}
                      id={`${listboxId}-opt-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        onClose()
                        cmd.run()
                      }}
                      className={cn(
                        'mx-2 flex control-h cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm',
                        active ? 'bg-foreground text-surface' : 'text-muted-strong',
                      )}
                    >
                      <Icon
                        className={cn('h-4 w-4 shrink-0', active ? 'text-surface' : 'text-muted')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{cmd.label}</span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
