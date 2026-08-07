'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import { isOptimizableImage } from '@/lib/images'
import { storeInitials } from '@/lib/format'
import { pageTitleFor } from '@/lib/nav'
import { useAIAssistant } from '@/components/ai/AIAssistantProvider'
import { useCommandPalette } from '@/components/command/CommandPaletteProvider'
import NotificationBell from '@/components/notifications/NotificationBell'
import { ROLE_LABELS } from '@/lib/permissions'
import type { Profile, Store } from '@/types'

/**
 * The workspace header, fixed at 56px.
 *
 * The store identity chip that used to sit on the left has moved to the
 * sidebar, where it belongs and where there is room for it. It was two stacked
 * lines plus a status dot, which is what forced this bar to 72px; at 56px
 * there is no honest way to fit it, and repeating the store name on every
 * screen was never worth the height. The page title takes its place — the one
 * thing the chrome should say that the page does not already say for itself in
 * the same spot.
 *
 * The viewer's role is still on screen, in the avatar block on the right,
 * which is where a person's own identity reads more naturally anyway.
 */
export default function Topbar({
  store,
  profile,
  initialUnread = 0,
  searchPlaceholder = 'Search products, sales, customers...',
}: {
  store: Store
  profile: Profile
  /** Server-rendered so the badge is correct on first paint. */
  initialUnread?: number
  searchPlaceholder?: string
}) {
  const { open } = useAIAssistant()
  const { open: openPalette } = useCommandPalette()
  const pathname = usePathname()
  const roleLabel = ROLE_LABELS[profile.role]

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 xl:px-6">
      {/* Not an h1: each page supplies its own heading. This is wayfinding. */}
      <p className="shrink-0 truncate text-sm font-bold tracking-tight text-foreground">
        {pageTitleFor(pathname)}
      </p>

      {/* ---- Search — opens the command palette rather than filtering in place ---- */}
      <button
        type="button"
        onClick={openPalette}
        aria-keyshortcuts="Control+K Meta+K"
        className="control-h relative ml-2 min-w-0 max-w-sm flex-1 cursor-text rounded-lg border border-border bg-surface-muted pl-9 pr-14 text-left text-sm text-muted transition-colors hover:border-border-strong hover:bg-surface"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <span className="block truncate">{searchPlaceholder}</span>
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted xl:block">
          Ctrl K
        </kbd>
      </button>

      {/* ---- Actions ---- */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={open}
          className="control-h flex items-center gap-2 rounded-lg bg-foreground px-3.5 text-sm font-semibold text-surface shadow-xs transition-opacity hover:opacity-90 active:opacity-100"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {/* The label is the first thing to go when the bar gets tight; the
              icon plus the accessible name still identify it. */}
          <span className="hidden xl:inline">AI Assistant</span>
          <span className="sr-only xl:hidden">AI Assistant</span>
        </button>

        <NotificationBell initialUnread={initialUnread} />

        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted"
        >
          <span className="relative shrink-0">
            <span className="block h-8 w-8 overflow-hidden rounded-full bg-surface-muted">
              {isOptimizableImage(profile.avatar_url) ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-strong">
                  {storeInitials(profile.full_name)}
                </span>
              )}
            </span>
            {/* Live indicator, ringed so it reads on any backdrop. */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface">
              <span className="sp-pulse h-2 w-2 rounded-full bg-accent" />
            </span>
          </span>

          <span className="hidden leading-tight xl:block">
            <span className="block max-w-[9rem] truncate text-[13px] font-semibold text-foreground">
              {profile.full_name}
            </span>
            <span className="block max-w-[9rem] truncate text-[11px] text-muted">
              {profile.job_title || roleLabel}
            </span>
          </span>

          {/* The store name left this bar with the identity chip, so it stays
              in the accessible name here — a screen-reader user should still
              be able to tell whose workspace this is. */}
          <span className="sr-only">
            Your profile — {profile.full_name}, {roleLabel} at {store.name}
          </span>
        </Link>
      </div>
    </header>
  )
}
