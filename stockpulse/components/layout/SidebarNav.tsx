'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { navItemsFor } from '@/lib/nav'
import { cn } from '@/lib/cn'
import type { Role } from '@/types'

/**
 * The navigation list, shared by the desktop rail and the mobile drawer so the
 * two cannot drift.
 *
 * The active pill is a single element that animates between links via
 * `layoutId` — the Linear treatment. Framer keeps one node and tweens it from
 * the old position to the new, which is why it slides rather than cutting;
 * rendering a separate highlight per link would just pop.
 *
 * `layoutId` must therefore be unique per mounted instance. The rail and the
 * drawer can both be in the tree at once, and sharing an id would make the
 * pill try to fly between two different containers.
 */
export default function SidebarNav({
  role,
  collapsed = false,
  layoutId,
  onNavigate,
  className,
}: {
  role: Role
  /** Icon-only rail. Labels stay in the accessible name via `aria-label`. */
  collapsed?: boolean
  layoutId: string
  /** Lets the drawer close itself when a link is followed. */
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const prefersReduced = useReducedMotion()

  return (
    <nav className={cn('flex flex-1 flex-col gap-1', className)}>
      {navItemsFor(role).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            // The label is visually gone in the rail but the link still needs
            // an accessible name, so it moves onto the element itself.
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex control-h items-center rounded-lg text-sm font-medium',
              'transition-colors duration-150',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
              active ? 'text-surface' : 'text-muted-strong hover:bg-surface-muted hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg bg-foreground"
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }
                }
              />
            )}
            {/* Above the pill, which is absolutely positioned behind them. */}
            <Icon className="relative z-10 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
