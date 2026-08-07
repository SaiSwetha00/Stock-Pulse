export type AuditAction = 'insert' | 'update' | 'delete'

export interface AuditLog {
  id: string
  actor_email: string | null
  action: AuditAction
  entity: string
  entity_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}

/** Table name -> what a person calls it. */
export const ENTITY_LABELS: Record<string, string> = {
  products: 'Product',
  customers: 'Customer',
  suppliers: 'Supplier',
  sales: 'Sale',
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  insert: 'Created',
  update: 'Updated',
  delete: 'Deleted',
}

/**
 * Columns that change on every write and say nothing about intent. Showing
 * "updated_at changed" on every row would bury the field the user actually
 * edited.
 */
const NOISE = new Set(['updated_at', 'created_at', 'id', 'store_id'])

export interface FieldChange {
  field: string
  from: unknown
  to: unknown
}

/**
 * The fields that actually differ between two row snapshots.
 *
 * Compared as JSON rather than with `===` because Postgres hands numerics back
 * inconsistently in jsonb: a price of 4.29 can arrive as "4.29" on one side and
 * 4.29 on the other, which would otherwise report a change that never happened.
 */
export function diffFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): FieldChange[] {
  if (!before || !after) return []

  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const changes: FieldChange[] = []

  for (const key of keys) {
    if (NOISE.has(key)) continue
    const a = before[key]
    const b = after[key]
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) {
      changes.push({ field: key, from: a ?? null, to: b ?? null })
    }
  }
  return changes.sort((x, y) => x.field.localeCompare(y.field))
}

/** Best available human label for the row a log entry refers to. */
export function entityName(log: AuditLog): string {
  const snapshot = log.after ?? log.before
  if (!snapshot) return '—'
  const named = snapshot.name ?? snapshot.full_name ?? snapshot.product_name
  if (typeof named === 'string' && named) return named
  // Sales have no name; their short id is what the UI shows elsewhere.
  if (log.entity === 'sales' && log.entity_id) return `#${log.entity_id.slice(0, 6).toUpperCase()}`
  return log.entity_id ? `${log.entity_id.slice(0, 8)}…` : '—'
}

/** Compact one-line description, used in the table and the CSV export. */
export function summarizeChange(log: AuditLog): string {
  if (log.action === 'insert') return 'Record created'
  if (log.action === 'delete') return 'Record deleted'
  const changes = diffFields(log.before, log.after)
  if (changes.length === 0) return 'No visible field changes'
  return changes.map((c) => c.field.replace(/_/g, ' ')).join(', ')
}

export function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}
