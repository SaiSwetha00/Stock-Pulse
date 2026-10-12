'use client'

import { useEffect } from 'react'

/**
 * Sets the browser-tab title from the client.
 *
 * For the one page the Metadata API cannot title: app/not-found.tsx. In this
 * Next.js version only `global-not-found.js` may export metadata for a 404,
 * and adopting it would replace the root layout for every unmatched URL — an
 * architectural change to fix a tab label. A 404 is `noindex`, so a title set
 * after hydration costs nothing a crawler would read.
 */
export default function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title
  }, [title])
  return null
}
