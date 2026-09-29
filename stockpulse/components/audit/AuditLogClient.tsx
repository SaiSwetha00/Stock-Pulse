'use client'

import { useMemo, useState } from 'react'
import { History, ChevronDown, X } from 'lucide-react'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SortableTh from '@/components/ui/SortableTh'
import Pagination from '@/components/ui/Pagination'
import ExportCsvButton from '@/components/ui/ExportCsvButton'
import { LocalDateTime } from '@/components/ui/LocalTime'
import { useTable, type SortAccessors } from '@/lib/useTable'
import type { CsvColumn } from '@/lib/csv'
import {
  actionLabels,
  entityLabels,
  diffFields,
  entityName,
  formatValue,
  summarizeChange,
  type AuditAction,
  type AuditLog,
} from '@/lib/audit'
import { useAppCopy } from '@/lib/i18n/client'
import type { AuditCopy } from '@/lib/i18n/app'

const ACTION_TONE: Record<AuditAction, BadgeTone> = {
  insert: 'success',
  update: 'warning',
  delete: 'danger',
}

type SortKey = 'created_at' | 'actor_email' | 'entity' | 'action' | 'name'

// Functions rather than constants: a module-scope literal cannot read a hook.
// Both are memoised at the call site so the sort keeps a stable dependency.
function sortAccessors(entities: Record<string, string>): SortAccessors<AuditLog, SortKey> {
  return {
    created_at: (l) => new Date(l.created_at).getTime(),
    actor_email: (l) => l.actor_email,
    entity: (l) => entities[l.entity] ?? l.entity,
    action: (l) => l.action,
    name: (l) => entityName(l),
  }
}

const SORT_DEFAULT_DIRS: Partial<Record<SortKey, 'asc' | 'desc'>> = { created_at: 'desc' }

/**
 * The export's headers ARE translated, unlike inventory's: nothing parses this
 * file back, so its columns can say exactly what the table above them says.
 */
function csvColumns(
  t: AuditCopy,
  entities: Record<string, string>,
  actions: Record<AuditAction, string>,
): CsvColumn<AuditLog>[] {
  return [
    { header: t.colWhen, value: (l) => new Date(l.created_at).toLocaleString() },
    { header: t.colWho, value: (l) => l.actor_email ?? t.system },
    { header: t.colAction, value: (l) => actions[l.action] },
    { header: t.colType, value: (l) => entities[l.entity] ?? l.entity },
    { header: t.colRecord, value: (l) => entityName(l) },
    { header: t.colChanged, value: (l) => summarizeChange(l, t) },
  ]
}

function Row({
  log,
  t,
  entities,
  actions,
}: {
  log: AuditLog
  t: AuditCopy
  entities: Record<string, string>
  actions: Record<AuditAction, string>
}) {
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
            <Badge tone={ACTION_TONE[log.action]}>{actions[log.action]}</Badge>
          </span>
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            {t.colWho}
          </span>
          {log.actor_email ?? t.system}
        </td>
        <td className="hidden lg:table-cell lg:px-4">
          <Badge tone={ACTION_TONE[log.action]}>{actions[log.action]}</Badge>
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            {t.colType}
          </span>
          {entities[log.entity] ?? log.entity}
        </td>
        <td className="mt-2 flex items-center justify-between gap-3 font-medium text-foreground lg:mt-0 lg:table-cell lg:px-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
            {t.colRecord}
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
              {summarizeChange(log, t)}
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="text-sm text-muted">{summarizeChange(log, t)}</span>
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
                      {formatValue(c.from, t)}
                    </span>
                    <span aria-hidden="true" className="text-muted">
                      &rarr;
                    </span>
                    <span className="rounded bg-accent-soft px-2 py-0.5 text-accent-ink">
                      {formatValue(c.to, t)}
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
  const copy = useAppCopy()
  const t = copy.audit
  const tcm = copy.common
  const entities = useMemo(() => entityLabels(t), [t])
  const actions = useMemo(() => actionLabels(t), [t])
  const accessors = useMemo(() => sortAccessors(entities), [entities])
  const csvCols = useMemo(() => csvColumns(t, entities, actions), [t, entities, actions])
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
          entities[l.entity] ?? l.entity,
          entityName(l),
          summarizeChange(l, t),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [logs, search, entity, action, actor, from, to, entities, t])

  const table = useTable<AuditLog, SortKey>({
    items: filtered,
    accessors,
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
    'control-h rounded-lg border border-border bg-surface-muted px-3 text-sm text-muted-strong transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none'

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">{t.eyebrow}</p>
          <h1 className="sp-title mt-2">{t.title}</h1>
          <p className="sp-body mt-2">{t.subtitle}</p>
        </div>
        <ExportCsvButton
          columns={csvCols}
          rows={table.allRows}
          filenameBase="activity-log"
          itemLabel={t.items}
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
            aria-label={t.searchAria}
            placeholder={t.searchPlaceholder}
            className="control-h w-full rounded-lg border border-border bg-surface-muted px-3 pr-11 text-sm placeholder:text-muted transition-[border-color,background-color] duration-150 focus:border-border-strong focus:bg-surface focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={tcm.clearSearch}
              className="tap-target absolute right-0 top-1/2 -translate-y-1/2 rounded-lg text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <label htmlFor="audit-entity" className="sr-only">
          {t.filterType}
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
          <option value="all">{t.allTypes}</option>
          {Object.entries(entities).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <label htmlFor="audit-action" className="sr-only">
          {t.filterAction}
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
          <option value="all">{t.allActions}</option>
          <option value="insert">{t.actionInsert}</option>
          <option value="update">{t.actionUpdate}</option>
          <option value="delete">{t.actionDelete}</option>
        </select>

        {actors.length > 1 && (
          <>
            <label htmlFor="audit-actor" className="sr-only">
              {t.filterPerson}
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
              <option value="all">{t.anyone}</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="audit-from" className="text-sm text-muted">
          {t.from}
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
          {t.to}
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
            {tcm.clearAll}
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
                <SortableTh label={t.colWhen} sortKey="created_at" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={t.colWho} sortKey="actor_email" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={t.colAction} sortKey="action" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={t.colType} sortKey="entity" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <SortableTh label={t.colRecord} sortKey="name" sort={table.sort} onSort={table.toggleSort} className="px-4" />
                <th scope="col" className="px-4 py-3.5">
                  {t.colChanged}
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
                        title={t.emptyTitle}
                        description={t.emptyBody}
                      />
                    ) : (
                      <EmptyState
                        icon={History}
                        title={t.noMatchTitle}
                        description={t.noMatchBody}
                        action={
                          <Button variant="secondary" onClick={clearFilters}>
                            {tcm.clearFilters}
                          </Button>
                        }
                      />
                    )}
                  </td>
                </tr>
              )}
              {table.rows.map((log) => (
                <Row key={log.id} log={log} t={t} entities={entities} actions={actions} />
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
          itemLabel={t.items}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4"
        />
      </div>
    </div>
  )
}
