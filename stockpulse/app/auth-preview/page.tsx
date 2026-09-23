import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Concept1 from '@/components/auth-preview/Concept1'
import Concept2 from '@/components/auth-preview/Concept2'
import Concept3 from '@/components/auth-preview/Concept3'

/**
 * The chooser for the three authentication concepts.
 *
 * Each card renders the real concept, scaled down, so what you compare is
 * exactly what opens. Not iframes: next.config.ts sends `X-Frame-Options:
 * DENY` on every route, so a same-origin iframe renders blank. The thumbnail
 * is `inert` and aria-hidden — it holds a form and a second <h1> that must be
 * neither focusable nor announced — and the card's link is stretched over it
 * rather than wrapped around it, because an <a> inside an <a> is invalid.
 */

const CONCEPTS = [
  {
    id: '1',
    name: 'Product + auth split',
    note: 'Split screen. The real dashboard panels sit at full contrast on the left, under a short product line; the form fills the right with no card around it. Sign-up gets a three-segment progress rail.',
    tags: ['Split screen', 'Product visible', 'No card'],
    View: Concept1,
  },
  {
    id: '2',
    name: 'Centred premium card',
    note: 'One centred column: mark, wordmark, then a raised card on a blue glow. No product UI at all — the form is the whole page, and the phone layout is the desktop layout with less padding.',
    tags: ['Centred', 'Raised card', 'No product'],
    View: Concept2,
  },
  {
    id: '3',
    name: 'Product-first immersive',
    note: 'The dashboard fills the screen, blurred and dimmed behind a navy scrim, with the form floating over it as a solid panel and three chips naming stock, expiry and the offline till.',
    tags: ['Full-bleed product', 'Floating panel', 'Depth'],
    View: Concept3,
  },
]

export default function AuthPreviewIndex() {
  return (
    <div className="min-h-screen bg-[#F4F4F5] font-[family-name:var(--font-inter)] text-[#18181B] antialiased">
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#F4F4F5;color-scheme:light}' }} />
      <main className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#71717A]">
          Authentication concepts · mockups only
        </p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold tracking-tight">Pick an auth concept</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#52525B]">
          Three different authentication experiences in the landing page’s brand. Each preview carries all four screens
          — log in, sign up, forgot password and reset password — behind the “Preview” switcher at the top. The forms
          are inactive, and the live authentication pages are untouched.
        </p>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {CONCEPTS.map((c) => (
            <li
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border bg-white transition-colors hover:!border-[#18181B]"
              style={{ borderColor: '#E4E4E7' }}
            >
              <div
                className="relative h-[320px] overflow-hidden border-b bg-[#0A0F1F]"
                style={{ borderColor: '#E4E4E7' }}
              >
                <div
                  inert
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 h-[1000px] w-[1440px] origin-top-left select-none overflow-hidden"
                  style={{ transform: 'scale(0.32)' }}
                >
                  <c.View />
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[12px] text-[#52525B]">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 text-[18px] font-semibold tracking-tight">
                  Concept {c.id} — {c.name}
                </h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#52525B]">{c.note}</p>
                <Link
                  href={`/auth-preview/${c.id}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[#18181B]"
                >
                  Open concept {c.id}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
