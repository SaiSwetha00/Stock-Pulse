'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, SlidersHorizontal, Palette, Users, Tags, Scale, ArrowRight, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store as StoreType } from '@/types'
import Toggle from '@/components/ui/Toggle'
import Button from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import {
  validateStoreSettings,
  type StoreSettingsErrors,
} from '@/lib/validation/storeSettings'

/**
 * Store configuration, and nothing else.
 *
 * The team roster, Add Staff, invitation resend/revoke and the role badges all
 * used to live at the bottom of this screen, which meant "who works here" sat
 * under "how many hours before a perishable warns" while the rota they belong
 * beside lived in a different module. They are now the Staff module's Team tab;
 * what remains here is the store itself.
 */
export default function SettingsClient({ store }: { store: StoreType }) {
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
  const [errors, setErrors] = useState<StoreSettingsErrors>({})

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
    setErrors({})
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
    setSaveError('')

    // Validate before the round trip. `stores.name` is `not null` but not
    // `not blank`, so an empty name used to save successfully and leave the
    // shop nameless everywhere it is printed.
    const found = validateStoreSettings({ name, address, phone })
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setErrors({})

    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    const { error } = await supabase
      .from('stores')
      .update({
        // Trimmed on the way out, matching what was validated. Untrimmed
        // values would let " " past a check that ran against "".
        name: name.trim(),
        address: address.trim(),
        contact_phone: phone.trim(),
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
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Configuration</p>
          <h1 className="sp-title mt-2">Store Settings</h1>
          <p className="sp-body mt-2">
            Configuration and operational parameters for {store.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span role="status" className="text-xs font-medium text-muted">
              Unsaved changes
            </span>
          )}
          <Button variant="secondary" onClick={discard} disabled={!dirty || saving}>
            Discard
          </Button>
          {/* The one high-emphasis button on this screen. Disabled when
              nothing has changed: a Save that is always available invites
              clicking it to check whether anything was missed, and every one
              of those is a pointless write. */}
          <Button onClick={handleSave} loading={saving} disabled={!dirty}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Always mounted, opened by an attribute.

          A banner that is conditionally rendered cannot animate — it does not
          exist in the frame before it appears, so there is nothing to
          transition from, and it pops in and shoves the form down. `sp-collapse`
          transitions grid-template-rows 0fr -> 1fr, which is the one way CSS
          can animate to a content height nobody has measured.

          role="alert" is on the inner element rather than this wrapper so an
          empty, closed container is never announced. */}
      <div className="sp-collapse" data-open={saveError ? 'true' : 'false'}>
        <div>
          {saveError && (
            <div role="alert" className="mt-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
              Could not save settings: {saveError}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="sp-rise sp-delay-1 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Store className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="sp-heading">Store Details</h2>
            </div>
            {/* Was three hand-rolled label+input pairs. Each label was a bare
                <label> with no htmlFor, so none of them pointed at its own
                control — clicking the label did nothing and a screen reader
                got an unnamed field. The address textarea also carried
                `control-h`, a fixed 40px height, which clamped its rows={2}
                to a single line. Field/Input/Textarea fix all of that and
                bring the error state with them. */}
            <div className="mt-4 space-y-4">
              <Field label="Store Name" error={errors.name} required>
                {(props) => (
                  <Input
                    {...props}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="organization"
                  />
                )}
              </Field>

              <Field label="Primary Address" error={errors.address}>
                {(props) => (
                  <Textarea
                    {...props}
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                )}
              </Field>

              <Field label="Contact Phone" error={errors.phone}>
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                )}
              </Field>
            </div>
          </div>

          <div className="sp-rise sp-delay-2 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Palette className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="sp-heading">Appearance</h2>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Interface Theme</p>
                <p className="text-xs text-muted">Toggle light/dark mode</p>
              </div>
              {/* A segmented control, not two buttons. `rounded-sm` (6px)
                  inside a `rounded-lg` (10px) track with 4px of padding is
                  the radius that actually nests — matching the outer 10px
                  leaves a visible sliver of track at each corner. The active
                  segment is `sp-e1`, which paints; the `shadow-sm` it used to
                  carry computes to transparent in this setup (see the
                  elevation-ladder note in globals.css), so the selected side
                  was distinguished by background alone. */}
              <div className="flex shrink-0 rounded-lg bg-surface-muted p-1">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => applyTheme(t)}
                    aria-pressed={theme === t}
                    className={`control-h rounded-sm px-3 text-sm font-semibold transition-[background-color,color] duration-150 ${
                      theme === t ? 'sp-e1 text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {t === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sp-rise sp-delay-3 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <SlidersHorizontal className="h-4.5 w-4.5 text-muted-strong" />
            <h2 className="sp-heading">Operational Controls</h2>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inventory Thresholds</p>
            {/* `rounded-xl` is 16px — the modal/panel/drawer rung. These are
                inner panels inside a 10px card, so they were the one radius
                on the page that belonged to a different family. `rounded-lg`
                puts them back on 10px.

                The sliders took their accent from a raw zinc-900 palette
                class — the last two such classes in the app outside the
                fourteen intentional alpha scrims. (Spelled around here on
                purpose: Tailwind scans comments too, so writing the class
                name out would regenerate the dead rule this removes.) Near-black does not follow the
                theme, so in dark mode the filled track and thumb were
                near-black on a near-black card — the same way the toggle's
                OFF state disappeared before Phase 1 fixed it. `--accent-fill`
                is the surface-grade gold per D22 and inverts correctly. */}
            <div className="mt-3 rounded-lg bg-surface-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-strong">Global Low-Stock Alert</span>
                <span className="sp-e1 rounded-sm px-2 py-1 text-xs font-semibold text-muted-strong">
                  {threshold} Units
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                aria-label="Global low-stock alert, in units"
                className="mt-3 w-full accent-[var(--accent-fill)]"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>0</span>
                <span>50</span>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-surface-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-strong">Perishables Warning</span>
                <span className="rounded-sm bg-warning-bg px-2 py-1 text-xs font-semibold text-warning">
                  {perishableHours} Hours
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={168}
                value={perishableHours}
                onChange={(e) => setPerishableHours(Number(e.target.value))}
                aria-label="Perishables warning, in hours"
                className="mt-3 w-full accent-[var(--accent-fill)]"
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Critical Stock Alerts</p>
                  <p className="text-xs text-muted">SMS & Email when items hit 0</p>
                </div>
                <Toggle
                  checked={criticalAlerts}
                  onChange={setCriticalAlerts}
                  label="Critical Stock Alerts"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Daily Digest</p>
                  <p className="text-xs text-muted">End-of-day sales summary</p>
                </div>
                <Toggle checked={dailyDigest} onChange={setDailyDigest} label="Daily Digest" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
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

      {/* Not a staff surface — a signpost to one.

          Everything that used to be here (the roster, Add Staff, invitation
          resend and revoke, role changes) now lives in the Staff module beside
          the rota. This line exists because an owner who has been using the app
          will look here first, and a screen that silently loses a feature reads
          as a broken screen. */}
      <div className="sp-card-p sp-rise sp-delay-4 mt-6 flex flex-wrap items-center justify-between gap-4 sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
            <Users className="h-4.5 w-4.5 text-muted-strong" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="sp-heading">Your team</h2>
            <p className="mt-0.5 text-sm text-muted">
              Invitations, roles and access moved to Staff, beside the rota.
            </p>
          </div>
        </div>
        <Link
          href="/staff/team"
          // A Link, so it cannot be <Button> — but it wears Button's secondary
          // skin verbatim so a navigation and an action of the same weight are
          // not two different-looking controls on one card.
          className="control-h relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-xs transition-[background-color,box-shadow,filter] duration-150 hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          Manage team
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Same signpost shape as "Your team" above, for the same reason: the
          screen it points at is a sibling route with its own guard, not a
          panel that belongs on this page.

          The guard differs, though, and that is the point. /settings is
          owner-only; /settings/categories is canManage(), because filing a
          product under a category is manager work and the product form links
          straight there. See the header of that route's page.tsx. */}
      <div className="sp-card-p sp-rise sp-delay-5 mt-6 flex flex-wrap items-center justify-between gap-4 sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
            <Tags className="h-4.5 w-4.5 text-muted-strong" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="sp-heading">Product categories</h2>
            <p className="mt-0.5 text-sm text-muted">
              Add, rename and reorder the categories your products are filed under.
            </p>
          </div>
        </div>
        <Link
          href="/settings/categories"
          className="control-h relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-xs transition-[background-color,box-shadow,filter] duration-150 hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          Manage categories
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Not a signpost to a feature — a signpost to the documents.

          These are linked in the marketing footer, which a signed-in owner
          rarely sees: once you are inside the app you stop visiting the landing
          page, and the terms you agreed to become unreachable without signing
          out. Both open in a new tab so reading them does not lose unsaved
          changes on this screen, which is a form. */}
      <div className="sp-card-p sp-rise sp-delay-6 mt-6 flex flex-wrap items-center justify-between gap-4 sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
            <Scale className="h-4.5 w-4.5 text-muted-strong" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="sp-heading">Legal</h2>
            <p className="mt-0.5 text-sm text-muted">
              The privacy policy and terms that apply to this store&apos;s account.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
          ].map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="control-h relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-xs transition-[background-color,box-shadow,filter] duration-150 hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              {doc.label}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
