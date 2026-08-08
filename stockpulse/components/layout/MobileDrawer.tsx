'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import SidebarNav from './SidebarNav'
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

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Move focus into the panel so the next Tab walks the nav rather than the
    // page behind it.
    panelRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

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
