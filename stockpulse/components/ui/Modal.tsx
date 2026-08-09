'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

// Exported because the two overlays that are not Modals — the assistant panel
// and the phone nav drawer — have to trap focus over exactly the same set of
// controls. Three copies of this selector would drift, and a focus-trap
// selector that drifts silently narrows the trap.
export const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const WIDTHS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
} as const

/**
 * Accessible dialog shell — Esc, focus trap, scroll lock, focus restore, and
 * a fade+scale entrance.
 *
 * On the close animation: every caller mounts this as `{open && <Modal/>}`, so
 * the component is gone the instant its flag flips and an exit animation would
 * never get a frame to run. Rather than change fourteen call sites to an
 * `open` prop, the dialog owns its own visibility: the close paths it controls
 * (Esc, backdrop, the X) lower an internal flag, and the real `onClose` fires
 * only once the exit animation has finished.
 *
 * A parent that unmounts the modal directly — the save handlers do, after a
 * successful write — still skips the exit. That is the right trade: a dialog
 * that has just succeeded should get out of the way immediately, and the paths
 * where someone is deciding whether to leave are the ones worth animating.
 */
export default function Modal({
  title,
  onClose,
  width = 'md',
  footer,
  children,
}: {
  title: string
  onClose: () => void
  width?: keyof typeof WIDTHS
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const prefersReduced = useReducedMotion()
  const [visible, setVisible] = useState(true)

  const requestClose = useCallback(() => setVisible(false), [])

  // Keep the latest onClose without re-running the effect (and re-locking
  // scroll) every time the parent re-renders with a new closure.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  /**
   * Read during RENDER, not in the effect below.
   *
   * The effect is a passive one, so it runs after React has committed the
   * panel — and `autoFocus` on a field inside the panel is applied during that
   * commit. So by the time the effect asked "what had focus before this
   * opened?", the honest answer was already "a field inside this dialog", and
   * that is what got stored as the thing to restore to. On unmount that node
   * is detached, `.focus()` on it does nothing, and focus falls to <body>.
   *
   * Measured: of the eight route modals probed, exactly the two whose first
   * field carries `autoFocus` — Add Customer and Add Supplier — reported
   * `return=LOST -> BODY`. The other six returned to their trigger. Reading it
   * during render happens before the commit, so nothing the panel does on
   * mount can poison it.
   */
  const [previouslyFocused] = useState<HTMLElement | null>(() =>
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
  )

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    // Focus the first control so keyboard and screen-reader users land inside.
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panelRef.current)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setVisible(false)
        return
      }
      if (e.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) {
        e.preventDefault()
        return
      }
      const list = Array.from(nodes)
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      const active = document.activeElement

      // Wrap around instead of letting focus escape to the page behind.
      if (e.shiftKey && (active === firstEl || !panelRef.current?.contains(active))) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [previouslyFocused])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) requestClose()
    },
    [requestClose],
  )

  // Reduced motion still gets a fade, which carries the appear/disappear
  // meaning, but no scale or travel.
  const panelMotion = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 4 },
      }

  return (
    <AnimatePresence onExitComplete={() => onCloseRef.current()}>
      {visible && (
        <motion.div
          key="backdrop"
          onMouseDown={handleBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          // Full-bleed on phones so the dialog can fill the screen; padded
          // from `sm` up so it reads as a floating panel.
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            {...panelMotion}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // Column layout so the title and footer stay put while only the
              // body scrolls — long forms otherwise scroll their own header
              // away.
              'flex w-full flex-col overflow-hidden bg-surface shadow-xl outline-none',
              // Full-screen on phones, floating panel from `sm` up. 100dvh
              // rather than 100vh so mobile browser chrome does not push the
              // footer under the viewport.
              'h-[100dvh] max-h-[100dvh] rounded-none',
              'sm:h-auto sm:max-h-[90vh] sm:rounded-xl',
              WIDTHS[width],
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              {/* h2, not h3. Every page's own heading is the h1, so a dialog
                  titled h3 skipped a level and axe flagged heading-order on
                  each call site. A dialog is a sibling of the page's sections,
                  not a child of one. */}
              <h2 id={titleId} className="sp-heading">
                {title}
              </h2>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close dialog"
                className="tap-target rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* min-h-0 is required: a flex child defaults to min-height:auto and
                would refuse to shrink, so the panel would grow past max-h
                instead of scrolling. */}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
