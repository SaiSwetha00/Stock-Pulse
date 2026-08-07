import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  dir: SortDir
}

/**
 * How to read a sortable column out of a row. Define these at module scope,
 * not inside the component — the map is a dependency of the sort memo, so a
 * fresh object literal every render would re-sort on every render.
 */
export type SortAccessors<T, K extends string> = Record<
  K,
  (row: T) => string | number | null | undefined
>

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  // `numeric` so "Aisle 10" sorts after "Aisle 9"; `base` so casing and
  // accents do not split otherwise-equal names.
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function isBlank(v: string | number | null | undefined): boolean {
  return v === null || v === undefined || v === ''
}

/**
 * Sorting + pagination for a client-side table. Filtering stays with the
 * caller: what counts as a match is domain knowledge, but ordering and paging
 * are the same everywhere.
 *
 * `items` should already be filtered and memoised by the caller. Reset `page`
 * to 1 yourself when a filter changes — the hook cannot tell a filter change
 * from a row being deleted, and jumping to page 1 after every delete is worse
 * than staying put.
 */
export function useTable<T, K extends string>({
  items,
  accessors,
  initialSort,
  initialPageSize = 10,
  defaultDirs,
}: {
  items: T[]
  accessors: SortAccessors<T, K>
  initialSort: SortState<K>
  initialPageSize?: number
  /** First click on these columns sorts descending — biggest-first is what
   *  a reader wants from money and counts. */
  defaultDirs?: Partial<Record<K, SortDir>>
}) {
  const [sort, setSort] = useState<SortState<K>>(initialSort)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const sorted = useMemo(() => {
    const accessor = accessors[sort.key]
    if (!accessor) return items
    const dir = sort.dir === 'asc' ? 1 : -1

    // Copy first: sorting the caller's array in place would mutate a prop.
    return [...items].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      const aBlank = isBlank(av)
      const bBlank = isBlank(bv)
      // Blanks sink in both directions. A screenful of empty cells at the top
      // is never what someone asked for when they clicked a column.
      if (aBlank || bBlank) return aBlank && bBlank ? 0 : aBlank ? 1 : -1
      return compare(av as string | number, bv as string | number) * dir
    })
  }, [items, sort, accessors])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // Clamp during render rather than correcting from an effect: deleting the
  // last row on the final page otherwise leaves `page` past the end.
  const safePage = Math.min(page, totalPages)
  const rows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  function toggleSort(key: K) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: defaultDirs?.[key] ?? 'asc' }
    )
    // A re-sort reorders everything, so page 3 of the old order is meaningless.
    setPage(1)
  }

  function setPageSize(size: number) {
    // Keep the first visible row visible instead of dumping the reader back to
    // the top: page 4 of 10-per-page starts at row 31, which is page 2 of 25.
    const firstRow = (safePage - 1) * pageSize
    setPageSizeState(size)
    setPage(Math.floor(firstRow / size) + 1)
  }

  return {
    rows,
    /**
     * Every filtered row in sort order, ignoring pagination. This is what an
     * export wants: the reader's filters and ordering, but not the arbitrary
     * cut-off of whichever page happens to be on screen.
     */
    allRows: sorted,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    rangeStart: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    rangeEnd: Math.min(safePage * pageSize, total),
  }
}
