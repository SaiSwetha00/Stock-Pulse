'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Package, Search, SearchX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import EmptyState from '@/components/ui/EmptyState'
import { searchProducts } from '@/app/(dashboard)/inventory/actions'

export type ProductHit = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
}

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
  onOpenProduct,
}: {
  commands: Command[]
  onClose: () => void
  /**
   * Called with a product's id when its result is chosen.
   *
   * The palette does not own the details dialog, because choosing a result
   * closes the palette — a dialog mounted in here would unmount in the same
   * tick it was asked for. The provider holds it instead, which is also what
   * lets the details open over whatever route the reader is on rather than
   * navigating them away from it.
   */
  onOpenProduct: (productId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // The trap effect runs once, so it must not close over a stale onClose.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const listboxId = useId()

  /**
   * Products, fetched as the user types.
   *
   * The index used to be navigation plus three actions, so a product name
   * could only ever match a sidebar label through the subsequence scorer -
   * a search box labelled "Search products, sales, customers..." that could
   * not return a product. Products are not in the client, so they come from a
   * Server Action scoped by RLS to the viewer's own store.
   *
   * Debounced, and every response carries the query it was for: without that,
   * a slow reply for "bas" can land after a fast reply for "basmati" and
   * overwrite it, which shows results for something the user has stopped
   * typing.
   */
  const [hits, setHits] = useState<{ q: string; rows: ProductHit[] }>({ q: '', rows: [] })
  useEffect(() => {
    const q = query.trim()
    // The clear happens inside the timer, not in the effect body: setting
    // state synchronously here triggers a cascading render and the lint rule
    // rejects it.
    const t = setTimeout(() => {
      if (q.length < 2) {
        setHits({ q, rows: [] })
        return
      }
      void searchProducts(q).then((rows) => setHits({ q, rows }))
    }, 160)
    return () => clearTimeout(t)
  }, [query])

  // Results are tagged with the query they were fetched for and only used when
  // that still matches what is typed. A slow reply for "bas" landing after a
  // fast one for "basmati" therefore cannot overwrite it, and nothing stale is
  // ever rendered - no cancellation flag required.
  const productHits = useMemo(
    () => (hits.q === query.trim() ? hits.rows : []),
    [hits, query],
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return commands

    const scored = commands
      .map((cmd) => {
        const target = cmd.keywords ? `${cmd.label} ${cmd.keywords}` : cmd.label
        const s = score(target, q)
        return s === null ? null : { cmd, s }
      })
      .filter((r): r is { cmd: Command; s: number } => r !== null)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.cmd)

    /**
     * Ranking, in the order a person means them:
     *
     *   0  exact product name
     *   1  product name starts with the query
     *   2  product name contains it
     *   3  SKU or barcode match
     *   ...then commands, by their own score.
     *
     * Navigation is NOT removed - typing "Inventory" still offers the page,
     * because at that point the nav entry is what was asked for. It simply no
     * longer outranks a product that matches better.
     */
    const n = q.toLowerCase()
    const products: Command[] = productHits
      .map((p) => {
        const name = p.name.toLowerCase()
        const rank =
          name === n ? 0 : name.startsWith(n) ? 1 : name.includes(n) ? 2 : 3
        return { p, rank }
      })
      .sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name))
      .map(({ p }) => ({
        id: `product:${p.id}`,
        label: p.name,
        group: 'Products',
        icon: Package,
        /**
         * Opens the product's own details dialog.
         *
         * This used to push `/inventory?q=<name>` — a full page navigation
         * that re-fetched the catalogue in order to show one filtered row,
         * and that from `/sales` or `/reports` took the reader off the page
         * they were working on. It also never showed a stock figure, a lot or
         * an expiry, so a search box that could find a product still could not
         * tell you anything about it. That navigation is still available, as
         * the "Open in Inventory" button in the dialog's footer.
         */
        run: () => onOpenProduct(p.id),
      }))

    return [...products, ...scored]
  }, [commands, query, productHits, onOpenProduct])

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

  /**
   * Focus trap, document-level Escape, and focus restore.
   *
   * Escape and the arrows were bound to the input's own onKeyDown, and nothing
   * held focus inside the dialog. Measured with the open-state probe: of 13 tab
   * stops, 12 landed OUTSIDE — the skip link and the entire sidebar behind the
   * overlay. Once focus was out there Escape never reached the handler, so a
   * keyboard user had an aria-modal dialog covering the page and no way to
   * dismiss it. The probe reported `escape=STILL OPEN`.
   *
   * Same shape as Modal.tsx, which already does this correctly: listener on the
   * document in the capture phase, Tab wrapped at both ends, focus returned to
   * whatever opened the palette.
   */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null

    function onKeyDownDoc(e: KeyboardEvent) {
      const panel = panelRef.current
      if (!panel) return

      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      // Wrap at both ends, and pull focus back if it is already outside — the
      // page behind must stay unreachable while this is open.
      if (!panel.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDownDoc, true)
    return () => {
      document.removeEventListener('keydown', onKeyDownDoc, true)
      previouslyFocused?.focus?.()
    }
  }, [])

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
        ref={panelRef}
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

        {/* tabIndex={-1}: this scrolls, and Chrome makes an overflowing
            container keyboard-focusable on its own, so it became a tab stop
            painting the black UA ring — measured rgb(16,16,16), the same
            pattern as the rota strip in Phase 3B. It should not be a stop at
            all: this is a combobox, the input keeps focus and the arrows drive
            the list. Opting out explicitly is the fix, not styling the ring. */}
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Results"
          tabIndex={-1}
          className="max-h-80 overflow-y-auto py-2"
        >
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
