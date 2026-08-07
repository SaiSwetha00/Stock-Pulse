import { toLocalISODate } from '@/lib/format'

export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

const NEEDS_QUOTING = /[",\r\n]/
/**
 * Excel, Sheets and LibreOffice all treat a cell opening with one of these as
 * a formula. A product literally named "=SUM(A1:A9)" would then execute on
 * open, and a crafted value can exfiltrate the sheet — so the cell is prefixed
 * with an apostrophe, which those apps strip on display but never evaluate.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

function escapeCell(raw: string | number | null | undefined): string {
  let s = raw === null || raw === undefined ? '' : String(raw)
  if (FORMULA_TRIGGER.test(s)) s = `'${s}`
  // RFC 4180: quote if the value contains a quote, comma or newline, and
  // double any embedded quotes.
  if (NEEDS_QUOTING.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Serialises rows to RFC 4180 CSV. The header row is always emitted, even for
 * an empty `rows` — a file with only headers still says what it is.
 */
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(c.value(row))).join(','))
  }
  // CRLF is what the spec says and what Excel is happiest with.
  return lines.join('\r\n')
}

/** `products` -> `products-2026-08-05.csv`, using the viewer's local date. */
export function csvFilename(base: string): string {
  return `${base}-${toLocalISODate(new Date())}.csv`
}

export function downloadCsv(filename: string, csv: string): void {
  // Leading BOM: without it Excel decodes the file as the system codepage and
  // mangles any non-ASCII name.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking synchronously can cancel the download before it starts in some
  // browsers; yield first.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
