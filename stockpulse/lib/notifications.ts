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

/**
 * The labels this module can produce. The KEYS below stay as they are —
 * `low_stock` is the value stored on the row — and only what a person reads
 * moves. A notification's own title and body are not here at all: they were
 * written into the table when the event happened and keep that language.
 */
export type NotificationLabelCopy = {
  kindGeneral: string
  kindLowStock: string
  kindStaff: string
  kindSupplier: string
  kindSales: string
  bellNone: string
  bellOne: string
  bellMany: string
}

/** English, and what every caller that passes nothing still gets. */
const EN_NOTIF: NotificationLabelCopy = {
  kindGeneral: 'Update',
  kindLowStock: 'Low stock',
  kindStaff: 'Staff',
  kindSupplier: 'Supplier',
  kindSales: 'Sales',
  bellNone: 'Notifications, none unread',
  bellOne: 'Notifications, 1 unread',
  bellMany: 'Notifications, {n} unread',
}

/** A function, not a constant: a module-scope literal cannot read a hook. */
export function kindLabels(
  copy: NotificationLabelCopy = EN_NOTIF,
): Record<NotificationKind, string> {
  return {
    general: copy.kindGeneral,
    low_stock: copy.kindLowStock,
    staff: copy.kindStaff,
    supplier: copy.kindSupplier,
    sales: copy.kindSales,
  }
}

/**
 * Tailwind classes per kind. Colours reuse the tokens the rest of the app
 * already ships, so contrast stays AA without a second palette to keep in
 * step with the first.
 */
export const KIND_STYLES: Record<NotificationKind, string> = {
  general: 'bg-surface-muted text-muted-strong',
  low_stock: 'bg-danger-bg text-danger',
  staff: 'bg-foreground text-surface',
  supplier: 'bg-warning-bg text-warning',
  sales: 'bg-success-bg text-success-ink',
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
export function bellLabel(unread: number, copy: NotificationLabelCopy = EN_NOTIF): string {
  if (unread === 0) return copy.bellNone
  if (unread === 1) return copy.bellOne
  return copy.bellMany.replace('{n}', String(unread))
}
