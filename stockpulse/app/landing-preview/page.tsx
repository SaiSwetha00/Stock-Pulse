import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * The entry page for the landing-page design exploration. Deliberately plain,
 * so it neither competes with nor quietly favours the concepts it links to.
 *
 * The current round is new-1 / new-2 / new-3. The earlier rounds are kept
 * (they have not been deleted) and linked in small print at the bottom.
 */
const CONCEPTS = [
  {
    n: 1,
    href: '/landing-preview/new-1',
    name: 'Clean Premium SaaS',
    summary: 'White and spacious. One primary button, the real dashboard as the hero, then Inventory, Sales, Alerts and Reports in four calm rows.',
  },
  {
    n: 2,
    href: '/landing-preview/new-2',
    name: 'Product-first',
    summary: 'One line of headline, then the real Inventory screen at full width with alerts pinned to it. Almost no marketing text.',
  },
  {
    n: 3,
    href: '/landing-preview/new-3',
    name: 'Modern Editorial',
    summary: 'Warm paper and a large serif. Asymmetric layouts and four short chapters — the shelf, the counter, the warning, the week.',
  },
]

const EARLIER = [
  { label: 'Round 1 · Concept 1', href: '/landing-preview/1' },
  { label: 'Round 1 · Concept 2', href: '/landing-preview/2' },
  { label: 'Round 1 · Concept 3', href: '/landing-preview/3' },
  { label: 'Round 2 · Fintech preview', href: '/landing-preview/final' },
]

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14100c]'

export default function LandingPreviewIndex() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] font-[family-name:var(--font-inter)] text-[#14100c] antialiased">
      <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#F6F5F2;color-scheme:light}' }} />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#6b6157]">Design previews · not live</p>
        <h1 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-tight">StockPulse landing page</h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#4a4139]">
          Three concepts built from the same real product screens and the same real demo-store data. The live landing
          page at <code className="rounded bg-white px-1.5 py-0.5 text-[14px]">/</code> is unchanged.
        </p>

        <ol className="mt-12 grid gap-4">
          {CONCEPTS.map((c) => (
            <li
              key={c.n}
              className="flex flex-col gap-5 rounded-2xl border border-[#E7E1D6] bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            >
              <div>
                <p className="text-[13px] font-medium text-[#6b6157]">Concept {c.n}</p>
                <h2 className="mt-1 text-[21px] font-semibold tracking-tight">{c.name}</h2>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#4a4139]">{c.summary}</p>
              </div>
              <Link
                href={c.href}
                className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#14100c] px-5 text-[14.5px] font-semibold text-white hover:opacity-90 ${focus}`}
              >
                Open concept {c.n} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-14 border-t border-[#E7E1D6] pt-6">
          <p className="text-[13px] text-[#6b6157]">Earlier explorations, kept for reference:</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {EARLIER.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={`inline-block py-1 text-[13.5px] text-[#4a4139] underline underline-offset-4 hover:text-[#14100c] ${focus}`}
                >
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
