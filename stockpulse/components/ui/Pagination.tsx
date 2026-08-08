'use client'

import { useId } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '@/lib/useTable'

/**
 * The footer under every table: what you are looking at, how much of it to
 * show, and how to move. Replaces four hand-rolled copies that had drifted
 * apart on labels, disabled states and page-size behaviour.
 */
export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
  total,
  itemLabel,
  className,
}: {
  page: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  rangeStart: number
  rangeEnd: number
  total: number
  /** Plural noun for the range label, e.g. "products". */
  itemLabel: string
  className?: string
}) {
  const selectId = useId()

  return (
    <div
      className={
        className ??
        'mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-sm lg:mt-0 lg:rounded-none lg:border-t lg:border-border lg:px-6 lg:py-4 lg:shadow-none'
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* aria-live: changing page or page size updates this text, and that
            is the only confirmation a screen-reader user gets. */}
        <p aria-live="polite" className="text-sm text-muted">
          Showing {rangeStart}-{rangeEnd} of {total} {itemLabel}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="text-sm text-muted">
            Rows
          </label>
          <select
            id={selectId}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="control-h rounded-lg border border-border bg-surface-muted px-2 text-sm text-muted-strong transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="tap-target rounded-lg text-muted transition hover:bg-surface-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-semibold text-surface">
          {page}
        </span>
        <span className="text-sm text-muted">of {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="tap-target rounded-lg text-muted transition hover:bg-surface-muted disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
