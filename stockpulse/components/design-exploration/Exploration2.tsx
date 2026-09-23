import Link from 'next/link'
import { ArrowRight, ScanBarcode, WifiOff } from 'lucide-react'
import { productTokens, PRODUCT_LABEL, type Palette } from '@/components/design-preview/ProductShot'
import { bricolage } from './fonts'
import { ExpiringPanel, ExpiringTile, LINKS, LowStockPanel, LowStockTile, Mark, ProductsTile } from './shared'

/**
 * EXPLORATION 2 — Bold creative SaaS.
 *
 * Instead of one screenshot, the dashboard is taken apart: its real tiles and
 * panels are laid out as a composition beside very large type, overlapping
 * like cards pulled out of the app and set on the table. Two flat colour
 * panels — one blue-tinted, one lavender — sit behind them as the only
 * decoration. Flat fills, not gradients.
 *
 * Personality comes from Bricolage Grotesque at 800 and from one word set on
 * a solid lavender highlight; the colour stays restrained.
 *
 * Below lg the collage becomes a plain stack of the same components — an
 * overlapping composition does not survive a 375px screen.
 */

const PALETTE: Palette = {
  tint: '#F6F7FB',
  line: '#E4E7F0',
  accent: '#2F54EB',
  accentSoft: '#EDF0FE',
  radius: '16px',
  shadow: 'none',
}

const LIFT = 'shadow-[0_24px_48px_-20px_rgba(20,27,61,0.28)]'

/** `embedded`: rendered as a thumbnail inside /design-exploration — skips the page-level html/body styling so it cannot recolour the chooser. */
export default function Exploration2({ embedded = false }: { embedded?: boolean }) {
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F54EB]'
  return (
    <div
      className={`${bricolage.variable} min-h-screen overflow-x-hidden bg-[#F6F7FB] font-[family-name:var(--font-dx-bricolage)] text-[#10142B] antialiased`}
      style={{ ['--border' as string]: '#E4E7F0' } as React.CSSProperties}
    >
      {!embedded && <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#F6F7FB;color-scheme:light}' }} />}

      <header className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8">
        <span className="inline-flex items-center gap-2.5">
          <Mark fill="#2F54EB" />
          <span className="text-[19px] font-extrabold tracking-[-0.03em]">StockPulse</span>
        </span>
        <nav aria-label="Primary" className="hidden items-center gap-1 rounded-full border bg-white p-1 text-[14px] font-medium text-[#4A5070] md:flex">
          {['Inventory', 'Sales', 'Expiry', 'Team'].map((n) => (
            <a key={n} href="#" className={`rounded-full px-4 py-1.5 hover:bg-[#F0F2FA] hover:text-[#10142B] ${focus}`}>
              {n}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={LINKS.login} className={`hidden px-3 py-2 text-[14px] font-medium text-[#4A5070] hover:text-[#10142B] sm:inline-flex ${focus}`}>
            Log in
          </Link>
          <Link
            href={LINKS.signup}
            className={`inline-flex h-10 items-center rounded-full bg-[#10142B] px-5 text-[14px] font-semibold text-white hover:bg-[#232A4D] ${focus}`}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1320px] items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pt-14">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6B5BD6]">
            <span className="h-2 w-2 rounded-[3px] bg-[#7A5AF8]" aria-hidden="true" />
            Store operations for independent grocers
          </p>
          <h1 className="mt-6 text-[clamp(3rem,6.6vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.05em]">
            Know every shelf before it{' '}
            <span className="whitespace-nowrap rounded-[0.18em] bg-[#E9E5FF] px-[0.12em] text-[#2F54EB]">empties.</span>
          </h1>
          <p className="mt-7 max-w-md text-[18px] leading-relaxed text-[#4A5070]">
            StockPulse tracks stock, sales and expiry dates for your store — and tells you what needs doing today.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={LINKS.signup}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2F54EB] px-7 text-[15.5px] font-semibold text-white hover:bg-[#2445C9] ${focus}`}
            >
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={LINKS.demo}
              className={`inline-flex h-12 items-center justify-center gap-2 px-2 text-[15.5px] font-semibold text-[#10142B] underline decoration-[#C9C1FB] decoration-2 underline-offset-[6px] hover:decoration-[#7A5AF8] ${focus}`}
            >
              Explore the demo store
            </Link>
          </div>
          <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-[14px] font-medium text-[#4A5070]">
            <li className="inline-flex items-center gap-2">
              <ScanBarcode className="h-4 w-4 text-[#2F54EB]" aria-hidden="true" /> Barcode scanning
            </li>
            <li className="inline-flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-[#2F54EB]" aria-hidden="true" /> Works offline at the till
            </li>
          </ul>
        </div>

        {/* The dashboard, taken apart. */}
        <div className="lg:col-span-6" style={productTokens(PALETTE)}>
          {/* lg+: overlapping composition. */}
          <div role="img" aria-label={PRODUCT_LABEL} className="relative hidden h-[600px] lg:block">
            <div aria-hidden="true" className="absolute right-[-12%] top-[6%] h-[78%] w-[88%] rounded-[36px] bg-[#E6EBFD]" />
            <div aria-hidden="true" className="absolute bottom-[-2%] left-[4%] h-[46%] w-[46%] rounded-[36px] bg-[#EEEAFF]" />
            <div aria-hidden="true" className="select-none">
              <ProductsTile className={`absolute left-[6%] top-[2%] w-[190px] ${LIFT}`} />
              <LowStockTile className={`absolute left-[calc(6%+206px)] top-[2%] w-[190px] ${LIFT}`} />
              <LowStockPanel line={PALETTE.line} className={`absolute left-[14%] top-[25%] w-[470px] ${LIFT}`} />
              <ExpiringTile className={`absolute right-[-4%] top-[10%] w-[180px] ${LIFT}`} />
              <ExpiringPanel line={PALETTE.line} rows={2} className={`absolute bottom-[2%] right-[-6%] w-[390px] ${LIFT}`} />
            </div>
          </div>

          {/* Below lg: the same real components, stacked. */}
          <div role="img" aria-label={PRODUCT_LABEL} className="lg:hidden">
            <div aria-hidden="true" className="select-none space-y-3 rounded-[28px] bg-[#E6EBFD] p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-3">
                <LowStockTile className="p-4" />
                <ExpiringTile className="p-4" />
              </div>
              <LowStockPanel line={PALETTE.line} />
              <ExpiringPanel line={PALETTE.line} rows={2} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
