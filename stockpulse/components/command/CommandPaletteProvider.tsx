'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Sparkles, UserRound } from 'lucide-react'
import { signOutEverywhereLocal } from '@/lib/offline/signOut'
import { useAIAssistant } from '@/components/ai/AIAssistantProvider'
import { navItemsFor } from '@/lib/nav'
import type { Role } from '@/types'
import CommandPalette, { type Command } from './CommandPalette'

const CommandPaletteContext = createContext<{ open: () => void; close: () => void } | null>(null)

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

/**
 * Owns the Ctrl/Cmd+K shortcut and builds the command list. Must sit inside
 * AIAssistantProvider — it exposes the assistant as a command.
 */
export default function CommandPaletteProvider({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { open: openAssistant } = useAIAssistant()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // metaKey covers Cmd+K on macOS; ctrlKey covers Windows and Linux.
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = navItemsFor(role).map((item) => ({
      id: `nav:${item.href}`,
      label: item.label,
      group: 'Navigation',
      icon: item.icon,
      keywords: item.href.replace('/', ''),
      run: () => router.push(item.href),
    }))

    const actions: Command[] = [
      {
        id: 'action:assistant',
        label: 'Open AI Assistant',
        group: 'Actions',
        icon: Sparkles,
        keywords: 'ai chat ask help',
        run: openAssistant,
      },
      {
        id: 'action:profile',
        label: 'View Profile',
        group: 'Actions',
        icon: UserRound,
        keywords: 'account me settings',
        run: () => router.push('/profile'),
      },
      {
        id: 'action:logout',
        label: 'Sign Out',
        group: 'Actions',
        icon: LogOut,
        keywords: 'log out exit leave',
        run: () => {
          void signOutEverywhereLocal()
        },
      },
    ]

    return [...nav, ...actions]
  }, [role, router, openAssistant])

  const value = useMemo(() => ({ open, close }), [open, close])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && <CommandPalette commands={commands} onClose={close} />}
    </CommandPaletteContext.Provider>
  )
}
