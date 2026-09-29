'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Archive, TrendingUp, Settings } from 'lucide-react'
import { useAppCopy } from '@/lib/i18n/client'

/** Structure only; labels come from the dictionary in the viewer's language. */
const TABS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutGrid },
  { href: '/inventory', key: 'inventory', icon: Archive },
  { href: '/monitoring', key: 'monitoring', icon: TrendingUp },
  { href: '/settings', key: 'settings', icon: Settings },
] as const

export default function MobileTabBar() {
  const pathname = usePathname()
  const labels = useAppCopy().tabs

  return (
    /* Presentational hook only — see the note in Sidebar.tsx. The third
       member of the navigation-surface family. */
    <nav
      data-sp-surface="tabbar"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition ${
              active ? 'text-foreground' : 'text-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className={`text-[10px] tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>
              {labels[tab.key]}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
