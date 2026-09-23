import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * The chooser: the three directions side by side.
 *
 * Each card holds a live, scaled-down iframe of the real route rather than a
 * picture, so what you compare is exactly what opens. The iframes are inert
 * (pointer-events: none) and the whole card is the link.
 *
 * Neutral grey on purpose — it must not tint the directions it is showing.
 */

const DIRECTIONS = [
  {
    id: 'a',
    name: 'Direction A — Light minimal product',
    note: 'White, near-black type, big whitespace, product centred below the headline. Almost no decoration.',
    swatches: ['#FFFFFF', '#111111', '#ECECEC'],
    type: 'Inter · tight headline',
  },
  {
    id: 'b',
    name: 'Direction B — Bold modern SaaS',
    note: 'Heavier type, a soft colour block behind the hero, product set beside the words and cropped by the edge.',
    swatches: ['#EEF3EF', '#16231C', '#2F5D44'],
    type: 'Archivo · extra-bold',
  },
  {
    id: 'c',
    name: 'Direction C — Premium editorial',
    note: 'Warm paper, a large serif headline with italic, hairline rules and an asymmetric 12-column composition.',
    swatches: ['#F6F2EB', '#1A1714', '#7A5C34'],
    type: 'Fraunces · editorial serif',
  },
]

export default function DesignPreviewIndex() {
  return (
    <div className="min-h-screen bg-[#F4F4F5] font-[family-name:var(--font-inter)] text-[#18181B] antialiased">
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#F4F4F5;color-scheme:light}' }} />
      <main className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#71717A]">Visual directions · hero mockups only</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold tracking-tight">Pick a direction</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#52525B]">
          Same product, same words, same buttons in all three — only the design language changes. These are first-screen
          mockups, not finished pages. The live landing page is untouched.
        </p>

        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {DIRECTIONS.map((d) => (
            <li key={d.id}>
              <Link
                href={`/design-preview/${d.id}`}
                className="group block overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-colors hover:border-[#18181B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B]"
              >
                {/* A live, inert view of the real route, scaled to fit the card. */}
                <div className="relative h-[300px] overflow-hidden border-b border-[#E4E4E7] bg-white">
                  <iframe
                    src={`/design-preview/${d.id}`}
                    title={`Preview of ${d.name}`}
                    tabIndex={-1}
                    loading="lazy"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 h-[1000px] w-[1440px] origin-top-left border-0"
                    style={{ transform: 'scale(0.32)' }}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {d.swatches.map((s) => (
                      <span key={s} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: s }} />
                    ))}
                    <span className="ml-2 text-[12.5px] text-[#71717A]">{d.type}</span>
                  </div>
                  <h2 className="mt-4 text-[18px] font-semibold tracking-tight">{d.name}</h2>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#52525B]">{d.note}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium">
                    Open direction {d.id.toUpperCase()}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
