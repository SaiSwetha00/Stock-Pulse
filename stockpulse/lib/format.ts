export function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Formats a Date's LOCAL calendar date as YYYY-MM-DD. Never use .toISOString()
// for this — it converts to UTC and silently shifts the date in timezones
// ahead of UTC (e.g. local midnight IST becomes the previous day in UTC).
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * "Corner Market Grocery" -> "CM". Falls back to the first two characters of a
 * single-word name.
 *
 * Used wherever a logo or avatar might be missing. The sidebar, the topbar and
 * the mobile header each had their own copy of this, and the mobile one
 * disagreed with the other two — it took the first two letters of the whole
 * string rather than the initials of the first two words, so the same store
 * read "CO" in one place and "CM" in another.
 */
export function storeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
