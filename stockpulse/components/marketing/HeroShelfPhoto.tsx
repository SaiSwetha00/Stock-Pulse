'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import shelfPhoto from '@/public/hero/grocery-shelf.jpg'

/**
 * The hero: a photograph of a real grocery shelf, moved with CSS.
 *
 * This replaces a three.js WebGL scene. Three rounds of procedural work —
 * geometry, then grouping and instancing, then a PMREM environment map with
 * procedural roughness maps — got closer each time and never got to "real
 * produce". The honest reading is that photoreal fruit is a texture problem,
 * and the only textures available were ones drawn at runtime on a canvas.
 * A photograph solves it outright. See D51.
 *
 * MOTION. The photo drifts continuously — a slow scale and translate on a
 * 34-second loop — and tilts a little toward the pointer. Both are CSS
 * transforms on a single element, so they run on the compositor and cost no
 * JavaScript per frame. The pointer handler writes two custom properties and
 * nothing else; it never touches React state, so it cannot cause a render.
 *
 * The two overlay cards read the same custom properties from
 * document.documentElement and move slightly further, which is what makes them
 * sit in front of the image rather than on it. Setting the variables on the
 * root rather than passing props is what keeps this component from having to
 * own markup that belongs to HeroSection.
 *
 * CLS. `next/image` with a STATIC import knows the intrinsic size at build
 * time (1600x1067), so it reserves the box before a byte of image arrives.
 * `fill` inside a fixed-height parent means layout is decided by CSS, not by
 * the decode.
 */
export default function HeroShelfPhoto() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Reduced motion is handled in CSS for the drift (a media query on the
    // keyframes) and here for the tilt, so a user who asks for less gets a
    // completely still photograph — no listener, nothing to update.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const el = rootRef.current
    if (!el) return

    let frame = 0
    let px = 0
    let py = 0

    const apply = () => {
      frame = 0
      document.documentElement.style.setProperty('--sp-hero-mx', px.toFixed(4))
      document.documentElement.style.setProperty('--sp-hero-my', py.toFixed(4))
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      // -1..1 from the centre of the image, clamped so a pointer at the far
      // side of a wide monitor does not peg the tilt.
      px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)))
      py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)))
      // One write per animation frame, not one per pointer event — a pointer
      // can fire far more often than the screen refreshes.
      if (!frame) frame = requestAnimationFrame(apply)
    }

    // Listening on the window rather than the element: the cards sit outside
    // this component's box, and a tilt that only responds while the pointer is
    // literally over the photo feels broken as you approach it.
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
      document.documentElement.style.removeProperty('--sp-hero-mx')
      document.documentElement.style.removeProperty('--sp-hero-my')
    }
  }, [])

  return (
    <div ref={rootRef} className="sp-hero-photo relative h-full w-full overflow-hidden rounded-2xl border border-border">
      {/* The moving layer. Overflow is clipped by the parent, so the drift can
          scale past the frame without the page ever seeing a scrollbar. */}
      <div className="sp-hero-photo__inner absolute inset-0">
        <Image
          src={shelfPhoto}
          alt="A grocery shop shelf stocked with fruit, vegetables and packaged goods"
          fill
          // The hero box is ~560px at its widest and this is the only image
          // above the fold, so it is worth fetching early and at a size that
          // matches the box rather than the source.
          sizes="(max-width: 1024px) 90vw, 560px"
          priority
          quality={78}
          // Favour the left two-thirds — the apple crates and the stacked
          // produce — and push the shop's own signage toward the edge where
          // the scrim is heaviest. The first crop left a legible "R24.99"
          // price tag mid-frame, which is another retailer's price in rand on
          // a product that prices everything in rupees.
          className="object-cover object-[30%_62%]"
          placeholder="blur"
        />
      </div>

      {/* Scrim. Two jobs, and the second is the one that matters: it sinks the
          photograph into a very dark page so the overlay cards keep their
          contrast, and it quiets the shop's own signage — this is a real store
          with its own price tags in rand, and unreadable is the right amount
          of readable for them. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_20%,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.86)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
      {/* The right edge specifically. The crop pushed this store's own
          promotional signage and its rand price tags over here, and at the
          edge they are decoration; legible, they are another retailer's
          prices in the wrong currency on our hero. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[46%] bg-gradient-to-l from-black/92 via-black/55 to-transparent" />
    </div>
  )
}
