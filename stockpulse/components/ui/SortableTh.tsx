'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SortState } from '@/lib/useTable'

/**
 * A sortable column header.
 *
 * `aria-sort` lives on the `th` (that is where assistive tech looks for it),
 * while the click target is a real `button` inside it — a bare `th` with an
 * onClick is unreachable by keyboard.
 */
export default function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
  className,
}: {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'group inline-flex control-h items-center gap-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong',
          active ? 'text-muted-strong' : 'text-muted',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {label}
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition',
            // The neutral chevron stays faint until hover so a dozen column
            // headers do not read as a dozen active sorts.
            active ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
          )}
          aria-hidden="true"
        />
        {/* The visual arrow is decorative; this is what gets announced. */}
        <span className="sr-only">
          {active
            ? `, sorted ${sort.dir === 'asc' ? 'ascending' : 'descending'}. Activate to reverse.`
            : ', not sorted. Activate to sort.'}
        </span>
      </button>
    </th>
  )
}
