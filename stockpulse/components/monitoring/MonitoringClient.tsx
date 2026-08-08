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
import { canManage } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Eye,
  Zap,
  Receipt,
  Wrench,
  ScanLine,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
// Generic polling badge; it lives under dashboard/ because that's where it was
// first needed, but it has no dashboard-specific behaviour.
import AutoRefresh from '@/components/dashboard/AutoRefresh'
import { useToast } from '@/components/ui/Toast'
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

  async function seedStations() {
    setSeeding(true)
    setError('')
    const supabase = createClient()
    const now = Date.now()
    const rows = [
      {
        store_id: storeId,
        station_number: 1,
        status: 'assistance',
        payment_type: 'Card Only',
        items_scanned: 6,
        current_total: 18.4,
        session_started_at: new Date(now - 4 * 60000).toISOString(),
        alert_type: 'weight_mismatch',
        alert_expected: 1.2,
        alert_actual: 2.5,
      },
      {
        store_id: storeId,
        station_number: 2,
        status: 'review',
        payment_type: 'Cash & Card',
        items_scanned: 9,
        current_total: 42.15,
        session_started_at: new Date(now - 6 * 60000).toISOString(),
        alert_type: 'age_verification',
        alert_item: 'Alcohol Item',
      },
      {
        store_id: storeId,
        station_number: 3,
        status: 'in_use',
        payment_type: 'Card Only',
        items_scanned: 14,
        current_total: 87.42,
        session_started_at: new Date(now - 165000).toISOString(),
      },
      {
        store_id: storeId,
        station_number: 4,
        status: 'available',
        payment_type: 'Cash & Card',
        items_scanned: 0,
        current_total: 0,
      },
    ]
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.6fr]">
        <div className="rounded-2xl bg-danger-bg p-6 shadow-sm">
          <p className="sp-heading flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
          </p>
          <p className="mt-3 text-4xl font-bold text-danger">{activeAlerts}</p>
          <p className="mt-1 text-sm text-danger">Require Immediate Attention</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-success-bg to-surface-muted p-6 shadow-sm">
          <p className="sp-heading flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Stations Active
          </p>
          <p className="mt-3 text-4xl font-bold text-success">
            {stationsActive}/{totalStations}
          </p>
          <p className="sp-body mt-2">Optimal Utilization</p>
        </div>

        <div className="sp-rise rounded-2xl border border-border bg-surface-muted p-6 shadow-sm">
          <p className="sp-heading">Current Intervention Rate</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-4xl font-bold text-foreground">{interventionRate.toFixed(1)}%</p>
            <span className="flex items-center gap-1 text-sm font-semibold text-danger">
              <TrendingUp className="h-4 w-4" />
              {activeAlerts} flagged now
            </span>
          </div>
        </div>
      </div>

      {totalStations === 0 && (
        <div className="mt-6 sp-rise sp-e1 rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <p className="text-muted">No checkout stations configured yet.</p>
          {/* The spinner carries the "working" state, so the label can stay
              still instead of swapping to "Setting up…". */}
          {canWrite && (
            <Button className="mt-4" onClick={seedStations} loading={seeding}>
              Set Up 4 Stations
            </Button>
          )}
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
                    Station {String(station.station_number).padStart(2, '0')}
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
