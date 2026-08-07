'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Archive, TrendingUp, Settings } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutGrid },
  { href: '/inventory', label: 'INVENTORY', icon: Archive },
  { href: '/monitoring', label: 'MONITORING', icon: TrendingUp },
  { href: '/settings', label: 'SETTINGS', icon: Settings },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
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
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
