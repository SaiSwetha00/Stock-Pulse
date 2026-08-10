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
    <div
      ref={rootRef}
      className="sp-hero-photo relative h-full w-full overflow-hidden rounded-[20px] border border-white/10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] ring-1 ring-inset ring-white/[0.08]"
    >
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
          className="sp-hero-photo__img object-cover object-[30%_62%]"
          placeholder="blur"
        />
      </div>

      {/* TREATMENT, rebuilt lighter.
          The first version stacked three near-opaque gradients and the photo
          disappeared behind them — it went almost black, which defeats the
          entire point of using a photograph. These are targeted instead of
          global: darkness only where a card actually sits, plus a soft
          vignette to keep the eye in the middle. The picture stays a picture. */}

      {/* Vignette — edges only, centre untouched. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_95%_at_52%_38%,transparent_0%,transparent_42%,rgba(0,0,0,0.30)_74%,rgba(0,0,0,0.66)_100%)]" />

      {/* Under the Low-Stock card, bottom-left only. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      {/* Under the Assistant card, top-right only — and it still quiets this
          shop's own rand price tags, just without blacking out the shelf. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-black/90 via-black/40 to-transparent" />

      {/* Premium finish: a slow specular sheen that crosses the frame every
          14s, and a warm gold cast pinned to the top-left so the image sits
          inside the palette rather than beside it. Both are cosmetic and both
          stop dead under reduced motion. */}
      <div className="sp-hero-photo__sheen pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 mix-blend-soft-light bg-[radial-gradient(90%_70%_at_18%_12%,rgba(224,179,67,0.42)_0%,transparent_62%)]" />
    </div>
  )
}
