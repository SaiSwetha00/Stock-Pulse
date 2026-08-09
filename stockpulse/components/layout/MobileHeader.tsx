'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles } from 'lucide-react'
import { isOptimizableImage } from '@/lib/images'
import { storeInitials } from '@/lib/format'
import { pageTitleFor } from '@/lib/nav'
import MobileDrawer from './MobileDrawer'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useAIAssistant } from '@/components/ai/AIAssistantProvider'
import type { Profile, Role, Store } from '@/types'

export default function MobileHeader({
  profile,
  role,
  store,
  initialUnread = 0,
}: {
  profile: Profile
  role: Role
  store: Store
  /** Seeded from the server so the badge is correct on first paint, exactly as
   *  Topbar does it — the two headers must not disagree about the count. */
  initialUnread?: number
}) {
  const pathname = usePathname()
  const title = pageTitleFor(pathname)
  const [navOpen, setNavOpen] = useState(false)
  const { open: openAssistant } = useAIAssistant()

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={navOpen}
          className="tap-target -ml-2 shrink-0 rounded-lg text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Not an h1: the page below supplies its own heading. This is a
            wayfinding label in the app chrome. */}
        <p className="min-w-0 truncate text-base font-bold text-foreground">{title}</p>

        {/* Below 1024px there was NO way to reach notifications at all: the
            bell lives in Topbar, and Topbar is `hidden lg:block`. Phase 3C-i
            found this while investigating what looked like a focus bug — the
            probe was clicking a `display:none` bell — and correctly logged it
            as a product gap rather than fixing it there.

            A phone header has room for two controls beside the title, and this
            is the more important of the two: a low-stock alert is the reason
            somebody opens the app, while the profile is somewhere they go
            once. */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Same gap as the bell, found the same way and one phase later: the
              assistant's only trigger lived in Topbar, and Topbar is wrapped in
              `hidden lg:block`. It was never absent — it was in the DOM at
              390px computing to display:none, which is why it survived every
              grep and every route sweep. Measured: at 390 the Topbar scope
              reports 4 controls, 0 reachable.

              That left the assistant with no way in on a phone at all. The
              command palette could have been the second route to it, but the
              palette's own triggers are the Topbar search button and Ctrl+K —
              one hidden by the same wrapper, the other needing a key a phone
              does not have. Two locks on one door.

              It goes here rather than in the tab bar because the tab bar is
              four destinations and this is not a destination; and ahead of the
              profile for the reason the bell is — this is why somebody picks
              the phone up mid-shift, the profile is somewhere they go once. */}
          <button
            type="button"
            onClick={openAssistant}
            aria-label="AI Assistant"
            className="tap-target shrink-0 rounded-lg text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </button>

          <NotificationBell initialUnread={initialUnread} />

          <Link
            href="/profile"
            aria-label="Your profile"
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-muted"
          >
          {isOptimizableImage(profile.avatar_url) ? (
            // 36px = the h-9 w-9 box, so the header reserves the space before
            // the image loads and nothing shifts underneath it. alt="" because
            // the link already carries the accessible name.
            <Image
              src={profile.avatar_url}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-strong">
                {storeInitials(profile.full_name)}
              </span>
            )}
          </Link>
        </div>
      </header>

      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} role={role} store={store} />
    </>
  )
}
