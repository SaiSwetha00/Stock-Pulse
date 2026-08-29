'use client'

/*
GateGuard facts:
- Importer/caller: app/(dashboard)/monitoring/page.tsx (imports this as MonitoringClient, renders at line ~16).
- Affected API: new client component export MonitoringClient({ storeId, role, stations }). No existing API changed.
- Data schema: checkout_stations rows — id/store_id (uuid), station_number (int, e.g. 1), status
  (available|in_use|review|assistance|maintenance), payment_type (text, e.g. "Card Only"), items_scanned (int, e.g. 14),
  current_total (numeric, e.g. 87.42), session_started_at (ISO-8601 UTC, e.g. 2026-07-28T15:07:40.000Z),
  alert_type (weight_mismatch|age_verification|null), alert_expected/alert_actual (numeric kg, e.g. 1.2 / 2.5),
  alert_item (text, e.g. "Alcohol Item"), created_at/updated_at (ISO-8601 UTC). Values above are synthetic.
- User instruction (verbatim): "Build these two modules: 1. Self-Checkout Monitoring - "Live Operations Center" view:
  active alerts count, stations active count, current intervention rate - Per-station cards (weight mismatch alerts,
  age verification, view receipt, dispatch staff actions) - Owner/Staff can both view; only Owner can override/approve
  alerts ... DESIGN REQUIREMENT: Match the two design screens from the zip file exactly ... TESTING REQUIREMENT: Test
  everything yourself, live in-browser ... STOP CONDITION: Once built, matches the design, and the entire app runs with
  zero errors — stop and report back."
*/

import { useState, useSyncExternalStore } from 'react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import StatCard from '@/components/ui/StatCard'
import { canManage } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  MonitorSmartphone,
  CheckCircle2,
  TrendingUp,
  Eye,
  Zap,
  Receipt,
  Wrench,
  ScanLine,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
// Generic polling badge; it lives under dashboard/ because that's where it was
// first needed, but it has no dashboard-specific behaviour.
import AutoRefresh from '@/components/dashboard/AutoRefresh'
import { useToast } from '@/components/ui/Toast'
import { STATION_STATUS_LABELS } from '@/types'
import type { CheckoutStation, Role, StationStatus } from '@/types'

const STATUS_META: Record<
  StationStatus,
  { label: string; badge: string; bar: string; icon: typeof AlertTriangle }
> = {
  assistance: {
    label: 'ASSISTANCE',
    badge: 'bg-danger-bg text-danger',
    bar: 'bg-danger',
    icon: AlertTriangle,
  },
  review: {
    label: 'REVIEW',
    badge: 'bg-warning-bg text-warning',
    bar: 'bg-warning',
    icon: Eye,
  },
  in_use: {
    label: 'IN USE',
    badge: 'bg-success-bg text-success',
    bar: 'bg-success',
    icon: Zap,
  },
  available: {
    label: 'AVAILABLE',
    badge: 'bg-surface-muted text-muted-strong',
    bar: 'bg-surface-muted',
    icon: CheckCircle2,
  },
  maintenance: {
    label: 'MAINTENANCE',
    badge: 'bg-surface-muted text-muted-strong',
    bar: 'bg-border-strong',
    icon: Wrench,
  },
}

// Ticking clock shared by every station card. Reading Date.now() straight from
// render would make the server and client emit different seconds and break
// hydration, so the server snapshot is 0 and the real time arrives post-hydration.
let cachedNow = 0
const clockListeners = new Set<() => void>()
let clockTimer: ReturnType<typeof setInterval> | null = null

function subscribeToClock(onChange: () => void) {
  clockListeners.add(onChange)
  if (!clockTimer) {
    clockTimer = setInterval(() => {
      cachedNow = Date.now()
      clockListeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    clockListeners.delete(onChange)
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
  }
}

function getClientClock() {
  if (cachedNow === 0) cachedNow = Date.now()
  return cachedNow
}

function getServerClock() {
  return 0
}

function sessionElapsed(startedAt: string | null, now: number): string {
  if (!startedAt || now === 0) return '—'
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * What to call a counter on screen.
 *
 * ONE function, because the board names a station in five places — the card
 * and four toasts — and those built the string inline as `Station 0${n}`. That
 * inline form also carried a real bug worth not reintroducing: it prefixed a
 * literal "0", so a shop with ten or more lanes rendered "Station 010".
 *
 * The fallback is not a placeholder. `name` is null for every station until a
 * shop chooses to name one, and 0020 keeps it nullable precisely because most
 * shops will keep the numbers — so "Station 07" is the normal reading of a
 * complete row, not a gap.
 *
 * `name` is optional in the type too: until 0020 is applied the column does
 * not exist and the property is simply absent. That case lands on the same
 * fallback as an unnamed station, which is why the board looks unchanged on an
 * unmigrated database rather than breaking.
 */
export function stationLabel(station: CheckoutStation): string {
  const named = station.name?.trim()
  if (named) return named
  return `Station ${String(station.station_number).padStart(2, '0')}`
}

/**
 * True when PostgREST is saying `checkout_stations.name` does not exist — i.e.
 * migration 0020 has not been applied to this database.
 *
 * Read from the error rather than probed for in advance, and this file already
 * establishes the idiom: `removeStation` reads a zero-row delete as "0012 may
 * be missing" and names the migration. Naming the file is the useful half — a
 * shopkeeper cannot act on "column not found", but the owner can act on
 * "apply 0020".
 *
 * PGRST204 is PostgREST's "column not found in schema cache"; 42703 is the
 * Postgres undefined_column that surfaces when the cache is warm but the
 * column still is not there. Both mean the same thing here.
 */
function isMissingNameColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST204' || error.code === '42703') return true
  return /column .*\bname\b.* does not exist|'name' column/i.test(error.message ?? '')
}

export default function MonitoringClient({
  storeId,
  role,
  stations,
}: {
  storeId: string
  role: Role
  stations: CheckoutStation[]
}) {
  const router = useRouter()
  const canWrite = canManage(role)
  const toast = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null)
  // Station setup. `renamingId` doubles as "which row is in edit mode", so
  // only one rename can be open at a time and there is no array of drafts to
  // keep in step with the server's list.
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const now = useSyncExternalStore(subscribeToClock, getClientClock, getServerClock)

  const activeAlerts = stations.filter((s) => s.alert_type !== null).length
  const stationsActive = stations.filter(
    (s) => s.status === 'in_use' || s.status === 'review' || s.status === 'assistance'
  ).length
  const totalStations = stations.length
  const interventionRate = totalStations ? (activeAlerts / totalStations) * 100 : 0

  async function overrideAlert(station: CheckoutStation) {
    setBusyId(station.id)
    setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('checkout_stations')
      .update({
        alert_type: null,
        alert_expected: null,
        alert_actual: null,
        alert_item: null,
        status: 'in_use',
        updated_at: new Date().toISOString(),
      })
      .eq('id', station.id)
    setBusyId(null)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not clear alert', dbError.message)
      return
    }
    toast.success('Alert cleared', `Station 0${station.station_number}`)
    router.refresh()
  }

  async function toggleMaintenance(station: CheckoutStation) {
    setBusyId(station.id)
    setError('')
    const supabase = createClient()
    const next = station.status === 'maintenance' ? 'available' : 'maintenance'
    const { error: dbError } = await supabase
      .from('checkout_stations')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', station.id)
    setBusyId(null)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not change station status', dbError.message)
      return
    }
    toast.success(
      next === 'maintenance' ? 'Station taken offline' : 'Station back online',
      `Station 0${station.station_number}`
    )
    router.refresh()
  }

  async function dispatchStaff(station: CheckoutStation) {
    setBusyId(station.id)
    setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('checkout_stations')
      .update({ status: 'assistance', updated_at: new Date().toISOString() })
      .eq('id', station.id)
    setBusyId(null)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not dispatch staff', dbError.message)
      return
    }
    toast.success('Staff dispatched', `Station 0${station.station_number}`)
    router.refresh()
  }

  async function removeStation(station: CheckoutStation) {
    setBusyId(station.id)
    setError('')
    const supabase = createClient()
    // `.select()` on a delete returns the rows that were actually removed, and
    // that is the whole point here. Without it, RLS refusing the delete is
    // indistinguishable from success: PostgREST answers 200 with no error and
    // zero rows touched. That silent no-op is the bug 0012 fixes, so an empty
    // result names the missing migration rather than reporting a removal that
    // did not happen.
    const { data, error: dbError } = await supabase
      .from('checkout_stations')
      .delete()
      .eq('id', station.id)
      .select('id')
    setBusyId(null)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not remove counter', dbError.message)
      return
    }
    if (!data || data.length === 0) {
      // Zero rows has two causes and the message must not pick one: the row was
      // already removed (a stale card the refresh had not cleared yet — this
      // fires in practice, on a second click), or RLS refused and said nothing.
      // Blaming the migration outright told a shopkeeper to run SQL for what
      // was really a double click.
      const message =
        'Nothing was removed — this counter may already be gone. If it stays on the board, apply supabase/migrations/0012_checkout_stations_delete_policy.sql.'
      setError(message)
      toast.error('Counter not removed', message)
      setConfirmingRemoveId(null)
      // Whichever cause it was, what is on screen is out of date.
      router.refresh()
      return
    }
    setConfirmingRemoveId(null)
    toast.success('Counter removed', stationLabel(station))
    router.refresh()
  }

  /**
   * Add ONE counter, named or not.
   *
   * The number is derived from the stations already on the board — highest
   * plus one — rather than from their count, which is the difference between
   * "add a lane" and "collide with an existing one". A shop that seeded four
   * and removed Station 02 has three rows whose highest number is still 4, so
   * counting would propose 4 and PostgREST would happily store a duplicate.
   * `station_number` carries no unique constraint, so nothing downstream would
   * catch it and the board would show two cards claiming the same identity.
   *
   * `store_id` is the prop the server derived from the session, never anything
   * the browser chose, and the insert policy independently checks it against
   * `current_store_id()`. So a crafted store_id is refused by the database
   * rather than trusted here — the store isolation is the policy's, not this
   * function's.
   *
   * The remaining columns are stated explicitly, and every one is an empty
   * value. `seedStations` above carries the reason at length: a setup control
   * configures hardware and must not invent trade, because fabricated
   * in-progress baskets once surfaced on the dashboard as real takings.
   */
  async function addStation() {
    const name = newName.trim()
    setAdding(true)
    setError('')
    const supabase = createClient()

    const nextNumber = stations.reduce((max, s) => Math.max(max, s.station_number), 0) + 1
    const row = {
      store_id: storeId,
      station_number: nextNumber,
      status: 'available',
      payment_type: 'Cash & Card',
      items_scanned: 0,
      current_total: 0,
      session_started_at: null,
      alert_type: null,
      alert_expected: null,
      alert_actual: null,
      alert_item: null,
    }

    // `name` is carried as an OPTIONAL property of one payload type rather
    // than by passing one of two different object literals. Two literals make
    // the insert's inferred reference type a union, and the client's
    // excess-property check then measures the named payload against the
    // unnamed arm and rejects `name` at compile time — a type error describing
    // nothing that is actually wrong.
    const payload: typeof row & { name?: string } = name ? { ...row, name } : row
    let { error: dbError } = await supabase.from('checkout_stations').insert(payload)

    // The station itself does not depend on the migration, so a missing `name`
    // column must not cost the shop the counter. Retry without it and say
    // plainly that the name was the part that did not land — reporting success
    // here would leave someone believing they had named a lane they had not.
    let nameDropped = false
    if (name && isMissingNameColumn(dbError)) {
      const retry = await supabase.from('checkout_stations').insert(row)
      dbError = retry.error
      nameDropped = !dbError
    }

    setAdding(false)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not add counter', dbError.message)
      return
    }

    setNewName('')
    if (nameDropped) {
      const message =
        'The counter was added, but naming needs supabase/migrations/0020_checkout_station_name.sql applied first.'
      setError(message)
      toast.info(`Station ${String(nextNumber).padStart(2, '0')} added without a name`, message)
    } else {
      toast.success('Counter added', name || `Station ${String(nextNumber).padStart(2, '0')}`)
    }
    router.refresh()
  }

  /**
   * Rename a counter, or clear its name back to the numbered fallback.
   *
   * `.select('id')` for the same reason `removeStation` uses it: RLS refusing
   * an UPDATE is not an error, it is a 200 with zero rows changed. Without
   * reading the affected rows back, a staff member — who may insert but whose
   * role fails the `can_manage()` update policy — would be told the rename
   * worked and would then watch the old name reappear on the next refresh.
   */
  async function renameStation(station: CheckoutStation) {
    const next = renameDraft.trim()
    setBusyId(station.id)
    setError('')
    const supabase = createClient()

    const { data, error: dbError } = await supabase
      .from('checkout_stations')
      .update({ name: next === '' ? null : next })
      .eq('id', station.id)
      .select('id')

    setBusyId(null)
    if (dbError) {
      const message = isMissingNameColumn(dbError)
        ? 'Naming counters needs supabase/migrations/0020_checkout_station_name.sql applied first.'
        : dbError.message
      setError(message)
      toast.error('Could not rename counter', message)
      return
    }
    if (!data || data.length === 0) {
      const message =
        'Nothing was renamed. Renaming a counter is a manager or owner action, and the counter may also have just been removed.'
      setError(message)
      toast.error('Counter not renamed', message)
      router.refresh()
      return
    }

    setRenamingId(null)
    toast.success('Counter renamed', next || `Station ${String(station.station_number).padStart(2, '0')}`)
    router.refresh()
  }

  async function seedStations() {
    setSeeding(true)
    setError('')
    const supabase = createClient()
    // Four EMPTY counters.
    //
    // This used to insert fabricated live state: baskets mid-scan totalling
    // $148.00, a weight-mismatch alert and an age-verification hold. Those
    // rows then surfaced on the dashboard as real store activity in a shop
    // with no products and no sales, and they are exactly what shipped to a
    // client review. A setup button configures hardware; it must not invent
    // trade.
    const rows = Array.from({ length: 4 }, (_, i) => ({
      store_id: storeId,
      station_number: i + 1,
      status: 'available',
      payment_type: 'Cash & Card',
      items_scanned: 0,
      current_total: 0,
      session_started_at: null,
      alert_type: null,
      alert_expected: null,
      alert_actual: null,
      alert_item: null,
    }))
    const { error: dbError } = await supabase.from('checkout_stations').insert(rows)
    setSeeding(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Live operations</p>
          <h1 className="sp-title mt-2">Live Operations Center</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            {/* This dot marks "monitoring is on", not an alarm — alert state
                is shown by the counters below, so it shouldn't read as red. */}
            <span className="sp-pulse h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
            Monitoring {totalStations} Self-Checkout Station{totalStations === 1 ? '' : 's'}
          </p>
        </div>
        {/* "View Logs" and "Pause All New Sessions" buttons sat here with no
            handlers. The second is the dangerous one: it reads as an emergency
            stop for every checkout lane and did nothing at all. Both removed
            rather than left implying capability that doesn't exist. */}
        <AutoRefresh intervalMs={20_000} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      {/*
        These three were the only stat tiles in the app painted with filled
        colour - a pink danger card, a green gradient card and a muted card,
        each with its own type scale and its own icon treatment. Every other
        page states a metric on a white surface with a hairline and a small
        uppercase label, so this page read as belonging to a different
        product.

        They now use the shared StatCard, which is what the rest of the app
        uses: white surface, hairline border, small uppercase label, the
        figure as the focus. StatCard has no colour-tone prop and this pass
        did not add one - the brief asks for consistency, and inventing a
        variant for one page is how the inconsistency started.
      */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Alerts"
          value={activeAlerts}
          icon={AlertTriangle}
          trendLabel="Require immediate attention"
        />
        <StatCard
          label="Stations Active"
          value={`${stationsActive}/${totalStations}`}
          icon={CheckCircle2}
          trendLabel="Optimal utilization"
        />
        <StatCard
          label="Current Intervention Rate"
          value={`${interventionRate.toFixed(1)}%`}
          icon={TrendingUp}
          trendLabel={`${activeAlerts} flagged now`}
        />
      </div>

      {/* ---- Station setup ----

          A SEPARATE PANEL FROM THE BOARD BELOW, deliberately. The cards below
          are a live view — status, basket total, alerts — and they refresh
          every 20 seconds. Configuration is the opposite kind of surface: it
          is read rarely, changed deliberately, and must not move under
          somebody's cursor while they are renaming a lane. Putting a rename
          field on a self-refreshing card would have done exactly that.

          Nothing here is hard-coded. The list is the `stations` rows the
          server read for THIS store (`.eq('store_id', store.id)`, and RLS
          scoping `select` to `current_store_id()` underneath it), so a lane
          belonging to another shop cannot appear in it and one added here
          cannot appear in theirs.

          Visible to everyone, editable by managers and owners. That split is
          not a UI choice — it is what the table's policies already enforce:
          store members may select and insert, `can_manage()` gates update and
          delete. Showing staff a rename button the database will refuse is
          the failure this mirrors away. */}
      <div className="sp-rise sp-e1 mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="sp-heading">Station Setup</h2>
            <p className="mt-1 text-sm text-muted">
              {canWrite
                ? 'Add the counters your shop actually has, and name them the way your staff do.'
                : 'The counters configured for this store. Ask an owner or manager to change them.'}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-strong">
            {totalStations} configured
          </span>
        </div>

        {canWrite && (
          /* A form, so Enter submits — this is a single text field and
             reaching for the mouse to commit it would be the wrong shape. */
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!adding) void addStation()
            }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              /* Optional, and the placeholder says so rather than leaving
                 someone to discover it. The number is assigned by the shop's
                 existing lanes, not typed, so there is nothing else to fill
                 in. */
              placeholder="Counter name (optional) — e.g. Express"
              aria-label="New counter name"
              maxLength={40}
              className="control-h min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            />
            <Button type="submit" loading={adding}>
              Add Counter
            </Button>
          </form>
        )}

        {totalStations === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No counters configured yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {stations.map((station) => {
              const isRenaming = renamingId === station.id
              const confirming = confirmingRemoveId === station.id
              return (
                <li
                  key={station.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (busyId !== station.id) void renameStation(station)
                      }}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                    >
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        /* Blank is a real submission, not a cancelled one: it
                           clears the name and returns the lane to its number.
                           Cancel is the separate button. */
                        placeholder={`Station ${String(station.station_number).padStart(2, '0')}`}
                        aria-label={`Rename ${stationLabel(station)}`}
                        maxLength={40}
                        className="control-h min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
                      />
                      <Button type="submit" size="sm" loading={busyId === station.id}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {stationLabel(station)}
                        </p>
                        {/* The number is always shown, even when a name
                            replaces it above. It is the station's identity in
                            the database and the thing two counters called
                            "Express" are told apart by. */}
                        <p className="text-xs text-muted">
                          Station {String(station.station_number).padStart(2, '0')} ·{' '}
                          {STATION_STATUS_LABELS[station.status]}
                        </p>
                      </div>

                      {canWrite && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setConfirmingRemoveId(null)
                              setRenamingId(station.id)
                              // Seeded with the stored name, not the rendered
                              // label — otherwise editing an unnamed station
                              // would pre-fill "Station 03" and saving it
                              // would store that as a literal name.
                              setRenameDraft(station.name?.trim() ?? '')
                            }}
                          >
                            Rename
                          </Button>
                          {/* Two-step, matching the board's own remove. A
                              counter is cheap to recreate but its removal is
                              instant and unprompted otherwise. */}
                          <Button
                            type="button"
                            size="sm"
                            variant={confirming ? 'destructive' : 'secondary'}
                            loading={busyId === station.id}
                            onClick={() => {
                              if (confirming) void removeStation(station)
                              else setConfirmingRemoveId(station.id)
                            }}
                          >
                            {confirming ? 'Confirm' : 'Remove'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* The shared EmptyState, not a bare paragraph centred in a box - so
          this reads like every other empty surface in the app rather than
          like a page that failed to load. */}
      {totalStations === 0 && (
        <div className="sp-rise sp-e1 mt-6 rounded-2xl border border-border bg-surface shadow-sm">
          <EmptyState
            icon={MonitorSmartphone}
            title="No checkout stations configured yet"
            description="Set up your lanes to start monitoring live checkout activity."
            action={
              /* The spinner carries the "working" state, so the label can stay
                 still instead of swapping to "Setting up…". */
              canWrite ? (
                <Button onClick={seedStations} loading={seeding}>
                  Set Up 4 Stations
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stations.map((station) => {
          const meta = STATUS_META[station.status]
          const Icon = meta.icon
          const isBusy = busyId === station.id
          return (
            <div key={station.id} className="overflow-hidden sp-rise sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
              <div className={`h-1.5 w-full ${meta.bar}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {stationLabel(station)}
                  </h3>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{station.payment_type}</p>

                {station.alert_type === 'weight_mismatch' && (
                  <div className="mt-4 overflow-hidden rounded-lg bg-surface-muted">
                    <div className="flex h-24 items-center justify-center text-muted">
                      <ScanLine className="h-8 w-8" />
                    </div>
                    <div className="flex items-start justify-between gap-2 bg-danger px-3 py-2 text-[11px] font-bold text-surface">
                      <span>
                        WEIGHT
                        <br />
                        MISMATCH
                      </span>
                      <span className="text-right font-semibold">
                        Expected: {station.alert_expected}kg
                        <br />
                        Actual: {station.alert_actual}kg
                      </span>
                    </div>
                  </div>
                )}

                {station.alert_type === 'age_verification' && (
                  <div className="mt-4 overflow-hidden rounded-lg bg-surface-muted">
                    <div className="flex h-24 items-center justify-center text-muted">
                      <ScanLine className="h-8 w-8" />
                    </div>
                    <div className="flex items-start justify-between gap-2 bg-warning px-3 py-2 text-[11px] font-bold text-surface">
                      <span>
                        AGE
                        <br />
                        VERIFICATION
                      </span>
                      <span className="text-right">{station.alert_item}</span>
                    </div>
                  </div>
                )}

                {station.status === 'in_use' && !station.alert_type && (
                  <div className="mt-4 space-y-2 rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Items Scanned</span>
                      <span className="font-bold text-foreground">{station.items_scanned}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Current Total</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(Number(station.current_total))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Session Time</span>
                      <span className="font-bold text-foreground">
                        {sessionElapsed(station.session_started_at, now)}
                      </span>
                    </div>
                  </div>
                )}

                {(station.status === 'available' || station.status === 'maintenance') && (
                  <div className="mt-4 flex h-32 flex-col items-center justify-center rounded-lg bg-surface-muted text-muted">
                    <Receipt className="h-7 w-7" />
                    <p className="mt-2 text-sm">Waiting for customer</p>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {station.alert_type === 'weight_mismatch' && canWrite && (
                    <button
                      onClick={() => overrideAlert(station)}
                      disabled={isBusy}
                      className="control-h w-full rounded-lg bg-foreground text-sm font-bold text-surface hover:opacity-90 disabled:opacity-60"
                    >
                      {isBusy ? 'Working…' : 'Override & Approve'}
                    </button>
                  )}
                  {station.alert_type === 'age_verification' && canWrite && (
                    <button
                      onClick={() => overrideAlert(station)}
                      disabled={isBusy}
                      className="control-h w-full rounded-lg bg-foreground text-sm font-bold text-surface hover:opacity-90 disabled:opacity-60"
                    >
                      {isBusy ? 'Working…' : 'Verify ID via Camera'}
                    </button>
                  )}
                  {station.alert_type && !canWrite && (
                    <p className="rounded-lg bg-surface-muted py-2.5 text-center text-xs text-muted">
                      Owner approval required
                    </p>
                  )}

                  {/* A "View Receipt" button sat here with no handler. Nothing
                      links a checkout_stations row to a sale, so there is no
                      receipt to open — showing the live basket instead. */}
                  {station.status === 'in_use' && !station.alert_type && (
                    <p className="rounded-lg bg-surface-muted py-2.5 text-center text-xs text-muted">
                      {station.items_scanned} item{station.items_scanned === 1 ? '' : 's'} ·{' '}
                      {formatCurrency(Number(station.current_total))}
                    </p>
                  )}

                  {/* Was inert. 'maintenance' is a valid status in the
                      checkout_stations check constraint, so this can be real. */}
                  {canWrite && (station.status === 'available' || station.status === 'maintenance') && (
                    <button
                      type="button"
                      onClick={() => toggleMaintenance(station)}
                      disabled={isBusy}
                      className="flex control-h w-full items-center justify-center gap-2 rounded-lg bg-surface-muted text-sm font-semibold text-muted hover:bg-surface-muted disabled:opacity-60"
                    >
                      <Wrench className="h-4 w-4" aria-hidden="true" />
                      {isBusy
                        ? 'Working…'
                        : station.status === 'maintenance'
                          ? 'End Maintenance'
                          : 'Maintenance Mode'}
                    </button>
                  )}

                  {/* Removing a counter is configuration, not operations, so it
                      is offered only for a station that is free or already
                      offline — a live basket cannot be deleted out from under
                      the customer standing at it. Same authority as the
                      maintenance toggle, which is what migration 0012's policy
                      grants. */}
                  {canWrite &&
                    (station.status === 'available' || station.status === 'maintenance') &&
                    (confirmingRemoveId === station.id ? (
                      <div className="rounded-lg bg-danger-bg p-2.5">
                        <p className="text-center text-xs font-semibold text-danger">
                          Remove this counter?
                        </p>
                        {/* `flex-1 min-w-0`, not `fullWidth`: Button carries
                            `shrink-0` in its base class, so two `w-full`
                            buttons in a flex row cannot shrink and the second
                            one lands outside the card — where the card's
                            `overflow-hidden` clips it away entirely. Measured
                            at +237px past the inner edge before this. A zero
                            flex-basis divides the row instead of overflowing
                            it, and survives `shrink-0`. */}
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            className="min-w-0 flex-1"
                            loading={isBusy}
                            onClick={() => removeStation(station)}
                          >
                            Remove
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="min-w-0 flex-1"
                            disabled={isBusy}
                            onClick={() => setConfirmingRemoveId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingRemoveId(station.id)}
                        disabled={isBusy}
                        className="flex control-h w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-muted hover:bg-danger-bg hover:text-danger disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Remove Counter
                      </button>
                    ))}

                  {station.alert_type && (
                    <button
                      onClick={() => dispatchStaff(station)}
                      disabled={isBusy}
                      className="control-h w-full rounded-lg bg-surface-muted text-sm font-semibold text-muted-strong hover:bg-surface-muted disabled:opacity-60"
                    >
                      Dispatch Staff
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
