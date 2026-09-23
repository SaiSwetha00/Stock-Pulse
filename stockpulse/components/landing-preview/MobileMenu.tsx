'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

/**
 * The only client component in the three samples. Everything else is static
 * server-rendered HTML; a phone menu needs state because a <details> element
 * stays open after an in-page anchor is tapped, leaving the panel over the
 * section the visitor just asked to see.
 *
 * Closes on link tap and on Escape. Styling comes in from each concept.
 */
/** Literal class names so Tailwind can see them; must match the concept's desktop-nav breakpoint. */
const HIDE_AT = { md: 'md:hidden', lg: 'lg:hidden' } as const

export default function MobileMenu({
  links,
  cta,
  buttonClass,
  panelClass,
  linkClass,
  hideAt = 'md',
}: {
  links: ReadonlyArray<{ label: string; href: string }>
  cta: ReadonlyArray<{ label: string; href: string; className: string }>
  buttonClass: string
  panelClass: string
  linkClass: string
  hideAt?: keyof typeof HIDE_AT
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={HIDE_AT[hideAt]}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div id={id} hidden={!open} className={panelClass}>
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className={linkClass}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2.5">
          {cta.map((c) => (
            <Link key={c.href} href={c.href} className={c.className} onClick={() => setOpen(false)}>
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
