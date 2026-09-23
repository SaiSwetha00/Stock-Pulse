'use client'

import { useEffect, useRef } from 'react'

/**
 * A subtle fade-and-rise as a block scrolls into view — the only motion on
 * the page besides hover colour changes.
 *
 * Content is VISIBLE by default and only hidden once this has mounted and
 * found the element below the fold, so the page reads fully without
 * JavaScript, to crawlers, and in a screenshot taken before hydration.
 * Anything already on screen at mount is left alone rather than blinked out
 * and back in, and reduced-motion users get no animation at all.
 */
export default function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.style.opacity = '0'
    el.style.transform = 'translateY(12px)'
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out'
        el.style.opacity = '1'
        el.style.transform = 'none'
        io.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
