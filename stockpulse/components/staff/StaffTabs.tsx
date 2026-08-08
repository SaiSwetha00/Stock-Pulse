'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users } from 'lucide-react'
import type { Role } from '@/types'
import { isOwner } from '@/lib/permissions'

/**
 * The Staff module's two surfaces.
 *
 * Scheduling and team administration used to live in different places
 * entirely — the rota here, the roster inside Settings — so an owner adding a
 * person and then rostering them crossed modules to do one job. They are the
 * same job, so they are the same module.
 *
 * `Team` is owner-only and simply absent for everyone else rather than shown
 * and bounced: `/staff/team` redirects a manager to `/staff`, and a tab that
 * throws you back where you started is worse than no tab. Same rule
 * `lib/nav.ts` follows for /settings.
 */
export default function StaffTabs({ role }: { role: Role }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/staff', label: 'Schedule', icon: CalendarDays },
    ...(isOwner(role) ? [{ href: '/staff/team', label: 'Team', icon: Users }] : []),
  ]

  if (tabs.length < 2) return null

  return (
    <nav aria-label="Staff sections" className="mt-5 flex gap-1 border-b border-border">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            // -mb-px pulls the tab's own border over the strip's, so the
            // active tab reads as connected to the panel below rather than
            // underlined twice.
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-accent text-foreground'
                : 'border-transparent text-muted hover:border-border-strong hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
