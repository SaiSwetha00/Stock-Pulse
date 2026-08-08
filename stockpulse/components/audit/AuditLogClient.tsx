'use client'

import { useMemo, useState } from 'react'
import { History, ChevronDown, X } from 'lucide-react'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { LocalDateTime } from '@/components/ui/LocalTime'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  diffFields,
  entityName,
  formatValue,
  summarizeChange,
  type AuditAction,
  type AuditLog,
} from '@/lib/audit'

const ACTION_TONE: Record<AuditAction, BadgeTone> = {
  insert: 'success',
  update: 'warning',
  delete: 'danger',
}

type SortKey = 'created_at' | 'actor_email' | 'entity' | 'action' | 'name'

const SORT_ACCESSORS: SortAccessors<AuditLog, SortKey> = {
  created_at: (l) => new Date(l.created_at).getTime(),
  actor_email: (l) => l.actor_email,
  entity: (l) => ENTITY_LABELS[l.entity] ?? l.entity,
  action: (l) => l.action,
  name: (l) => entityName(l),
}

const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = { created_at: 'desc' }

const CSV_COLUMNS: CsvColumn<AuditLog>[] = [
  { header: 'When', value: (l) => new Date(l.created_at).toLocaleString() },
  { header: 'Who', value: (l) => l.actor_email ?? 'System' },
  { header: 'Action', value: (l) => ACTION_LABELS[l.action] },
  { header: 'Type', value: (l) => ENTITY_LABELS[l.entity] ?? l.entity },
  { header: 'Record', value: (l) => entityName(l) },
  { header: 'Changed', value: (l) => summarizeChange(l) },
]

function Row({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false)
  const changes = diffFields(log.before, log.after)
  const canExpand = log.action === 'update' && changes.length > 0

  return (
    <>
      <tr className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm lg:table-row lg:rounded-none lg:border-b lg:border-border lg:p-0 lg:align-top lg:shadow-none lg:last:border-0">
        {/* On a card the record and the action lead, because they are what the
            entry is about; the timestamp drops to a caption. In the table the
            column order stays as it was. */}
        <td className="flex items-center justify-between gap-3 whitespace-nowrap text-xs text-muted lg:table-cell lg:px-4 lg:text-sm lg:text-muted-strong">
          <LocalDateTime iso={log.created_at} />
          <span className="lg:hidden">
            <Badge tone={ACTION_TONE[log.action]}>{ACTION_LABELS[log.action]}</Badge>
          </span>
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            Who
          </span>
          {log.actor_email ?? 'System'}
        </td>
        <td className="hidden lg:table-cell lg:px-4">
          <Badge tone={ACTION_TONE[log.action]}>{ACTION_LABELS[log.action]}</Badge>
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            Type
          </span>
          {ENTITY_LABELS[log.entity] ?? log.entity}
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 font-medium text-foreground lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            Record
          </span>
          {entityName(log)}
        </td>
        <td className="mt-2 block border-t border-border pt-1 lg:mt-0 lg:table-cell lg:border-0 lg:px-4 lg:pt-0">
          {canExpand ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex control-h items-center gap-1.5 text-left text-sm text-muted-strong hover:text-foreground"
            >
              {summarizeChange(log)}
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="text-sm text-muted">{summarizeChange(log)}</span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="block sp-rise rounded-2xl border border-border bg-surface-muted lg:table-row lg:rounded-none lg:border-b lg:border-border">
          <td colSpan={6} className="block p-4 lg:table-cell lg:px-4 lg:py-3">
            <dl className="grid gap-2 sm:grid-cols-2">
              {changes.map((c) => (
                <div key={c.field} className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {c.field.replace(/_/g, ' ')}
                  </dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-danger-bg px-2 py-0.5 text-danger line-through">
                      {formatValue(c.from)}
                    </span>
                    <span aria-hidden="true" className="text-muted">
                      &rarr;
                    </span>
                    <span className="rounded bg-accent-soft px-2 py-0.5 text-accent-ink">
                      {formatValue(c.to)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * Reads the append-only `audit_logs` table. This is both the Audit Log and the
 * Activity History — they are the same record of who changed what and when, so
 * presenting them as two screens over one table would only invite them to
 * disagree.
 */
export default function AuditLogClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('all')
  const [action, setAction] = useState('all')
  const [actor, setActor] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const actors = useMemo(
    () => [...new Set(logs.map((l) => l.actor_email).filter(Boolean))] as string[],
    [logs]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null

    return logs.filter((l) => {
      if (entity !== 'all' && l.entity !== entity) return false
      if (action !== 'all' && l.action !== action) return false
      if (actor !== 'all' && l.actor_email !== actor) return false
      if (fromTs !== null || toTs !== null) {
        const ts = new Date(l.created_at).getTime()
        if (fromTs !== null && ts < fromTs) return false
        if (toTs !== null && ts > toTs) return false
      }
      if (q) {
        const hay = [
          l.actor_email ?? '',
          ENTITY_LABELS[l.entity] ?? l.entity,
          entityName(l),
          summarizeChange(l),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [logs, search, entity, action, actor, from, to])

  const table = useTable<AuditLog, SortKey>({
    items: filtered,
    accessors: SORT_ACCESSORS,
    initialSort: { key: 'created_at', dir: 'desc' },
    defaultDirs: SORT_DEFAULT_DIRS,
  })

  const filtersActive =
    search !== '' ||
    entity !== 'all' ||
    action !== 'all' ||
    actor !== 'all' ||
    from !== '' ||
    to !== ''

  function clearFilters() {
    setSearch('')
    setEntity('all')
    setAction('all')
    setActor('all')
    setFrom('')
    setTo('')
    table.setPage(1)
  }

  const selectClass =
    'control-h rounded-lg border border-border bg-surface px-3 text-sm text-muted-strong focus:border-border-strong focus:outline-none'

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Accountability</p>
          <h1 className="sp-title mt-2">Activity &amp; Audit Log</h1>
          <p className="sp-body mt-2">
            Every change to products, customers, suppliers and sales. Append-only — entries cannot
            be edited or removed, including by you.
          </p>
        </div>
        <ExportCsvButton
          columns={CSV_COLUMNS}
          rows={table.allRows}
          filenameBase="activity-log"
          itemLabel="entries"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative min-w-[14rem] flex-1">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              table.setPage(1)
            }}
            type="search"
            aria-label="Search activity"
            placeholder="Search person, record, or field..."
            className="control-h w-full rounded-lg border border-border bg-surface px-3 pr-11 text-sm placeholder:text-muted focus:border-border-strong focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded-lg text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <label htmlFor="audit-entity" className="sr-only">
          Filter by record type
        </label>
        <select
          id="audit-entity"
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value)
            table.setPage(1)
          }}
          className={selectClass}
        >
          <option value="all">All types</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <label htmlFor="audit-action" className="sr-only">
          Filter by action
        </label>
        <select
          id="audit-action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            table.setPage(1)
          }}
          className={selectClass}
        >
          <option value="all">All actions</option>
          <option value="insert">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
        </select>

        {actors.length > 1 && (
          <>
            <label htmlFor="audit-actor" className="sr-only">
              Filter by person
            </label>
            <select
              id="audit-actor"
              value={actor}
              onChange={(e) => {
                setActor(e.target.value)
                table.setPage(1)
              }}
              className={selectClass}
            >
              <option value="all">Anyone</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="audit-from" className="text-sm text-muted">
          From
        </label>
        <input
          id="audit-from"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => {
            setFrom(e.target.value)
            table.setPage(1)
          }}
          className={selectClass}
        />
        <label htmlFor="audit-to" className="text-sm text-muted">
          To
        </label>
        <input
          id="audit-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => {
            setTo(e.target.value)
            table.setPage(1)
          }}
          className={selectClass}
        />

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex control-h items-center rounded-lg px-3 text-sm font-semibold text-muted-strong underline-offset-4 transition hover:bg-surface-muted hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Rows become a card list below `lg`; the same markup is a table above
          it, so the two shapes cannot drift apart. */}
      <div className="mt-6 lg:overflow-hidden lg:rounded-2xl lg:bg-surface lg:shadow-sm">
        <div className="lg:overflow-x-auto">
          <table className="sp-table block w-full text-left text-sm lg:table">
            <thead className="hidden lg:table-header-group">
              <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wide text-muted">
                <SortableTh label="When" sortKey="created_at" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Who" sortKey="actor_email" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Action" sortKey="action" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Type" sortKey="entity" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label="Record" sortKey="name" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <th scope="col" className="px-4 py-3.5">
                  Changed
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 lg:table-row-group lg:space-y-0">
              {table.rows.length === 0 && (
                <tr className="block lg:table-row">
                  <td
                    colSpan={6}
                    className="block sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm lg:table-cell lg:rounded-none lg:shadow-none"
                  >
                    {logs.length === 0 ? (
                      <EmptyState
                        icon={History}
                        title="No activity recorded yet"
                        description="Changes to products, customers, suppliers and sales will appear here as they happen."
                      />
                    ) : (
                      <EmptyState
                        icon={History}
                        title="No entries match your filters"
                        description="Try widening the date range or clearing a filter."
                      />
                    )}
                  </td>
                </tr>
              )}
              {table.rows.map((log) => (
                <Row key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          pageSize={table.pageSize}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          total={table.total}
          itemLabel="entries"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"
        />
      </div>
    </div>
  )
}
