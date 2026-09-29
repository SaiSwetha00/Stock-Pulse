'use client'

import { createContext, useContext } from 'react'
import type { AppCopy } from './app'
import type { AuthCopy } from './auth'
import type { Locale } from './locales'

/**
 * How translated copy reaches Client Components.
 *
 * THE SHAPE, AND WHY. A server layout resolves the dictionary for the chosen
 * language and passes THE RESOLVED OBJECT down, rather than passing a locale
 * code and letting the client import all three dictionaries. Only the active
 * language crosses into the browser bundle; the other two never ship.
 *
 * TWO CONTEXTS, NOT ONE. The auth pages and the authenticated app never appear
 * together, and their dictionaries have nothing in common. Separate contexts
 * keep each hook precisely typed — `useAppCopy().nav.inventory` is checked —
 * where one merged context would have meant optional fields everywhere and a
 * great deal of `?.`.
 *
 * SERVER COMPONENTS DO NOT USE ANY OF THIS. They call getLocale() from
 * ./server and read the dictionary directly, which is cheaper and avoids
 * turning a component into a Client Component just to read a string.
 *
 * Each hook throws when its provider is missing. A silent English fallback
 * would mean a whole screen quietly reverting to English with nothing to
 * explain why — the one failure mode that is hard to notice and hard to trace.
 */

const LocaleContext = createContext<Locale | null>(null)
const AppCopyContext = createContext<AppCopy | null>(null)
const AuthCopyContext = createContext<AuthCopy | null>(null)

export function AppCopyProvider({
  locale,
  copy,
  children,
}: {
  locale: Locale
  copy: AppCopy
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <AppCopyContext.Provider value={copy}>{children}</AppCopyContext.Provider>
    </LocaleContext.Provider>
  )
}

export function AuthCopyProvider({
  locale,
  copy,
  children,
}: {
  locale: Locale
  copy: AuthCopy
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <AuthCopyContext.Provider value={copy}>{children}</AuthCopyContext.Provider>
    </LocaleContext.Provider>
  )
}

/** The authenticated app's copy. Throws outside AppCopyProvider. */
export function useAppCopy(): AppCopy {
  const copy = useContext(AppCopyContext)
  if (!copy) throw new Error('useAppCopy must be used inside AppCopyProvider (app/(dashboard)/layout.tsx)')
  return copy
}

/** The auth pages' copy. Throws outside AuthCopyProvider. */
export function useAuthCopy(): AuthCopy {
  const copy = useContext(AuthCopyContext)
  if (!copy) throw new Error('useAuthCopy must be used inside AuthCopyProvider (the auth route layouts)')
  return copy
}

/** The active language code, for anything that needs it beyond the strings. */
export function useLocale(): Locale {
  const locale = useContext(LocaleContext)
  if (!locale) throw new Error('useLocale must be used inside a copy provider')
  return locale
}
