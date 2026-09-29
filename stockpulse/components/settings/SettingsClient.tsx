'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MIN_EXPIRY_WARNING_DAYS, storeExpiryWarningDays } from '@/lib/expiry'
import { Store, SlidersHorizontal, Palette, Users, Tags, Scale, ArrowRight, ArrowUpRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Store as StoreType } from '@/types'
import Toggle from '@/components/ui/Toggle'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { removeSampleData } from '@/app/(dashboard)/inventory/actions'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAppCopy } from '@/lib/i18n/client'
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
/**
 * The slider's own ceiling, deliberately below the column's CHECK of 90.
 *
 * 90 stops on a range input is a control nobody can land precisely, and no
 * grocery warns three months ahead. The wider bound stays in the database
 * because it is a backstop against a crafted request, not the control — this
 * page writes `stores` directly from the browser, so the CHECK is the only
 * thing standing between a hand-rolled PATCH and a nonsense value.
 */
const SLIDER_MAX_DAYS = 30

export default function SettingsClient({ store }: { store: StoreType }) {
  const router = useRouter()
  const copy = useAppCopy()
  const t = copy.settings
  const tcm = copy.common
  const [name, setName] = useState(store.name)
  const [address, setAddress] = useState(store.address ?? '')
  const [phone, setPhone] = useState(store.contact_phone ?? '')
  const [threshold, setThreshold] = useState(store.low_stock_threshold_units)
  // Days, replacing the hours slider that sat here and drove nothing. Read
  // through the helper because `expiry_warning_days` does not exist until 0017
  // is applied — see migration 0017 DECISION 1 for why this is the same
  // setting rather than a second one.
  const [expiryDays, setExpiryDays] = useState(storeExpiryWarningDays(store))
  const [criticalAlerts, setCriticalAlerts] = useState(store.critical_stock_alerts)
  const [dailyDigest, setDailyDigest] = useState(store.daily_digest)
  const [supplierUpdates, setSupplierUpdates] = useState(store.supplier_updates)
  const [theme, setTheme] = useState(store.theme)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
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
    expiryDays !== storeExpiryWarningDays(store) ||
    criticalAlerts !== store.critical_stock_alerts ||
    dailyDigest !== store.daily_digest ||
    supplierUpdates !== store.supplier_updates ||
    theme !== store.theme

  function discard() {
    setName(store.name)
    setAddress(store.address ?? '')
    setPhone(store.contact_phone ?? '')
    setThreshold(store.low_stock_threshold_units)
    setExpiryDays(storeExpiryWarningDays(store))
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
    const found = validateStoreSettings(
      { name, address, phone, expiryWarningDays: expiryDays },
      t,
    )
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
        expiry_warning_days: expiryDays,
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
      // PGRST204 naming this column means 0017 has not been applied. Named
      // rather than surfaced raw, the same way saveProduct names a missing
      // `barcode` column — a branch has to stay deployable ahead of its
      // migration, and every settings save on this branch writes this field.
      const missingColumn =
        error.code === 'PGRST204' && /expiry_warning_days/i.test(error.message ?? '')
      const message = missingColumn ? t.needsMigration : error.message
      setSaveError(message)
      toast.error(t.saveFailed, message)
      return
    }
    toast.success(t.savedToast)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">{t.eyebrow}</p>
          <h1 className="sp-title mt-2">{t.title}</h1>
          <p className="sp-body mt-2">{t.subtitle.replace('{store}', store.name)}</p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span role="status" className="text-xs font-medium text-muted">
              {t.unsaved}
            </span>
          )}
          <Button variant="secondary" onClick={discard} disabled={!dirty || saving}>
            {t.discard}
          </Button>
          {/* The one high-emphasis button on this screen. Disabled when
              nothing has changed: a Save that is always available invites
              clicking it to check whether anything was missed, and every one
              of those is a pointless write. */}
          <Button onClick={handleSave} loading={saving} disabled={!dirty}>
            {saving ? t.saving : saved ? t.savedTick : t.save}
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
              {t.saveErrorBanner.replace('{message}', saveError)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="sp-rise sp-delay-1 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Store className="h-4.5 w-4.5 text-muted-strong" />
              <h2 className="sp-heading">{t.details}</h2>
            </div>
            {/* Was three hand-rolled label+input pairs. Each label was a bare
                <label> with no htmlFor, so none of them pointed at its own
                control — clicking the label did nothing and a screen reader
                got an unnamed field. The address textarea also carried
                `control-h`, a fixed 40px height, which clamped its rows={2}
                to a single line. Field/Input/Textarea fix all of that and
                bring the error state with them. */}
            <div className="mt-4 space-y-4">
              <Field label={t.storeName} error={errors.name} required>
                {(props) => (
                  <Input
                    {...props}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="organization"
                  />
                )}
              </Field>

              <Field label={t.address} error={errors.address}>
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

              <Field label={t.phone} error={errors.phone}>
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
              <h2 className="sp-heading">{t.appearance}</h2>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.theme}</p>
                <p className="text-xs text-muted">{t.themeHint}</p>
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
                {(['light', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => applyTheme(mode)}
                    aria-pressed={theme === mode}
                    className={`control-h rounded-sm px-3 text-sm font-semibold transition-[background-color,color] duration-150 ${
                      theme === mode ? 'sp-e1 text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {mode === 'light' ? t.light : t.dark}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sp-rise sp-delay-3 sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <SlidersHorizontal className="h-4.5 w-4.5 text-muted-strong" />
            <h2 className="sp-heading">{t.controls}</h2>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.thresholds}</p>
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
                <span className="font-medium text-muted-strong">{t.lowStock}</span>
                <span className="sp-e1 rounded-sm px-2 py-1 text-xs font-semibold text-muted-strong">
                  {t.unitsValue.replace('{n}', String(threshold))}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                aria-label={t.lowStockAria}
                className="mt-3 w-full accent-[var(--accent-fill)]"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>0</span>
                <span>50</span>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-surface-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-strong">{t.expiryWarning}</span>
                <span className="rounded-sm bg-warning-bg px-2 py-1 text-xs font-semibold text-warning">
                  {(expiryDays === 1 ? t.dayValue : t.daysValue).replace('{n}', String(expiryDays))}
                </span>
              </div>
              {/* Days, not hours. This control used to read "48 Hours" and set
                  `perishables_warning_hours`, which nothing ever read — see
                  migration 0017. `product_batches.expiry_date` is a `date`, so
                  there is no hour on it to compare against: 12 hours and 23
                  hours were the same query, and a unit finer than the data is
                  a control promising precision it cannot deliver. */}
              <input
                type="range"
                min={MIN_EXPIRY_WARNING_DAYS}
                max={SLIDER_MAX_DAYS}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                aria-label={t.expiryAria}
                className="mt-3 w-full accent-[var(--accent-fill)]"
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{t.oneDay}</span>
                <span>{t.maxDays.replace('{n}', String(SLIDER_MAX_DAYS))}</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.notifications}</p>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.criticalAlerts}</p>
                  <p className="text-xs text-muted">{t.criticalAlertsHint}</p>
                </div>
                <Toggle
                  checked={criticalAlerts}
                  onChange={setCriticalAlerts}
                  label={t.criticalAlerts}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.dailyDigest}</p>
                  <p className="text-xs text-muted">{t.dailyDigestHint}</p>
                </div>
                <Toggle checked={dailyDigest} onChange={setDailyDigest} label={t.dailyDigest} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.supplierUpdates}</p>
                  <p className="text-xs text-muted">{t.supplierUpdatesHint}</p>
                </div>
                <Toggle
                  checked={supplierUpdates}
                  onChange={setSupplierUpdates}
                  label={t.supplierUpdates}
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
            <h2 className="sp-heading">{t.team}</h2>
            <p className="mt-0.5 text-sm text-muted">{t.teamHint}</p>
          </div>
        </div>
        <Link
          href="/staff/team"
          // A Link, so it cannot be <Button> — but it wears Button's secondary
          // skin verbatim so a navigation and an action of the same weight are
          // not two different-looking controls on one card.
          className="control-h relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-xs transition-[background-color,box-shadow,filter] duration-150 hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          {t.manageTeam}
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
            <h2 className="sp-heading">{t.categories}</h2>
            <p className="mt-0.5 text-sm text-muted">{t.categoriesHint}</p>
          </div>
        </div>
        <Link
          href="/settings/categories"
          className="control-h relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-xs transition-[background-color,box-shadow,filter] duration-150 hover:bg-surface-muted active:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          {t.manageCategories}
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
            <h2 className="sp-heading">{t.legal}</h2>
            <p className="mt-0.5 text-sm text-muted">{t.legalHint}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {[
            { href: '/privacy', label: t.privacy },
            { href: '/terms', label: t.terms },
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

      {/*
        Sample data.

        Placed at the end of Settings, after the legal links, because it is a
        one-time setup action rather than something anyone returns to - and
        because a destructive control belongs below the things people actually
        come here to change, not above them.
      */}
      <div className="sp-card-p sp-rise sp-e1 mt-6 flex flex-col gap-4 rounded-2xl border border-danger/25 bg-surface shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="sp-heading flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
            {t.sample}
          </h2>
          <p className="sp-body mt-1">{t.sampleHint}</p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0 border-danger/40 text-danger hover:bg-danger-bg"
          onClick={() => setConfirmClear(true)}
        >
          {t.sampleButton}
        </Button>
      </div>

      {confirmClear && (
      <Modal
        onClose={() => setConfirmClear(false)}
        title={t.sampleTitle}
        width="sm"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmClear(false)} disabled={clearing}>
              {tcm.cancel}
            </Button>
            <Button
              fullWidth
              loading={clearing}
              className="bg-danger text-[var(--surface)] hover:brightness-110"
              onClick={async () => {
                setClearing(true)
                const res = await removeSampleData()
                setClearing(false)
                setConfirmClear(false)
                if (!res.ok) {
                  toast.error(t.sampleKept, res.message)
                  return
                }
                toast.success(
                  (res.removed === 1 ? t.sampleRemovedOne : t.sampleRemovedMany).replace(
                    '{n}',
                    String(res.removed),
                  ),
                  res.keptWithSales
                    ? t.sampleWithSales.replace('{n}', String(res.keptWithSales))
                    : t.sampleNext,
                )
                router.refresh()
              }}
            >
              {t.sampleButton}
            </Button>
          </div>
        }
      >
        <div className="px-6 py-5">
          <p className="sp-body">{t.sampleBody1}</p>
          <p className="sp-body mt-3 text-muted">{t.sampleBody2}</p>
        </div>
      </Modal>
      )}

    </div>
  )
}
