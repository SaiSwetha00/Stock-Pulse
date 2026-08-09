'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import SidebarNav from './SidebarNav'
import { FOCUSABLE } from '@/components/ui/Modal'
import { useCommandPalette } from '@/components/command/CommandPaletteProvider'
import { storeInitials } from '@/lib/format'
import type { Role, Store } from '@/types'

/**
 * The phone navigation drawer.
 *
 * This is the only route to most of the app below 1024px: the bottom tab bar
 * carries four destinations and the rail is hidden, so the remaining eight —
 * suppliers, customers, staff, reports, activity, settings, help —
 * had no reachable link at all on a phone.
 */
export default function MobileDrawer({
  open,
  onClose,
  role,
  store,
}: {
  open: boolean
  onClose: () => void
  role: Role
  store: Store
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const { open: openPalette } = useCommandPalette()

  /**
   * Set when the drawer is closing BECAUSE it handed over to another overlay,
   * so the unmount cleanup below skips its focus restore.
   *
   * Without it the handoff loses focus in a way that is easy to miss and hard
   * to read: the search row closes the drawer and opens the palette in the
   * same tick, the palette captures the search button as its return target and
   * focuses its own input — and then, 240ms later when the drawer's exit
   * animation finishes and the effect finally tears down, the drawer yanks
   * focus back to the hamburger it remembered on open. The palette is left
   * open with focus behind it.
   */
  const handedOverRef = useRef(false)

  // `onClose` is an inline arrow at the call site, so a new function arrives on
  // every render of MobileHeader. With it in the dependency list this effect
  // re-ran while the drawer was open — re-capturing `previouslyFocused` from
  // whatever was focused INSIDE the drawer at that moment, and yanking focus
  // back to the panel. Read the latest through a ref instead.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    handedOverRef.current = false

    // Move focus into the panel so the next Tab walks the nav rather than the
    // page behind it.
    panelRef.current?.focus()

    /**
     * Moving focus IN was not enough. Measured with the open-state probe:
     * `trap=ESCAPED x1` — Tab walked the close button and the nav links, then
     * stepped straight out of an `aria-modal` drawer onto "Export CSV" on the
     * page underneath, which is behind a scrim and cannot be seen. The page
     * behind a modal has to stay unreachable, so Tab wraps at both ends and
     * pulls focus back if it is already outside.
     */
    function onKeyDown(e: KeyboardEvent) {
      const panel = panelRef.current
      if (!panel) return

      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      // The panel itself carries tabIndex={-1} and is where focus starts, so
      // `!panel.contains(active)` is the only outside case to catch.
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

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      if (!handedOverRef.current) previouslyFocused?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            // Reduced motion keeps the backdrop fade and drops the travel: a
            // 288px slide is exactly the movement that setting asks to be
            // spared.
            initial={prefersReduced ? { opacity: 0 } : { x: '-100%' }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: '-100%' }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface px-4 py-4 outline-none"
          >
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground">
                <span className="text-xs font-bold tracking-tight text-surface">
                  {storeInitials(store.name)}
                </span>
              </div>
              <div className="min-w-0 leading-none">
                <span className="block truncate text-sm font-bold tracking-tight text-foreground">
                  {store.name}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Store Operations
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="tap-target ml-auto shrink-0 rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* The command palette was the second thing a phone could not
                reach. Its only two triggers were the Topbar search button —
                hidden by the same `hidden lg:block` wrapper that hid the
                assistant — and a Ctrl+K listener, which needs a key a phone
                does not have. So every palette action, and search itself, was
                desktop-only.

                It sits here rather than in the header because the header is
                already four controls at 390px and this one deserves a label:
                "Search" as an icon alone reads as filter-this-page, which is
                the one thing the palette does not do. */}
            <button
              type="button"
              onClick={() => {
                handedOverRef.current = true
                // Hand the palette a return target that will still be in the
                // document when it closes. This button is not one: it lives
                // inside the drawer, the drawer unmounts on the next line, and
                // CommandPalette.tsx:111 captures document.activeElement at
                // open and calls .focus() on it at close. Restoring focus to a
                // detached node silently does nothing, so focus lands on
                // <body> — measured exactly that way, `return=LOST -> BODY`,
                // before this line existed.
                //
                // The hamburger is the honest answer anyway: it is where the
                // user was before the drawer, and it is still on screen.
                document.querySelector<HTMLElement>('[aria-label="Open navigation"]')?.focus()
                onClose()
                openPalette()
              }}
              className="control-h mb-3 flex w-full shrink-0 items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 text-left text-sm text-muted transition-colors hover:border-border-strong hover:bg-surface"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Search or jump to...</span>
            </button>

            {/* Following a link has to dismiss the drawer: the route changes
                underneath it, and leaving it open would cover the page the
                user just asked for. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarNav role={role} layoutId="sidebar-pill-drawer" onNavigate={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
