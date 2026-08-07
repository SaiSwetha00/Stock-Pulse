/**
 * Shared shape and labelling for the notifications feed (migration 0005).
 *
 * Kept free of I/O so both the server actions and the client bell can import
 * it — the same split lib/audit.ts uses for the audit table.
 */

export type NotificationKind = 'general' | 'low_stock' | 'staff' | 'supplier' | 'sales'

/**
 * Who a notification is for. The database decides what a viewer may read;
 * this is the intent recorded on the row, not a permission check.
 */
export type NotificationAudience = 'personal' | 'store' | 'managers' | 'owner'

export interface Notification {
  id: string
  store_id: string
  recipient_id: string | null
  audience: NotificationAudience
  kind: NotificationKind
  title: string
  body: string | null
  entity: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

/** How many the dropdown holds. Older ones stay queryable, just not listed. */
export const NOTIFICATION_FEED_LIMIT = 20

/**
 * A badge stops being useful once it needs three digits — past this it reads
 * as "lots" either way, so the UI shows "99+".
 */
export const UNREAD_BADGE_CAP = 99

export const KIND_LABELS: Record<NotificationKind, string> = {
  general: 'Update',
  low_stock: 'Low stock',
  staff: 'Staff',
  supplier: 'Supplier',
  sales: 'Sales',
}

/**
 * Tailwind classes per kind. Colours reuse the tokens the rest of the app
 * already ships, so contrast stays AA without a second palette to keep in
 * step with the first.
 */
export const KIND_STYLES: Record<NotificationKind, string> = {
  general: 'bg-zinc-100 text-zinc-700',
  low_stock: 'bg-danger-bg text-danger',
  staff: 'bg-zinc-900 text-white',
  supplier: 'bg-amber-100 text-amber-800',
  sales: 'bg-emerald-100 text-emerald-800',
}

/** Where clicking a notification should land, when it points at something. */
export function notificationHref(n: Notification): string | null {
  switch (n.entity) {
    case 'products':
      return '/inventory'
    case 'suppliers':
      return '/suppliers'
    case 'profiles':
      return '/staff'
    case 'sales':
      return '/sales'
    default:
      return null
  }
}

export function formatUnreadCount(n: number): string {
  return n > UNREAD_BADGE_CAP ? `${UNREAD_BADGE_CAP}+` : String(n)
}

/**
 * Screen-reader text for the bell.
 *
 * Spelled out rather than leaving the badge number to be announced bare — a
 * "3" beside a bell icon tells a screen reader user nothing about what is
 * being counted.
 */
export function bellLabel(unread: number): string {
  if (unread === 0) return 'Notifications, none unread'
  if (unread === 1) return 'Notifications, 1 unread'
  return `Notifications, ${unread} unread`
}
