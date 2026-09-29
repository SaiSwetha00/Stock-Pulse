'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { appBrandSans } from './fonts'
import './brand-theme.css'

/**
 * Keeps the Palette B preview theme applied across navigations — PREVIEW ONLY.
 *
 *   ?brand=1   turn it on. It then STAYS on while you navigate the app.
 *   ?brand=0   turn it off again.
 *
 * TWO HALVES, AND WHY. ./BrandPreviewBoot applies the theme before the first
 * paint, from a synchronous inline script, which is the only way to avoid a
 * flash of the old design — a `useEffect` cannot run until hydration. This
 * component owns everything after that: client-side navigations inside the
 * dashboard group, where no new document is parsed and the boot script does
 * not run again. It is also what imports the stylesheet.
 *
 * WHY THE FLAG STICKS. A query parameter does not survive an in-app
 * navigation: clicking Inventory in the sidebar drops it, so the first version
 * of this switch turned the theme off the moment you tried to review a second
 * screen — precisely the walk a reviewer needs to take. The flag is therefore
 * remembered in sessionStorage: per tab, cleared when the tab closes, never
 * sent to the server, invisible to every other user, and incapable of reaching
 * production. A cookie was the other option and is the wrong one, because it
 * WOULD travel to the server.
 *
 * Every storage access is wrapped: sessionStorage throws in a private window
 * and can be blocked outright, and a preview flag is not worth an exception
 * that takes the dashboard down with it.
 *
 * WHY THE CLASS GOES ON <html> AND NOT ON THE SHELL. Modals, drawers, toasts,
 * the AI assistant and the command palette render through portals attached to
 * <body>, outside the layout's own tree. A class on the shell would restyle
 * the page but not the dialog that opens over it — precisely the surfaces a
 * reviewer judges the redesign by.
 *
 * It sets NOTHING except two class names. No request, no cookie, no server
 * state: nothing here can reach a Server Action, a query or a permission
 * check, and with the flag off the app renders exactly as it does today.
 */

const THEME_CLASS = 'sp-brand'
const STORAGE_KEY = 'sp-brand-preview'

function remembered(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function remember(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(STORAGE_KEY, '1')
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* Private window or blocked storage: the flag simply does not persist. */
  }
}

export default function BrandPreviewTheme() {
  const params = useSearchParams()
  // Re-run on navigation: Next keeps this component mounted across route
  // changes inside the group, and the flag must survive them.
  const pathname = usePathname()
  const param = params.get('brand')

  useEffect(() => {
    const on = param === '1' ? true : param === '0' ? false : remembered()
    if (param === '1' || param === '0') remember(on)

    const root = document.documentElement
    const classes = [THEME_CLASS, appBrandSans.variable]
    if (on) root.classList.add(...classes)
    else root.classList.remove(...classes)

    // Unmount means the user left the dashboard group — signing out, or any
    // route outside it. The class lives on <html>, which survives a
    // client-side navigation, so without this the sign-in page would inherit
    // a theme meant for the app. It does NOT fire between screens inside the
    // group, so it cannot flicker there.
    return () => root.classList.remove(...classes)
  }, [param, pathname])

  return null
}
