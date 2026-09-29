import type { Metadata } from 'next'
import { FlaskConical } from 'lucide-react'
import ScannerPrototype from '@/components/scan/ScannerPrototype'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.scan
  return { title, description, robots: { index: false, follow: false } }
}

/**
 * PHASE 2 OF BARCODE SCANNING — a prototype, on purpose.
 *
 * DELIBERATELY NOT IN `lib/nav.ts`. Adding it would put an unfinished feature
 * in the sidebar and the command palette for every role. Same pattern as
 * `/staff/team` (D15) and `/settings/categories` (D36): a real route, reached
 * by URL, absent from NAV_ITEMS.
 *
 * NO ROLE GUARD, and that is considered rather than omitted. Every guarded
 * route in this app gates access to a shop's DATA. This page reads nothing and
 * writes nothing — it opens the camera on the viewer's own device and prints
 * what it sees. There is nothing to authorise beyond being signed in, which
 * the (dashboard) layout already requires. Phase 3 introduces a product
 * lookup, and THAT is the point at which this needs `canManage` or similar,
 * because that is when it starts answering questions about inventory.
 */
export default async function ScanPage() {
  const t = appCopy(await getLocale()).scanner
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <header className="space-y-3">
        <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          {t.pagePrototype}
        </div>
        <h1 className="sp-title text-2xl font-semibold text-foreground">{t.pageTitle}</h1>
        <p className="text-sm text-muted">{t.pageIntro}</p>
      </header>

      <ScannerPrototype />

      <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        <h2 className="mb-2 font-semibold text-foreground">{t.pageCanReadTitle}</h2>
        <p>{t.pageCanReadBody}</p>
        <p className="mt-2">{t.pagePrivacy}</p>
      </section>
    </div>
  )
}
