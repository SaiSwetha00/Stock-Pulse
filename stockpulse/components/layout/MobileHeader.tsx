'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { isOptimizableImage } from '@/lib/images'
import { storeInitials } from '@/lib/format'
import { pageTitleFor } from '@/lib/nav'
import MobileDrawer from './MobileDrawer'
import type { Profile, Role, Store } from '@/types'

export default function MobileHeader({
  profile,
  role,
  store,
}: {
  profile: Profile
  role: Role
  store: Store
}) {
  const pathname = usePathname()
  const title = pageTitleFor(pathname)
  const [navOpen, setNavOpen] = useState(false)

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

        <Link
          href="/profile"
          aria-label="Your profile"
          className="ml-auto h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-muted"
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
      </header>

      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} role={role} store={store} />
    </>
  )
}
