import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductShot, { type Palette } from '@/components/design-preview/ProductShot'
import { geist } from './fonts'
import { LINKS, Mark } from './shared'

/**
 * EXPLORATION 1 — Clean product-first.
 *
 * The product is the hero; the words are its caption. A compact centred
 * headline, one line of support, two buttons — then the full dashboard, with
 * its sidebar, at nearly the width of the page, set on a pale "stage" (a
 * bezel of light grey around the window) so it reads as an object on
 * display rather than a screenshot pasted onto white.
 *
 * Colour is almost absent on purpose: near-black type and buttons, one blue
 * used only on the mark, the eyebrow link and the product's active row.
 *
 * `--border` is re-pointed on the root because globals.css's UNLAYERED
 * `* { border-color: var(--border) }` otherwise overrides every border
 * utility in this tree with the app's warm tan.
 */

const PALETTE: Palette = {
  tint: '#F8F9FB',
  line: '#EAECF0',
  accent: '#2563EB',
  accentSoft: '#EEF2FF',
  radius: '12px',
  shadow: '0 1px 2px rgba(16,24,40,0.05), 0 16px 48px -16px rgba(16,24,40,0.18)',
}

/** `embedded`: rendered as a thumbnail inside /design-exploration — skips the page-level html/body styling so it cannot recolour the chooser. */
export default function Exploration1({ embedded = false }: { embedded?: boolean }) {
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'
  return (
    <div
      className={`${geist.variable} min-h-screen bg-white font-[family-name:var(--font-dx-geist)] text-[#0A0D14] antialiased`}
      style={{ ['--border' as string]: '#EAECF0' } as React.CSSProperties}
    >
      {!embedded && <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#FFFFFF;color-scheme:light}' }} />}

      <header className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <span className="inline-flex items-center gap-2">
          <Mark fill="#0A0D14" className="h-7 w-7" />
          <span className="text-[16px] font-semibold tracking-[-0.02em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-[14px] text-[#5B6272] md:flex">
          <a href="#" className={`hover:text-[#0A0D14] ${focus}`}>Product</a>
          <a href="#" className={`hover:text-[#0A0D14] ${focus}`}>How it works</a>
          <a href="#" className={`hover:text-[#0A0D14] ${focus}`}>Pricing</a>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Link href={LINKS.login} className={`hidden rounded-lg px-3 py-2 text-[14px] text-[#5B6272] hover:text-[#0A0D14] sm:inline-flex ${focus}`}>
            Log in
          </Link>
          <Link
            href={LINKS.signup}
            className={`inline-flex h-9 items-center rounded-lg bg-[#0A0D14] px-4 text-[14px] font-medium text-white hover:bg-[#262B36] ${focus}`}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href={LINKS.demo}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] text-[#5B6272] hover:text-[#0A0D14] ${focus}`}
            style={{ borderColor: '#E4E7EC' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" aria-hidden="true" />
            The till now keeps selling offline
            <ArrowRight className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
          </Link>
          <h1 className="mt-6 text-balance text-[clamp(2.4rem,5.2vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Your whole grocery store, on one screen.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[17px] leading-relaxed text-[#5B6272]">
            Stock, sales, suppliers, staff and expiry dates — in a dashboard built for independent grocers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={LINKS.signup}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0A0D14] px-6 text-[15px] font-medium text-white hover:bg-[#262B36] sm:w-auto ${focus}`}
            >
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={LINKS.demo}
              className={`inline-flex h-11 w-full items-center justify-center rounded-lg border bg-white px-6 text-[15px] font-medium text-[#0A0D14] hover:bg-[#F8F9FB] sm:w-auto ${focus}`}
              style={{ borderColor: '#E4E7EC' }}
            >
              Explore the demo store
            </Link>
          </div>
        </div>

        {/* The stage: a pale bezel that turns the window into an object. */}
        <div className="mx-auto mt-14 max-w-6xl rounded-[22px] bg-[#F2F4F7] p-2 ring-1 ring-[#E9ECF1] sm:mt-16 sm:p-3">
          <ProductShot palette={PALETTE} />
        </div>
      </main>
    </div>
  )
}
