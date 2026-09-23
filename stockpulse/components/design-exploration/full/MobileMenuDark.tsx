'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

/**
 * The phone menu for the navy landing page. A copy of components/landing
 * /MobileMenu's behaviour — closes on link tap and on Escape, because a
 * <details> element stays open over the section the visitor asked to see —
 * restyled for the dark surface. Copied rather than themed so the live
 * landing page's component is not touched by a preview.
 */
export default function MobileMenuDark({
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
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA2FF]'

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className={`grid h-11 w-11 place-items-center rounded-full border text-[#EEF0F6] ${focus}`}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div id={id} hidden={!open} className="absolute inset-x-0 top-20 border-b bg-[#0A0F1F] px-6 pb-7 pt-2">
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block border-b py-4 text-[17px] font-light text-[#EEF0F6] ${focus}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-3">
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
