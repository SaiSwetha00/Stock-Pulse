import type { Metadata } from 'next'
import { ICONS } from '@/components/brand-preview/icons'

export const metadata: Metadata = { title: 'Icon concepts — StockPulse' }

/**
 * The three icon concepts, shown the way an icon is actually judged:
 *
 *   1. large, once, to see the drawing;
 *   2. at the real pixel sizes it has to survive (16 → 128), unscaled;
 *   3. as a flat silhouette, colour removed, because a mark that only works
 *      in gradient is a gradient rather than a mark;
 *   4. on both a dark and a light ground, since a favicon sits in whichever
 *      browser chrome the visitor uses;
 *   5. beside the wordmark, which is where it will spend most of its life.
 *
 * Preview only — production still ships the current pulse mark.
 */

const PIXEL_SIZES = [16, 32, 48, 64, 128]

export default function IconConceptsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1F] font-[family-name:var(--font-inter)] text-[#EEF0F6] antialiased">
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#0A0F1F;color-scheme:dark}' }} />

      <main className="mx-auto max-w-[1100px] px-6 py-14 sm:px-10">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#8A93AB]">
          Brand preview · icon concepts
        </p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold tracking-[-0.03em]">
          Three new StockPulse marks
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#A7AFC4]">
          None of these reuses the current pulse line. Each is shown large, at the pixel sizes it must survive, as a
          flat silhouette with the colour removed, and on both grounds. The production icon is unchanged.
        </p>

        <div className="mt-14 space-y-20">
          {ICONS.map(({ id, name, Icon, idea, says, watch }) => (
            <section key={id} id={id} className="scroll-mt-10 border-t border-white/[0.10] pt-10">
              <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
                {/* 1 — large */}
                <div>
                  <Icon
                    uid={`${id}-hero`}
                    className="h-[168px] w-[168px] rounded-[44px] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
                  />
                  <h2 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">
                    Icon {id.toUpperCase()} — {name}
                  </h2>
                </div>

                <div className="min-w-0">
                  <dl className="grid gap-4 sm:grid-cols-3">
                    {[
                      ['The drawing', idea],
                      ['What it says', says],
                      ['Watch for', watch],
                    ].map(([term, def]) => (
                      <div key={term} className="rounded-2xl border border-white/[0.10] bg-white/[0.03] p-4">
                        <dt className="text-[12px] uppercase tracking-[0.1em] text-[#8FA2FF]">{term}</dt>
                        <dd className="mt-2 text-[14px] leading-[1.6] text-[#A7AFC4]">{def}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* 2 — real pixel sizes */}
                  <div className="mt-8 rounded-2xl border border-white/[0.10] p-5">
                    <p className="text-[12.5px] text-[#8A93AB]">Actual size — 16, 32, 48, 64 and 128px</p>
                    <div className="mt-4 flex flex-wrap items-end gap-6">
                      {PIXEL_SIZES.map((px) => (
                        <span key={px} className="flex flex-col items-center gap-2">
                          <Icon uid={`${id}-${px}`} className="rounded-[22%]" style={{ width: px, height: px }} />
                          <span className="text-[11px] text-[#6B7489]">{px}px</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3/4 — silhouette and both grounds */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/[0.10] p-5">
                      <p className="text-[12.5px] text-[#8A93AB]">Silhouette</p>
                      <Icon uid={`${id}-flat`} variant="flat" className="mt-3 h-14 w-14" />
                    </div>
                    <div className="rounded-2xl border border-white/[0.10] bg-white p-5">
                      <p className="text-[12.5px] text-[#52525B]">On light</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Icon uid={`${id}-light`} className="h-14 w-14 rounded-[22%]" />
                        <Icon uid={`${id}-lightflat`} variant="flat" flatColor="#0A0F1F" className="h-10 w-10" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.10] p-5">
                      <p className="text-[12.5px] text-[#8A93AB]">With the wordmark</p>
                      <span className="mt-3 inline-flex items-center gap-2.5">
                        <Icon uid={`${id}-word`} className="h-9 w-9 rounded-[24%]" />
                        <span className="text-[17px] font-semibold tracking-[-0.01em]">StockPulse</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-white/[0.10] pt-6 text-[13px] text-[#6B7489]">
          Preview only. The production favicon, Apple icon, PWA icons and in-app logo are unchanged.
        </p>
      </main>
    </div>
  )
}
