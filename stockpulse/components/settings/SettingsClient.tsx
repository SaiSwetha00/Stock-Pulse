'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { Store, SlidersHorizontal, UserSquare2, Palette, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Role, Store as StoreType } from '@/types'
import Toggle from '@/components/ui/Toggle'
import { ROLE_LABELS } from '@/lib/permissions'
import { useToast } from '@/components/ui/Toast'
import { LocalDate } from '@/components/ui/LocalTime'
import AddStaffModal from './AddStaffModal'
import InviteActions from './InviteActions'

/**
 * One entry per role. `manager` was missing, so `ROLE_STYLES[s.role]` returned
 * undefined for every manager and React rendered the literal string
 * "undefined" into the badge's class list — the pill lost its styling
 * entirely. Migration 0002 added the role; this lookup was never updated.
 *
 * Typed as the full Role union rather than Record<string, string> so the next
 * role added to the system fails the build here instead of silently producing
 * the same bug again.
 */
const ROLE_STYLES: Record<Role, string> = {
  owner: 'bg-accent-soft text-foreground',
  manager: 'bg-info-bg text-info',
  staff: 'bg-surface-muted text-muted-strong',
}

export default function SettingsClient({
  store,
  staff,
}: {
  store: StoreType
  staff: Profile[]
}) {
  const router = useRouter()
  const [name, setName] = useState(store.name)
  const [address, setAddress] = useState(store.address ?? '')
  const [phone, setPhone] = useState(store.contact_phone ?? '')
  const [threshold, setThreshold] = useState(store.low_stock_threshold_units)
  const [perishableHours, setPerishableHours] = useState(store.perishables_warning_hours)
  const [criticalAlerts, setCriticalAlerts] = useState(store.critical_stock_alerts)
  const [dailyDigest, setDailyDigest] = useState(store.daily_digest)
  const [supplierUpdates, setSupplierUpdates] = useState(store.supplier_updates)
  const [theme, setTheme] = useState(store.theme)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [addStaffOpen, setAddStaffOpen] = useState(false)

  /**
   * The theme actually in effect comes from localStorage — app/layout.tsx reads
   * `sp-theme` in a blocking script before paint, and AuthUI toggles the same
   * key. Writing only to stores.theme meant this control saved successfully and
   * changed nothing on screen, so apply it here too.
   */
  function applyTheme(next: 'light' | 'dark') {
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('sp-theme', next)
    } catch {
      // Private mode / storage disabled: the class is still applied for this
      // session, and stores.theme still records the choice.
    }
  }

  /**
   * Compared against the props rather than tracked with a flag.
   *
   * A boolean set by every onChange goes stale the moment someone types a
   * character and deletes it again — it would report unsaved changes for an
   * edit that no longer exists. Deriving it means "dirty" is always exactly
   * "differs from what is stored", and `router.refresh()` after a save brings
   * new props in, which clears it without any extra bookkeeping.
   */
  const dirty =
    name !== store.name ||
    address !== (store.address ?? '') ||
    phone !== (store.contact_phone ?? '') ||
    threshold !== store.low_stock_threshold_units ||
    perishableHours !== store.perishables_warning_hours ||
    criticalAlerts !== store.critical_stock_alerts ||
    dailyDigest !== store.daily_digest ||
    supplierUpdates !== store.supplier_updates ||
    theme !== store.theme

  function discard() {
    setName(store.name)
    setAddress(store.address ?? '')
    setPhone(store.contact_phone ?? '')
    setThreshold(store.low_stock_threshold_units)
    setPerishableHours(store.perishables_warning_hours)
    setCriticalAlerts(store.critical_stock_alerts)
    setDailyDigest(store.daily_digest)
    setSupplierUpdates(store.supplier_updates)
    // Theme is the one control that takes effect before saving, so undoing it
    // has to undo the class and localStorage too, not just the state.
    // stores.theme is a plain text column, so anything that is not 'dark'
    // resolves to light rather than being passed through unchecked.
    applyTheme(store.theme === 'dark' ? 'dark' : 'light')
    setSaveError('')
  }

  // Closing the tab is the one exit this component cannot intercept, and the
  // theme aside, nothing here is applied until Save. Without this the work is
  // gone with no warning.
  useEffect(() => {
    if (!dirty) return
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('stores')
      .update({
        name,
        address,
        contact_phone: phone,
        low_stock_threshold_units: threshold,
        perishables_warning_hours: perishableHours,
        critical_stock_alerts: criticalAlerts,
        daily_digest: dailyDigest,
        supplier_updates: supplierUpdates,
        theme,
      })
      .eq('id', store.id)
    setSaving(false)
    // A failed save used to fall through silently — the button returned to
    // "Save Changes" and the user had no way to tell it hadn't worked.
    if (error) {
      setSaveError(error.message)
      toast.error('Could not save settings', error.message)
      return
    }
    toast.success('Settings saved')
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Manage configuration, personnel, and operational parameters for {store.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span role="status" className="text-xs font-medium text-muted">
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            className="control-h rounded-lg border border-border px-4 text-sm font-semibold text-muted-strong hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
          >
            Discard
          </button>
          {/* Disabled when nothing has changed: a Save that is always
              available invites clicking it to check whether anything was
              missed, and every one of those is a pointless write. */}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="control-h rounded-lg bg-foreground px-5 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveError && (
        <div role="alert" className="mt-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
          Could not save settings: {saveError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Store className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="text-lg font-bold text-foreground">Store Details</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                  Store Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                  Primary Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                  Contact Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Palette className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="text-lg font-bold text-foreground">Appearance</h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Interface Theme</p>
                <p className="text-xs text-muted">Toggle light/dark mode</p>
              </div>
              <div className="flex rounded-lg bg-surface-muted p-1">
                <button
                  type="button"
                  onClick={() => applyTheme('light')}
                  aria-pressed={theme === 'light'}
                  className={`control-h rounded-md px-3 text-sm font-semibold ${
                    theme === 'light' ? 'bg-surface shadow-sm' : 'text-muted'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  className={`control-h rounded-md px-3 text-sm font-semibold ${
                    theme === 'dark' ? 'bg-surface shadow-sm' : 'text-muted'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <SlidersHorizontal className="h-4.5 w-4.5 text-muted-strong" />
            <h2 className="text-lg font-bold text-foreground">Operational Controls</h2>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inventory Thresholds</p>
            <div className="mt-3 rounded-xl bg-surface-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-strong">Global Low-Stock Alert</span>
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-muted-strong shadow-sm">
                  {threshold} Units
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="mt-3 w-full accent-zinc-900"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>0</span>
                <span>50</span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-surface-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-strong">Perishables Warning</span>
                <span className="rounded-md bg-warning-bg px-2 py-1 text-xs font-semibold text-warning">
                  {perishableHours} Hours
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={168}
                value={perishableHours}
                onChange={(e) => setPerishableHours(Number(e.target.value))}
                className="mt-3 w-full accent-zinc-900"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>12h</span>
                <span>7d</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Notifications</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Critical Stock Alerts</p>
                  <p className="text-xs text-muted">SMS & Email when items hit 0</p>
                </div>
                <Toggle
                  checked={criticalAlerts}
                  onChange={setCriticalAlerts}
                  label="Critical Stock Alerts"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Daily Digest</p>
                  <p className="text-xs text-muted">End-of-day sales summary</p>
                </div>
                <Toggle checked={dailyDigest} onChange={setDailyDigest} label="Daily Digest" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Supplier Updates</p>
                  <p className="text-xs text-muted">Delivery ETA changes</p>
                </div>
                <Toggle
                  checked={supplierUpdates}
                  onChange={setSupplierUpdates}
                  label="Supplier Updates"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <UserSquare2 className="h-4.5 w-4.5 text-muted-strong" />
            <h2 className="text-lg font-bold text-foreground">Staff Management</h2>
          </div>
          <Button onClick={() => setAddStaffOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add Staff
          </Button>
        </div>

        {/* Rows become a card list below `lg`; this table sits inside the
            staff panel, so they are divided blocks rather than floating
            cards. */}
        <div className="mt-4 lg:overflow-x-auto">
          <table className="sp-table block w-full text-left text-sm lg:table">
            <thead className="hidden lg:table-header-group">
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3 pr-4">Employee</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">
                  <span className="sr-only">Invitation actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="block lg:table-row-group">
              {staff.map((s) => (
                <tr
                  key={s.id}
                  className="block border-b border-border py-3 last:border-0 lg:table-row lg:py-0"
                >
                  <td className="block lg:table-cell lg:pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                        {s.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{s.full_name}</p>
                        <p className="truncate text-xs text-muted">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Below `lg` the column header is gone, so each value
                      carries its own label. */}
                  <td className="mt-3 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:pr-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Role
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLES[s.role]}`}>
                      {s.role === 'owner' ? 'Store Owner' : s.job_title || ROLE_LABELS[s.role]}
                    </span>
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:pr-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Joined
                    </span>
                    <LocalDate iso={s.created_at} withYear />
                  </td>
                  <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:pr-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                      Status
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-strong">
                      {/* Tokens rather than raw emerald/amber, so these two
                          dots follow dark mode like every other status
                          colour in the app. */}
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.role === 'owner' || !s.invited ? 'bg-accent' : 'bg-warning'
                        }`}
                      />
                      {s.role === 'owner' || !s.invited ? 'Active' : 'Invited'}
                    </span>
                  </td>
                  {/* Only pending invitations get controls. Somebody who has
                      accepted is an active colleague, and "resend invitation"
                      next to "delete this account" is not a pair of buttons
                      that should sit beside their name. */}
                  <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell">
                    {s.role !== 'owner' && s.invited && (
                      <>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          Invitation
                        </span>
                        <InviteActions
                          profileId={s.id}
                          fullName={s.full_name}
                          email={s.email}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addStaffOpen && <AddStaffModal storeId={store.id} onClose={() => setAddStaffOpen(false)} />}
    </div>
  )
}
