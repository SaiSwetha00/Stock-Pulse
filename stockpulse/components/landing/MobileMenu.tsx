'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

/**
 * The landing page's phone menu. Needs state because a <details> element stays
 * open after an in-page anchor is tapped, leaving the panel over the section
 * the visitor asked to see. Closes on link tap and on Escape.
 */
export default function MobileMenu({
  links,
  cta,
}: {
  links: ReadonlyArray<{ label: string; href: string }>
  cta: ReadonlyArray<{ label: string; href: string; className: string }>
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className={`grid h-11 w-11 place-items-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] ${focus}`}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        id={id}
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-[#E2E8F0] bg-white px-5 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgba(15,23,42,0.25)]"
      >
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-[#EEF2F7] py-3.5 text-[16px] font-medium text-[#0F172A] ${focus}`}
              >
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
