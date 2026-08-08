'use client'

import { Download } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToast } from '@/components/ui/Toast'
import { csvFilename, downloadCsv, toCsv, type CsvColumn } from '@/lib/csv'

/**
 * Exports exactly the rows it is handed — which is the page the reader is
 * looking at, already filtered and sorted. What you see is what you get.
 *
 * The empty case is not a disabled button: a disabled control drops out of the
 * tab order and gives no reason for being dead. The button stays operable and
 * explains itself through a toast instead.
 */
export default function ExportCsvButton<T>({
  columns,
  rows,
  filenameBase,
  itemLabel,
  label = 'Export CSV',
  className,
}: {
  columns: CsvColumn<T>[]
  rows: T[]
  /** Stem of the download name; the local date is appended. */
  filenameBase: string
  /** Plural noun used in the toasts, e.g. "products". */
  itemLabel: string
  label?: string
  className?: string
}) {
  const toast = useToast()

  function handleExport() {
    if (rows.length === 0) {
      toast.info('Nothing to export', `No ${itemLabel} match the current filters.`)
      return
    }

    const filename = csvFilename(filenameBase)
    downloadCsv(filename, toCsv(columns, rows))
    toast.success(
      `Exported ${rows.length} ${rows.length === 1 ? itemLabel.replace(/s$/, '') : itemLabel}`,
      filename
    )
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={cn(
        'flex control-h items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-muted-strong transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong',
        className
      )}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
