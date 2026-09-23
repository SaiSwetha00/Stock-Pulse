import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Exploration1 from '@/components/design-exploration/Exploration1'
import Exploration2 from '@/components/design-exploration/Exploration2'
import Exploration3 from '@/components/design-exploration/Exploration3'

/**
 * The chooser for exploration round 2. Each card renders the real exploration
 * component, scaled down, so what you compare is exactly what opens.
 *
 * Not iframes: next.config.ts sends `X-Frame-Options: DENY` on every route (a
 * deliberate clickjacking guard for the dashboard), so a same-origin iframe is
 * refused and renders blank. The thumbnail is `inert` and aria-hidden — it
 * holds links and a second <h1> that must be neither focusable nor announced —
 * and the card's own link is stretched over it rather than wrapped around it,
 * because an <a> inside an <a> is invalid HTML.
 *
 * Neutral grey on purpose — it must not tint the directions it shows.
 */

const EXPLORATIONS = [
  {
    id: '1',
    name: 'Clean product-first',
    note: 'White, a compact centred headline, and the full dashboard — sidebar and all — at nearly page width on a pale stage.',
    swatches: ['#FFFFFF', '#0A0D14', '#2563EB'],
    type: 'Geist',
    View: Exploration1,
    bg: '#FFFFFF',
  },
  {
    id: '2',
    name: 'Bold creative SaaS',
    note: 'Very large heavy type beside the dashboard taken apart — real tiles and panels overlapping on flat blue and lavender blocks.',
    swatches: ['#F6F7FB', '#10142B', '#2F54EB', '#7A5AF8'],
    type: 'Bricolage Grotesque',
    View: Exploration2,
    bg: '#F6F7FB',
  },
  {
    id: '3',
    name: 'Premium minimal',
    note: 'Deep navy, light-weight type at display size, hairline-ruled columns, and the product rising from the bottom edge.',
    swatches: ['#0A0F1F', '#EEF0F6', '#4F6BFF', '#A898FF'],
    type: 'Inter Tight Light',
    View: Exploration3,
    bg: '#0A0F1F',
  },
]

export default function DesignExplorationIndex() {
  return (
    <div className="min-h-screen bg-[#F4F4F5] font-[family-name:var(--font-inter)] text-[#18181B] antialiased">
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#F4F4F5;color-scheme:light}' }} />
      <main className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#71717A]">Design exploration · first screen only</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold tracking-tight">Pick one direction</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#52525B]">
          Three different design languages, all built from the real StockPulse dashboard and the demo store’s real data.
          Hero mockups, not finished pages. The live landing page is untouched.
        </p>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {EXPLORATIONS.map((d) => (
            <li
              key={d.id}
              className="group relative overflow-hidden rounded-2xl border bg-white transition-colors hover:!border-[#18181B]"
              style={{ borderColor: '#E4E4E7' }}
            >
                <div className="relative h-[300px] overflow-hidden border-b" style={{ background: d.bg, borderColor: '#E4E4E7' }}>
                  <div
                    inert
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 h-[940px] w-[1440px] origin-top-left select-none overflow-hidden"
                    style={{ transform: 'scale(0.32)' }}
                  >
                    <d.View embedded />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {d.swatches.map((s) => (
                      <span key={s} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: s }} />
                    ))}
                    <span className="ml-2 text-[12.5px] text-[#71717A]">{d.type}</span>
                  </div>
                  <h2 className="mt-4 text-[18px] font-semibold tracking-tight">
                    {d.id} — {d.name}
                  </h2>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#52525B]">{d.note}</p>
                  {/* Stretched over the whole card, so the card is one click target. */}
                  <Link
                    href={`/design-exploration/${d.id}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[#18181B]"
                  >
                    Open exploration {d.id}
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
