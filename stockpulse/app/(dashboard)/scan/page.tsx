import type { Metadata } from 'next'
import { FlaskConical } from 'lucide-react'
import ScannerPrototype from '@/components/scan/ScannerPrototype'

export const metadata: Metadata = {
  title: 'Barcode scanner (prototype)',
  description: 'A standalone test of camera barcode scanning. Reads a code and shows it.',
  robots: { index: false, follow: false },
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
export default function ScanPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <header className="space-y-3">
        <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Prototype
        </div>
        <h1 className="sp-title text-2xl font-semibold text-foreground">Barcode scanner</h1>
        <p className="text-sm text-muted">
          Point the camera at a product barcode. The decoded number appears below — nothing is
          looked up and nothing is saved. Connecting this to your inventory and to the till comes
          in the next two phases.
        </p>
      </header>

      <ScannerPrototype />

      <section className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        <h2 className="mb-2 font-semibold text-foreground">What this can read</h2>
        <p>
          EAN-13, EAN-8, UPC-A, UPC-E and ITF — the barcodes printed on retail packaging. It also
          recognises QR codes and Code 128, but reports them as the wrong kind of code rather than
          treating them as products.
        </p>
        <p className="mt-2">
          The camera never leaves your device: frames are decoded in the browser and are not
          uploaded anywhere.
        </p>
      </section>
    </div>
  )
}
