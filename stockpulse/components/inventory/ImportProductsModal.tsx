'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Download, FileUp, Plus, RefreshCw } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { buildImportPreview, type ImportPreview } from '@/lib/importCsv'
import { csvFilename, downloadCsv } from '@/lib/csv'
import { sampleImportCsv } from '@/lib/inventoryCsv'
import type { CategoryOption } from '@/lib/categories'
import { importProducts } from '@/app/(dashboard)/inventory/actions'
import type { Product } from '@/types'

/** Refuse absurd files before reading them into memory. */
const MAX_BYTES = 2 * 1024 * 1024

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${tone}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
    </div>
  )
}

/**
 * Two-step import: parse and classify locally, show exactly what will happen,
 * and only write once the user confirms. An import that silently overwrites
 * priced stock is not something to run on a single click.
 */
export default function ImportProductsModal({
  products,
  categories,
  onClose,
}: {
  products: Product[]
  /** This store's categories, so a CSV naming one by label resolves against
   *  the shop's own list rather than a built-in five. */
  categories: CategoryOption[]
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [parseError, setParseError] = useState('')
  const [busy, setBusy] = useState(false)

  const existingSkus = useMemo(
    () => new Set(products.map((p) => p.sku?.trim().toLowerCase()).filter(Boolean) as string[]),
    [products]
  )

  async function handleFile(file: File) {
    setParseError('')
    setPreview(null)
    setFileName(file.name)

    if (file.size > MAX_BYTES) {
      setParseError('That file is larger than 2 MB. Split it into smaller batches.')
      return
    }
    try {
      const text = await file.text()
      const result = buildImportPreview(text, existingSkus, categories)
      if (result.missingRequired.length > 0) {
        setParseError(
          `The file needs a "${result.missingRequired.join('", "')}" column. Export your inventory to CSV to see the expected headers.`
        )
        return
      }
      if (result.rows.length === 0) {
        setParseError('No data rows found beneath the header.')
        return
      }
      setPreview(result)
    } catch {
      setParseError('That file could not be read as CSV.')
    }
  }

  async function handleConfirm() {
    if (!preview || busy) return
    const good = preview.rows
      .filter((r) => r.action !== 'error')
      .map((r) => ({ line: r.line, input: r.input }))

    if (good.length === 0) {
      toast.info('Nothing to import', 'Every row in this file has a problem.')
      return
    }

    setBusy(true)
    // The file-level fact, passed explicitly: only a file that has a Stock or
    // Expiry column may replace a product's stock lots.
    const result = await importProducts(good, { replaceLots: preview.replacesLots })
    setBusy(false)

    if (result.message) {
      toast.error('Import failed', result.message)
      return
    }

    const summary = [
      result.created ? `${result.created} added` : null,
      result.updated ? `${result.updated} updated` : null,
      result.failed.length ? `${result.failed.length} failed` : null,
    ]
      .filter(Boolean)
      .join(' · ')

    if (result.failed.length > 0) {
      toast.error('Imported with problems', summary)
    } else {
      toast.success('Import complete', summary)
    }
    router.refresh()
    onClose()
  }

  return (
    <Modal title="Import products from CSV" width="lg" onClose={onClose}>
      <div className="space-y-5 px-6 py-5">
        {!preview && (
          <>
            <p className="text-sm leading-relaxed text-muted-strong">
              Upload a CSV with a <strong>Name</strong> column. Rows are matched to
              existing products by <strong>SKU</strong> — a matching SKU updates that
              product, anything else is added. Nothing is written until you confirm.
            </p>
            {/*
              Required vs optional, stated BEFORE the upload.

              This was a flat list of recognised headers, which says what the
              importer will read but not what it needs. The only thing that
              told you Name was mandatory was `missingRequired` — an error you
              can reach solely by having already failed an import.

              "Name" is the sole required column because that is literally what
              the parser enforces: buildImportPreview pushes "Name" onto
              missingRequired and nothing else. Everything below is stated to
              match that, not to describe an ideal file.

              Deliberately NOT written as a comment row inside the sample CSV,
              which was the other option. parseCsv has no notion of comments:
              it takes table[0] as the header row, so a leading "# required:
              Name" line would BE the header and every real column would come
              back unrecognised. Guidance that breaks the file it describes is
              worse than no guidance.
            */}
            <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm">
              <p className="text-muted-strong">
                <strong className="text-foreground">Required:</strong> Name.
              </p>
              <p className="mt-1.5 text-muted-strong">
                <strong className="text-foreground">Optional:</strong> Brand, SKU, Barcode,
                Category, Unit Price, Unit, Stock, Min Stock, Expiry Date.
              </p>
              <p className="mt-2 text-muted">
                Dates as YYYY-MM-DD (2026-03-31). Numbers plain, with no currency symbol
                or thousands separator (1250.50, not $1,250.50). Leave any optional cell
                blank to skip it.
              </p>
            </div>

            {/*
              This used to end "Exporting your inventory first gives you the exact
              format back", which is only useful to someone who already has
              inventory - i.e. never the person importing for the first time. The
              sample is the answer to the same question without the round trip.

              It is generated, not a static file in public/: lib/inventoryCsv.ts
              builds it from the same header constants the export uses and filters
              it through the parser's own HEADER_MAP, so it cannot drift from
              either. A checked-in file would be a third copy of the format.
            */}
            <button
              type="button"
              onClick={() => downloadCsv(csvFilename('stockpulse-sample-import'), sampleImportCsv())}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-muted-strong transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download sample CSV
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex control-h w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong py-10 text-sm font-semibold text-muted-strong transition hover:border-border-strong hover:bg-surface-muted"
            >
              <FileUp className="h-5 w-5" aria-hidden="true" />
              {fileName || 'Choose a CSV file'}
            </button>
          </>
        )}

        {parseError && (
          <div role="alert" className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {parseError}
          </div>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="To add"
                value={preview.createCount}
                tone="bg-accent-soft text-accent-ink"
              />
              <Stat
                label="To update"
                value={preview.updateCount}
                tone="bg-warning-bg text-warning"
              />
              <Stat label="Problems" value={preview.errorCount} tone="bg-danger-bg text-danger" />
            </div>

            {preview.unknownHeaders.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Ignored unrecognised column{preview.unknownHeaders.length === 1 ? '' : 's'}:{' '}
                  {preview.unknownHeaders.join(', ')}
                </span>
              </p>
            )}

            {/* Said before the click, not after: a file with a Stock or
                Expiry column rewrites what is on the shelf, and for a product
                carrying several dated lots that is destructive in a way "12
                updated" does not convey. */}
            {preview.replacesLots && preview.updateCount > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  This file has a stock column, so each matched product&apos;s existing stock lots
                  and expiry dates are replaced by the single lot its row describes.
                </span>
              </p>
            )}

            {/* The preview table has five columns and does not reflow, and
                the modal is full-bleed on a phone — so it has to be able to
                scroll sideways inside its own box rather than pushing the
                dialog wider than the viewport. */}
            <div className="max-h-72 overflow-auto rounded-xl border border-border">
              <table className="sp-table w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-muted">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th scope="col" className="px-3 py-2.5">
                      Line
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className="border-t border-border align-top">
                      <td className="px-3 py-2 text-muted">{r.line}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{r.input.name || '—'}</p>
                        {r.input.sku && <p className="text-xs text-muted">SKU: {r.input.sku}</p>}
                        {r.input.barcode && (
                          <p className="sp-num text-xs text-muted">Barcode: {r.input.barcode}</p>
                        )}
                        {r.problems.length > 0 && (
                          <p className="mt-0.5 text-xs text-danger">{r.problems.join(' ')}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.action === 'create' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink">
                            <Plus className="h-3 w-3" aria-hidden="true" /> Add
                          </span>
                        )}
                        {r.action === 'update' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                            <RefreshCw className="h-3 w-3" aria-hidden="true" /> Update
                          </span>
                        )}
                        {r.action === 'error' && (
                          <span className="text-xs font-semibold text-danger">Skip</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={() => {
                  setPreview(null)
                  setFileName('')
                  if (fileRef.current) fileRef.current.value = ''
                }}
              >
                Choose another file
              </Button>
              <Button
                loading={busy}
                onClick={handleConfirm}
                disabled={preview.createCount + preview.updateCount === 0}
              >
                Import {preview.createCount + preview.updateCount} row
                {preview.createCount + preview.updateCount === 1 ? '' : 's'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
