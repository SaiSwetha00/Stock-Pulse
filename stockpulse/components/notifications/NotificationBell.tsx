'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bell, Check, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import {
  KIND_LABELS,
  KIND_STYLES,
  bellLabel,
  formatUnreadCount,
  notificationHref,
  type Notification,
} from '@/lib/notifications'
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/app/(dashboard)/notifications/actions'

export default function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  // Seeded from the server so the badge is right on first paint. The list
  // itself loads on open — nobody needs twenty rows they have not asked to
  // see, and fetching them on mount would be a round trip per navigation.
  const [unread, setUnread] = useState(initialUnread)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const load = useCallback(async () => {
    setLoading(true)
    const feed = await getNotifications()
    setItems(feed.items)
    setUnread(feed.unread)
    setLoading(false)
  }, [])

  /**
   * Escape closes and returns focus to the bell. Without the second half a
   * keyboard user is dropped at the top of the document and has to tab back
   * through the whole header to carry on.
   */
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    // `mousedown`, not `click`: closing on click would fire after a link
    // inside the panel had already been activated, pulling the panel out
    // from under the pointer mid-navigation.
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    // Refresh on open so a panel left closed for an hour is not stale.
    if (next) void load()
  }

  function handleOpenItem(n: Notification) {
    if (n.read_at) return

    // Optimistic: the row is already greyed out by the time the round-trip
    // lands, and a failure only means it stays unread on the next load.
    setItems((prev) =>
      prev.map((i) => (i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i))
    )
    setUnread((u) => Math.max(0, u - 1))
    startTransition(async () => {
      await markNotificationRead(n.id)
      router.refresh()
    })
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      await load()
      router.refresh()
    })
  }

  function handleClearAll() {
    startTransition(async () => {
      await clearNotifications()
      await load()
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={bellLabel(unread)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notification-panel"
        className="control-h relative flex w-10 items-center justify-center rounded-lg text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          // aria-hidden: the count is already in the button's accessible
          // name, and announcing it twice is noise.
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-surface"
          >
            {formatUnreadCount(unread)}
          </span>
        )}
      </button>

      {/* Slide-down: the panel is anchored under the bell, so it grows out of
          it rather than fading in place. `origin-top-right` keeps the scale
          pinned to the corner it hangs from. Reduced motion keeps the fade
          and drops the travel. */}
      <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="notification-panel"
          role="dialog"
          aria-label="Notifications"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 z-50 mt-2 w-[22rem] origin-top-right overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={pending || unread === 0}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={pending || items.length === 0}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-strong transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear all
              </button>
            </div>
          </div>

          {/* aria-live so a screen reader hears the list settle after marking
              all read or clearing, rather than the panel changing silently. */}
          <div className="max-h-96 overflow-y-auto" aria-live="polite" aria-busy={loading || pending}>
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                You&rsquo;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const href = notificationHref(n)
                  const body = (
                    <>
                      <span className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${KIND_STYLES[n.kind]}`}
                        >
                          {KIND_LABELS[n.kind]}
                        </span>
                        {!n.read_at && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Unread" />
                        )}
                        <span className="ml-auto text-[11px] text-muted">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm font-medium text-foreground">{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-xs text-muted">{n.body}</span>}
                    </>
                  )

                  // A real <a> when it navigates and a real <button> when it
                  // does not — never a clickable <div>, which gives a keyboard
                  // user nothing to reach and a screen reader nothing to
                  // announce.
                  const shared = `block w-full px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground ${
                    n.read_at ? '' : 'bg-accent/5'
                  }`

                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link href={href} className={shared} onClick={() => handleOpenItem(n)}>
                          {body}
                        </Link>
                      ) : (
                        <button type="button" className={shared} onClick={() => handleOpenItem(n)}>
                          {body}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
