'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Profile, Store } from '@/types'
import AIAssistantPanel from './AIAssistantPanel'

interface AIAssistantContextValue {
  open: () => void
  close: () => void
}

const AIAssistantContext = createContext<AIAssistantContextValue | null>(null)

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext)
  if (!ctx) throw new Error('useAIAssistant must be used within AIAssistantProvider')
  return ctx
}

export default function AIAssistantProvider({
  profile,
  store,
  children,
}: {
  profile: Profile
  store: Store
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <AIAssistantContext.Provider value={{ open, close }}>
      {children}
      <AIAssistantPanel isOpen={isOpen} onClose={close} profile={profile} store={store} />
    </AIAssistantContext.Provider>
  )
}
