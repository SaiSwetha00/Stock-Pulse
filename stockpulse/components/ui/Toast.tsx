'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

/** Errors linger: they usually carry a reason the reader has to act on. */
const DURATIONS: Record<ToastTone, number> = {
  success: 4500,
  info: 5000,
  error: 8000,
}

/** More than three stacked at once and the oldest are unreadable anyway. */
const MAX_VISIBLE = 3

const TONES: Record<
  ToastTone,
  { Icon: typeof CheckCircle2; iconWrap: string; icon: string; role: 'status' | 'alert' }
> = {
  success: {
    Icon: CheckCircle2,
    // Green, not the accent — same reason as Badge. A gold tick on a
    // "Settings saved" toast reads as a warning, not a confirmation.
    iconWrap: 'bg-success-bg',
    icon: 'text-success',
    role: 'status',
  },
  error: {
    Icon: AlertTriangle,
    iconWrap: 'bg-danger-bg',
    icon: 'text-danger',
    // assertive, because a failed write is not something to discover later
    role: 'alert',
  },
  info: {
    Icon: Info,
    iconWrap: 'bg-info-bg',
    icon: 'text-info',
    role: 'status',
  },
}

const ToastContext = createContext<{
  push: (toast: Omit<ToastItem, 'id'>) => void
} | null>(null)

/**
 * `toast.success('Product saved')` from any Client Component under the
 * workspace layout. Throws rather than no-oping when the provider is missing:
 * a toast that silently fails to appear is worse than a crash in development,
 * because the calling code goes on believing it told the user something.
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be called inside <ToastProvider>')
  }
  const { push } = ctx
  return useMemo(
    () => ({
      success: (title: string, description?: string) =>
        push({ tone: 'success', title, description }),
      error: (title: string, description?: string) => push({ tone: 'error', title, description }),
      info: (title: string, description?: string) => push({ tone: 'info', title, description }),
    }),
    [push]
  )
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...toast, id }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATIONS[toast.tone])
      )
    },
    [dismiss]
  )

  // Timers outlive the toast if the tree unmounts mid-flight (a sign-out, say).
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Sits above the modal overlay (z-50) so a failed save inside a dialog
          is still visible, and clears the mobile tab bar (z-40, ~64px) rather
          than hiding behind it. */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end lg:bottom-6 lg:px-6"
      >
        {toasts.map((toast) => {
            const tone = TONES[toast.tone]
            const Icon = tone.Icon
            return (
              <div
                key={toast.id}
                role={tone.role}
                className="sp-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-lg"
              >
                {/* A success toast draws its tick rather than snapping it on.
                    Every save in the app lands here, so this one element is
                    the confirmation animation for the whole product — no
                    module has to build its own.

                    The other tones keep their static lucide icon: an error is
                    not something to make an entrance. */}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}
                >
                  {toast.tone === 'success' ? (
                    <svg
                      viewBox="0 0 24 24"
                      className={`sp-check h-4 w-4 ${tone.icon}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path className="sp-check-path" d="M4.5 12.5 9.5 17.5 19.5 7" />
                    </svg>
                  ) : (
                    <Icon className={`h-4 w-4 ${tone.icon}`} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="tap-target -mr-1.5 -mt-1.5 shrink-0 rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )
          })}
      </div>
    </ToastContext.Provider>
  )
}
