'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Download, FileUp, Plus, RefreshCw } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { buildImportPreview, type ImportPreview } from '@/lib/importCsv'
import { useAppCopy } from '@/lib/i18n/client'
import { csvFilename, downloadCsv } from '@/lib/csv'
import { INVENTORY_CSV_HEADERS as H, sampleImportCsv } from '@/lib/inventoryCsv'
import type { CategoryOption } from '@/lib/categories'
import { importProducts } from '@/app/(dashboard)/inventory/actions'
import type { Product } from '@/types'

/** Refuse absurd files before reading them into memory. */
/**
 * The optional columns, named from the header constants rather than retyped.
 *
 * These are the CSV's own headers and stay ENGLISH in every language: the
 * parser's HEADER_MAP matches them by exact lowercased string, so a
 * translated list here would describe a file the importer cannot read. Only
 * the sentence around them is translated.
 */
const OPTIONAL_COLUMNS = [
  H.brand,
  H.sku,
  H.barcode,
  H.category,
  H.unitPrice,
  H.unit,
  H.stock,
  H.minStock,
  H.expiry,
].join(', ')

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
  const t = useAppCopy()
  const ti = t.inventory
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
      setParseError(ti.errTooBig)
      return
    }
    try {
      const text = await file.text()
      const result = buildImportPreview(text, existingSkus, categories, {
        validation: t.validation,
        dupSku: ti.dupSku,
        dupBarcode: ti.dupBarcode,
      })
      if (result.missingRequired.length > 0) {
        setParseError(ti.errMissingCol.replace('{cols}', result.missingRequired.join('", "')))
        return
      }
      if (result.rows.length === 0) {
        setParseError(ti.errNoRows)
        return
      }
      setPreview(result)
    } catch {
      setParseError(ti.errNotCsv)
    }
  }

  async function handleConfirm() {
    if (!preview || busy) return
    const good = preview.rows
      .filter((r) => r.action !== 'error')
      .map((r) => ({ line: r.line, input: r.input }))

    if (good.length === 0) {
      toast.info(ti.nothingToImport, ti.nothingToImportBody)
      return
    }

    setBusy(true)
    // The file-level fact, passed explicitly: only a file that has a Stock or
    // Expiry column may replace a product's stock lots.
    const result = await importProducts(good, { replaceLots: preview.replacesLots })
    setBusy(false)

    if (result.message) {
      toast.error(ti.importFailed, result.message)
      return
    }

    const summary = [
      result.created ? ti.sumAdded.replace('{n}', String(result.created)) : null,
      result.updated ? ti.sumUpdated.replace('{n}', String(result.updated)) : null,
      result.failed.length ? ti.sumFailed.replace('{n}', String(result.failed.length)) : null,
    ]
      .filter(Boolean)
      .join(' · ')

    if (result.failed.length > 0) {
      toast.error(ti.importedProblems, summary)
    } else {
      toast.success(ti.importComplete, summary)
    }
    router.refresh()
    onClose()
  }

  return (
    <Modal title={ti.importTitle} width="lg" onClose={onClose}>
      <div className="space-y-5 px-6 py-5">
        {!preview && (
          <>
            <p className="text-sm leading-relaxed text-muted-strong">
              {/* Name and SKU are the CSV's own column headers, so they stay
                  English in every language - see lib/inventoryCsv.ts. */}
              {ti.importIntroA}
              <strong>{H.name}</strong>
              {ti.importIntroB}
              <strong>{H.sku}</strong>
              {ti.importIntroC}
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
                <strong className="text-foreground">{ti.requiredLabel}</strong> {H.name}.
              </p>
              <p className="mt-1.5 text-muted-strong">
                <strong className="text-foreground">{ti.optionalLabel}</strong> {OPTIONAL_COLUMNS}.
              </p>
              <p className="mt-2 text-muted">
                {ti.formatNote}
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
            {/*
              Given its own panel rather than left as a quiet outline button in
              muted text. This is the first thing a customer with no inventory
              yet should reach for, and it was previously the least prominent
              control in the dialog - quieter than "Choose a CSV file", which
              is useless to someone who does not yet know what to put in the
              file. The accent tint and the line of explanation are what make
              it findable without a second look.
            */}
            <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-sm text-muted-strong">
                <span className="font-semibold text-foreground">{ti.newToThis}</span>{' '}
                {ti.sampleBlurb}
              </p>
              <button
                type="button"
                onClick={() => downloadCsv(csvFilename('stockpulse-sample-import'), sampleImportCsv())}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[var(--surface)] transition-colors hover:bg-accent-hover"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {ti.downloadSample}
              </button>
            </div>

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
              {fileName || ti.chooseFile}
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
                label={ti.statToAdd}
                value={preview.createCount}
                tone="bg-accent-soft text-accent-ink"
              />
              <Stat
                label={ti.statToUpdate}
                value={preview.updateCount}
                tone="bg-warning-bg text-warning"
              />
              <Stat label={ti.statProblems} value={preview.errorCount} tone="bg-danger-bg text-danger" />
            </div>

            {preview.unknownHeaders.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {(preview.unknownHeaders.length === 1 ? ti.unknownCol : ti.unknownCols).replace(
                    '{cols}',
                    preview.unknownHeaders.join(', '),
                  )}
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
                  {ti.replacesLots}
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
                      {ti.colLine}
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      {ti.colImportProduct}
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      {ti.colAction}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className="border-t border-border align-top">
                      <td className="px-3 py-2 text-muted">{r.line}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{r.input.name || '—'}</p>
                        {r.input.sku && (
                          <p className="text-xs text-muted">
                            {ti.skuPrefix.replace('{v}', r.input.sku)}
                          </p>
                        )}
                        {r.input.barcode && (
                          <p className="sp-num text-xs text-muted">
                            {ti.barcodePrefix.replace('{v}', r.input.barcode)}
                          </p>
                        )}
                        {r.problems.length > 0 && (
                          <p className="mt-0.5 text-xs text-danger">{r.problems.join(' ')}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.action === 'create' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink">
                            <Plus className="h-3 w-3" aria-hidden="true" /> {ti.actAdd}
                          </span>
                        )}
                        {r.action === 'update' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                            <RefreshCw className="h-3 w-3" aria-hidden="true" /> {ti.actUpdate}
                          </span>
                        )}
                        {r.action === 'error' && (
                          <span className="text-xs font-semibold text-danger">{ti.actSkip}</span>
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
                {ti.chooseAnother}
              </Button>
              <Button
                loading={busy}
                onClick={handleConfirm}
                disabled={preview.createCount + preview.updateCount === 0}
              >
                {(preview.createCount + preview.updateCount === 1
                  ? ti.importRow
                  : ti.importRows
                ).replace('{n}', String(preview.createCount + preview.updateCount))}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
