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

/**
 * The labels this module can produce. The KEYS of the two maps below stay as
 * they are — `products`, `insert` — because they are the table name and the
 * action recorded in the row. Only what a person reads moves.
 */
export type AuditLabelCopy = {
  entityProduct: string
  entityCustomer: string
  entitySupplier: string
  entitySale: string
  actionInsert: string
  actionUpdate: string
  actionDelete: string
  summaryCreated: string
  summaryDeleted: string
  summaryNoChanges: string
  yes: string
  no: string
  /**
   * Display names for the audited columns, by column name. Optional: English
   * has none and keeps the humanised column name it always showed; Telugu and
   * Hindi supply their own so a translated screen never prints a raw column.
   */
  fields?: Record<string, string>
}

/** English, and what every caller that passes nothing still gets. */
const EN_AUDIT: AuditLabelCopy = {
  entityProduct: 'Product',
  entityCustomer: 'Customer',
  entitySupplier: 'Supplier',
  entitySale: 'Sale',
  actionInsert: 'Created',
  actionUpdate: 'Updated',
  actionDelete: 'Deleted',
  summaryCreated: 'Record created',
  summaryDeleted: 'Record deleted',
  summaryNoChanges: 'No visible field changes',
  yes: 'Yes',
  no: 'No',
}

/** Table name -> what a person calls it. A function, not a constant: a
 *  module-scope literal cannot read a hook, and the caller memoises it. */
export function entityLabels(copy: AuditLabelCopy = EN_AUDIT): Record<string, string> {
  return {
    products: copy.entityProduct,
    customers: copy.entityCustomer,
    suppliers: copy.entitySupplier,
    sales: copy.entitySale,
  }
}

export function actionLabels(copy: AuditLabelCopy = EN_AUDIT): Record<AuditAction, string> {
  return {
    insert: copy.actionInsert,
    update: copy.actionUpdate,
    delete: copy.actionDelete,
  }
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

/**
 * Compact one-line description, used in the table and the CSV export.
 *
 * The field names it joins are COLUMN NAMES and stay as they are in every
 * language — they are database identifiers, and a translated one could not be
 * matched back to the column it names.
 */
export function summarizeChange(log: AuditLog, copy: AuditLabelCopy = EN_AUDIT): string {
  if (log.action === 'insert') return copy.summaryCreated
  if (log.action === 'delete') return copy.summaryDeleted
  const changes = diffFields(log.before, log.after)
  if (changes.length === 0) return copy.summaryNoChanges
  return changes.map((c) => fieldLabel(c.field, copy)).join(', ')
}

/** A changed column as the reader should see it; unknown columns are humanised. */
export function fieldLabel(field: string, copy: AuditLabelCopy = EN_AUDIT): string {
  return copy.fields?.[field] ?? field.replace(/_/g, ' ')
}

export function formatValue(v: unknown, copy: AuditLabelCopy = EN_AUDIT): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? copy.yes : copy.no
  return String(v)
}
