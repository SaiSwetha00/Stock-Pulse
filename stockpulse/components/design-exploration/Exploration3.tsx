import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import ProductShot, { type Palette } from '@/components/design-preview/ProductShot'
import { interTight } from './fonts'
import { CAPABILITIES, LINKS, Mark } from './shared'

/**
 * EXPLORATION 3 — Premium minimal.
 *
 * Deep navy, very large light-weight type, and whitespace doing the work. The
 * composition is editorial: a two-line headline across the full width, the
 * supporting copy and calls to action set in a narrow column beneath a
 * hairline, three numbered capabilities in hairline-ruled columns, then the
 * product — light, on the dark ground, rising from the bottom edge of the
 * screen and cropped by it.
 *
 * Accents are tiny and deliberate: a periwinkle blue for the index numbers
 * and the link arrow, a soft purple for one dot. The product's own light UI
 * is the brightest thing on the page, which is what makes it the subject.
 *
 * No sans-serif-italic or serif tricks: the sophistication is meant to come
 * from weight 300 at 6rem and from spacing, not from ornament.
 */

const PALETTE: Palette = {
  tint: '#F6F7FA',
  line: '#E6E8EE',
  accent: '#4F6BFF',
  accentSoft: '#EEF0FF',
  radius: '12px',
  shadow: '0 0 0 1px rgba(255,255,255,0.06), 0 50px 100px -40px rgba(0,0,0,0.7)',
}

/** `embedded`: rendered as a thumbnail inside /design-exploration — skips the page-level html/body styling so it cannot recolour the chooser. */
export default function Exploration3({ embedded = false }: { embedded?: boolean }) {
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8FA2FF]'
  return (
    <div
      className={`${interTight.variable} min-h-screen overflow-hidden bg-[#0A0F1F] font-[family-name:var(--font-dx-inter-tight)] text-[#EEF0F6] antialiased`}
      style={{ ['--border' as string]: 'rgba(255,255,255,0.10)' } as React.CSSProperties}
    >
      {!embedded && <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#0A0F1F;color-scheme:dark}' }} />}

      <header className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-6 sm:px-12">
        <span className="inline-flex items-center gap-3">
          <Mark fill="#EEF0F6" stroke="#0A0F1F" className="h-7 w-7" />
          <span className="text-[17px] font-medium tracking-[-0.01em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-10 text-[14px] text-[#8A93AB] md:flex">
          <a href="#" className={`hover:text-white ${focus}`}>Product</a>
          <a href="#" className={`hover:text-white ${focus}`}>How it works</a>
          <Link href={LINKS.login} className={`hover:text-white ${focus}`}>Log in</Link>
        </nav>
        <Link
          href={LINKS.signup}
          className={`inline-flex h-10 items-center rounded-full bg-[#EEF0F6] px-5 text-[14px] font-medium text-[#0A0F1F] hover:bg-white ${focus}`}
        >
          Get started
        </Link>
      </header>

      <main className="mx-auto max-w-[1360px] px-6 pt-16 sm:px-12 sm:pt-24">
        <p className="inline-flex items-center gap-2.5 text-[13px] tracking-[0.02em] text-[#8A93AB]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A898FF]" aria-hidden="true" />
          Store operations for independent grocers
        </p>

        <h1 className="mt-8 text-[clamp(2.9rem,8vw,7rem)] font-light leading-[0.98] tracking-[-0.045em]">
          Run the store.
          <br />
          <span className="text-[#5E6887]">Not the spreadsheets.</span>
        </h1>

        <div className="mt-14 grid gap-10 border-t pt-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="text-[17px] leading-[1.65] text-[#A7AFC4]">
              Stock, sales, suppliers, staff and every expiry date — kept in one calm place, so the shop runs from the
              counter instead of from a notebook.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link
                href={LINKS.signup}
                className={`inline-flex h-12 items-center rounded-full bg-[#4F6BFF] px-7 text-[15px] font-medium text-white hover:bg-[#6580FF] ${focus}`}
              >
                Get started
              </Link>
              <Link
                href={LINKS.demo}
                className={`inline-flex items-center gap-1.5 py-2 text-[15px] text-[#EEF0F6] hover:text-white ${focus}`}
              >
                Explore the demo store <ArrowUpRight className="h-4 w-4 text-[#8FA2FF]" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <ol className="grid gap-8 sm:grid-cols-3 lg:col-span-8 lg:gap-0">
            {CAPABILITIES.map((c, i) => (
              <li key={c.title} className="sm:border-l sm:pl-6 lg:pr-4">
                <span className="text-[13px] tabular-nums text-[#8FA2FF]">0{i + 1}</span>
                <h2 className="mt-3 text-[16px] font-medium tracking-[-0.01em] text-[#EEF0F6]">{c.title}</h2>
                <p className="mt-2 text-[14px] leading-[1.6] text-[#7F88A1]">{c.body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* The product rises from the bottom edge and is cropped by it. */}
        <div className="relative mt-20 h-[340px] overflow-hidden px-1 pt-1 sm:h-[460px] lg:h-[520px]">
          <div className="mx-auto max-w-[1180px]">
            <ProductShot palette={PALETTE} />
          </div>
        </div>
      </main>
    </div>
  )
}
