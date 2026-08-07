'use client'

import Image from 'next/image'
import { isOptimizableImage } from '@/lib/images'
import { storeInitials } from '@/lib/format'
import SidebarNav from './SidebarNav'
import type { Role, Store } from '@/types'

/**
 * The desktop rail.
 *
 * Three widths, not two. The brief asks for an icon-only collapse below
 * 1024px and, separately, for a slide-in drawer below 1024px — which cannot
 * both be the same breakpoint. Resolved the way the pattern normally works:
 *
 *   < 1024px (below lg)  — hidden; MobileDrawer takes over
 *   1024–1280px (lg)     — icon-only rail, 64px
 *   >= 1280px (xl)       — full rail with labels, 256px
 *
 * That keeps the icon-only state (a real constraint at 1024px, where a 256px
 * rail eats a quarter of the viewport) without leaving phones with a rail they
 * have no room for.
 *
 * The two `SidebarNav`s are switched with CSS rather than a media-query hook
 * on purpose: a hook would have to guess the width during SSR and would
 * hydrate with the wrong one. `display: none` also drops the hidden copy out
 * of the accessibility tree, so a screen reader hears one nav, not two.
 */
export default function Sidebar({ role, store }: { role: Role; store: Store }) {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface py-4 lg:flex lg:w-16 lg:items-center lg:px-2 xl:w-64 xl:items-stretch xl:px-4 xl:py-6">
      {/* ---- Store identity ---- */}
      <div className="mb-6 flex items-center gap-2.5 xl:px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground">
          {isOptimizableImage(store.logo_url) ? (
            // 36px matches the h-9 w-9 box, so the space is reserved before the
            // bytes land and the rail cannot reflow. alt="" is deliberate: the
            // store name is spelled out beside it at xl, and naming the logo
            // would have a screen reader announce it twice.
            <Image
              src={store.logo_url}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold tracking-tight text-surface">
              {storeInitials(store.name)}
            </span>
          )}
        </div>

        {/* Hidden in the rail; the logo tile carries the identity there. */}
        <div className="hidden min-w-0 leading-none xl:block">
          <span className="block truncate text-sm font-bold tracking-tight text-foreground">
            {store.name}
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Store Operations
          </span>
        </div>
      </div>

      <SidebarNav role={role} collapsed layoutId="sidebar-pill-rail" className="xl:hidden" />
      <SidebarNav role={role} layoutId="sidebar-pill-full" className="hidden xl:flex" />
    </aside>
  )
}
