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
 *
 * WHY IT WATCHES <head>. Setting document.title once in an effect was measured
 * NOT to stick in production: Next streams the metadata <title> in after
 * hydration, and React claims the title element and writes the root layout's
 * English title over ours. So the title is re-applied whenever the head
 * changes, only while this component is mounted, and only when it differs -
 * which cannot loop, because the second write finds it equal.
 */
export default function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    const apply = () => {
      if (document.title !== title) document.title = title
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [title])
  return null
}
