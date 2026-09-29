'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, Trash2, ShoppingCart, ScanLine } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import ProductThumb from '@/components/ui/ProductThumb'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { REPORTING_TIMEZONE, reportingDate } from '@/lib/reportingTimezone'
import { notify } from '@/app/(dashboard)/notifications/actions'
import { lookupBarcode } from '@/lib/offline/barcodeLookup'
import type { CachedProduct } from '@/lib/offline/snapshot'
import ScannerPrototype from '@/components/scan/ScannerPrototype'
import ExpiryTag from '@/components/ui/ExpiryTag'
import { expiryRelative, expiryTone, formatExpiry, nextExpiry } from '@/lib/expiry'
import { enqueueSale, newSaleId, type QueuedSale } from '@/lib/offline/queue'
import type { Product } from '@/types'
import { useAppCopy } from '@/lib/i18n/client'
import type { ExpiryCopy, PosCopy } from '@/lib/i18n/app'

/**
 * Counts worth telling the shop about. Round numbers only — a notification
 * on every sale would train people to ignore the bell, which costs more than
 * the milestones are worth.
 */
const SALE_MILESTONES = [10, 25, 50, 100, 200, 500]

/**
 * Fires only when the day's count lands exactly on a milestone, so each one
 * is announced once. Reads through the same aggregate function the dashboard
 * uses rather than counting rows here.
 */
async function raiseMilestoneIfReached(
  supabase: ReturnType<typeof createClient>,
  /** The notification is PERSISTED, so it keeps the language it was written
   *  in even if the shop later switches. */
  t: PosCopy,
) {
  const today = reportingDate()
  const { data } = await supabase.rpc('sales_daily_totals', {
    p_from: today,
    p_to: today,
    p_tz: REPORTING_TIMEZONE,
  })

  const row = (data as { sale_count: number; total: number }[] | null)?.[0]
  if (!row) return

  const count = Number(row.sale_count)
  if (!SALE_MILESTONES.includes(count)) return

  await notify({
    title: t.milestoneTitle.replace('{n}', String(count)),
    body: t.milestoneBody
      .replace('{total}', formatCurrency(Number(row.total)))
      .replace('{n}', String(count)),
    kind: 'sales',
    entity: 'sales',
  })
}

/**
 * The expiry phrase for a toast, which is plain text and cannot carry the
 * colour ExpiryTag uses. So the words have to do the work the colour does
 * elsewhere: "Expired" and "expires in 3 days" read differently at a glance
 * even in a single grey line.
 */
function expiryToastSuffix(
  date: string,
  today: string,
  warningDays: number,
  t: PosCopy,
  te: ExpiryCopy,
): string {
  const tone = expiryTone(date, today, warningDays)
  if (tone === 'expired') return t.expiredSuffix.replace('{rel}', expiryRelative(date, today, te))
  if (tone === 'soon') return t.expiresSoonSuffix.replace('{rel}', expiryRelative(date, today, te))
  return t.expiresSuffix.replace('{date}', formatExpiry(date, te.months))
}

/**
 * How many of a product's lots still hold stock AND carry a date — the number
 * `nextExpiry` picked its answer from. Counting every lot would inflate the
 * "+N more lots" hint with sold-out rows 0016 keeps for their history and with
 * undated rows that can never be the nearest expiry.
 */
function atRiskLots(product: SellableProduct): number {
  return (product.product_batches ?? []).filter((b) => b.quantity > 0 && b.expiry_date).length
}

/**
 * The only fields a cart line actually needs.
 *
 * Introduced when the offline scan was fixed. A cached product is NOT a
 * `Product` - it has no `store_id`, `created_at` or `updated_at`, because
 * Phase 2's snapshot is a deliberate allowlist. The alternative was to
 * fabricate those three fields when hydrating a cache hit, which would have put
 * invented values into a record that later becomes a queued sale. Narrowing the
 * type instead means both a server `Product` and a cached one satisfy it
 * honestly, and nothing has to be made up.
 */
type SellableProduct = {
  id: string
  name: string
  unit_price: number
  stock: number
  product_batches?: { quantity: number; expiry_date: string | null }[]
}

/** A cached product, in the shape the cart understands. `batches` is the
 *  snapshot's name for what the server calls `product_batches`. */
function fromCache(c: CachedProduct): SellableProduct {
  return {
    id: c.id,
    name: c.name,
    unit_price: c.unit_price,
    stock: c.stock,
    product_batches: c.batches,
  }
}

interface CartLine {
  product: SellableProduct
  quantity: number
}

/** A function, not a constant: a module-scope literal cannot read a hook. */
function paymentMethods(t: PosCopy) {
  return [
    { value: 'cash', label: t.methodCash },
    { value: 'card', label: t.methodCard },
    { value: 'nfc', label: t.methodNfc },
  ] as const
}

export default function LogSaleModal({
  products,
  today,
  expiryWarningDays,
  storeId,
  userId,
  onClose,
}: {
  products: Product[]
  /** Stamped onto a queued sale at the moment it is made, never at sync time
   *  — an expired session or a shift change must not reattribute takings. */
  storeId: string
  userId: string
  /** Shop's calendar date and warning window, decided server-side. */
  today: string
  expiryWarningDays: number
  onClose: () => void
}) {
  const t = useAppCopy()
  const tp = t.pos
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'nfc'>('cash')
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // --- barcode scanning (Phase 4) -----------------------------------------
  const [scanOpen, setScanOpen] = useState(false)
  const [scanBusy, setScanBusy] = useState(false)
  const [scanError, setScanError] = useState('')
  /**
   * Counts successful scans, and doubles as a remount key for the scanner.
   *
   * ScannerPrototype hands off once per camera session (a ref guard stops its
   * ~8fps loop reopening a dialog repeatedly). A till needs to scan item after
   * item, so bumping this key remounts the component and arms it again —
   * achieved without changing the scanner, which stays exactly as Phase 2
   * shipped it.
   */
  const [scanned, setScanned] = useState(0)

  const results = useMemo(() => {
    if (!search) return []
    return products
      .filter((p) => p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6)
  }, [products, search])

  const total = cart.reduce((sum, l) => sum + l.product.unit_price * l.quantity, 0)

  function addToCart(product: SellableProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) }
            : l
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setSearch('')
  }

  /**
   * A scanned barcode enters the sale HERE, through addToCart — the exact
   * function the search results call. Nothing about pricing, duplicate
   * handling, the stock cap or submission is duplicated: scanning is an entry
   * point, not a parallel path.
   *
   * Consequences that follow for free, rather than by being re-implemented:
   *   - the same product scanned twice increments the line and caps at stock,
   *     because that is what addToCart already does;
   *   - the price charged is product.unit_price, the current price;
   *   - handleSubmit maps the cart into log_sale unchanged, so stock is
   *     deducted identically however the line got there.
   *
   * An unknown barcode is an ERROR at a till, never an invitation to create a
   * product mid-sale — that is the Inventory flow's job, and doing it here
   * would mean inventing a price and a name with a customer waiting.
   */
  async function handleScanned(value: string) {
    if (scanBusy) return
    setScanBusy(true)
    setScanError('')
    try {
      // `lookupBarcode`, NOT `findProductByBarcode`.
      //
      // This was a real defect, found on a phone rather than by any harness:
      // the Server Action is network-only, so scanning offline rejected its
      // fetch, the catch below surfaced the raw "Failed to fetch", and the
      // scanner's own placeholder text stayed on screen because handleScanned
      // never completed. The product was never added and the total stayed at
      // zero, with the camera having decoded perfectly.
      //
      // The offline signal was already in this file - `handleSubmit` reads
      // `navigator.onLine` - it simply never reached the scan path. This is
      // Inventory's pattern, which had it right since Phase 2: one entry point
      // that IS the Server Action online and reads the store-scoped cache off.
      const result = await lookupBarcode(value, storeId, t.inventory.actBadBarcode)
      if (!result.ok) {
        setScanError(result.message)
        return
      }

      // The cache and the server answer the same question, so the rules after
      // this point are stated ONCE over a common shape rather than duplicated
      // per branch - which is how the two would drift.
      const found: SellableProduct | null =
        result.source === 'cache'
          ? result.product
            ? fromCache(result.product)
            : null
          : result.product

      if (!found) {
        // Named differently offline, because "no product in this store" would
        // be a claim this device cannot make - it can only speak for the list
        // it has saved.
        setScanError(
          result.source === 'cache'
            ? tp.scanNoSavedMatch.replace('{code}', value)
            : tp.scanNoMatch.replace('{code}', value),
        )
        return
      }
      // Manual search only lists products with stock > 0, so a scan must not
      // be a way round that. Same rule, stated once more because the search
      // filter cannot reach here. Offline this reads the cached number, which
      // the offline till has already reduced by anything queued.
      if (found.stock <= 0) {
        setScanError(tp.scanOutOfStock.replace('{name}', found.name))
        return
      }

      addToCart(found)
      setScanned((n) => n + 1)
      setScanError('')
      // The toast names the expiry state as well as the price, because it is
      // the one moment the cashier is definitely looking at the screen. It
      // does NOT block or refuse the sale: Phase 4 is display only, and
      // deciding that expired stock cannot be sold is a policy question
      // nobody has asked for — a shopkeeper may well be selling it knowingly
      // at a discount. The line stays on the cart row afterwards, so the
      // information does not vanish with the toast.
      const scannedExpiry = nextExpiry(found.product_batches)
      toast.success(
        result.source === 'cache' ? tp.addedFromCache : tp.addedToSale,
        `${found.name} · ${formatCurrency(found.unit_price)}${
          scannedExpiry
            ? ` · ${expiryToastSuffix(scannedExpiry, today, expiryWarningDays, tp, t.expiry)}`
            : ''
        }`,
      )
    } catch (err) {
      // `lookupBarcode` falls back to the cache on a network failure, so
      // reaching here means something else broke. A raw "Failed to fetch" is
      // what this defect showed a shopkeeper on a phone; it is not a sentence
      // anybody can act on, so the real message is kept for the console.
      console.warn('[sales] barcode lookup failed:', err)
      setScanError(tp.scanLookupFailed)
    } finally {
      setScanBusy(false)
    }
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: Math.max(1, Math.min(l.quantity + delta, l.product.stock)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    )
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId))
  }

  async function handleSubmit() {
    if (cart.length === 0) return
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: rpcError } = await supabase.rpc('log_sale', {
      p_items: cart.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
      p_payment_method: paymentMethod,
    })

    if (rpcError) {
      // Could this have been the network? postgrest-js RESOLVES rather than
      // throws when a fetch fails, handing back `status: 0` and a message that
      // is a raw TypeError — measured in Offline Phase 1. That, or an explicit
      // offline flag, is the only case worth queueing: a 23514 or an RLS
      // refusal is the server saying no, and queueing it would replay a sale
      // the server has already rejected.
      const looksOffline =
        navigator.onLine === false ||
        /fetch|network|Failed to fetch/i.test(rpcError.message ?? '')

      if (looksOffline) {
        const sale: QueuedSale = {
          id: newSaleId(),
          storeId,
          userId,
          createdAt: new Date().toISOString(),
          paymentMethod,
          total,
          items: cart.map((l) => ({
            product_id: l.product.id,
            product_name: l.product.name,
            quantity: l.quantity,
            // The price CHARGED, captured now. See lib/offline/queue.ts.
            unit_price: l.product.unit_price,
          })),
        }
        const stored = await enqueueSale(sale)
        setSaving(false)

        if (!stored) {
          // The one outcome that must never be silent: the sale is neither on
          // the server nor on the device. The modal stays open with the cart
          // intact so it can be written down or retried.
          const msg = tp.notSavedBody
          setError(msg)
          toast.error(tp.notSavedTitle, msg)
          return
        }

        toast.success(
          tp.savedLocally,
          (cart.length === 1 ? tp.savedLocallyBodyOne : tp.savedLocallyBodyMany)
            .replace('{n}', String(cart.length))
            .replace('{total}', formatCurrency(total)),
        )
        // No router.refresh(): there is nothing new on the server to fetch, and
        // offline it would fail. The queue badge updates from its own storage.
        onClose()
        return
      }

      setError(rpcError.message)
      toast.error(tp.couldNotLog, rpcError.message)
      return
    }

    setSaving(false)
    toast.success(
      tp.saleLogged,
      (cart.length === 1 ? tp.saleLoggedOne : tp.saleLoggedMany)
        .replace('{n}', String(cart.length))
        .replace('{total}', formatCurrency(total)),
    )

    // Deliberately not awaited: the sale is already committed and the toast
    // already shown, so a slow or failed milestone check must not hold the
    // modal open or surface an error for work the user did not ask for.
    void raiseMilestoneIfReached(supabase, tp)

    router.refresh()
    onClose()
  }

  return (
    <Modal
      title={tp.modalTitle}
      onClose={onClose}
      width="lg"
      footer={
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">{tp.total}</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || cart.length === 0}
            className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50"
          >
            {saving ? tp.loggingSale : tp.completeSale}
          </button>
        </>
      }
    >
        <div className="px-6 py-5">
          {error && <div className="mb-4 rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}

          {/* Scanning sits beside the search box because it is the same job —
              choosing which product goes into the sale — and it is ungated,
              exactly like the search box, because staff work the till. */}
          <button
            type="button"
            onClick={() => {
              setScanError('')
              setScanOpen(true)
            }}
            className="control-h mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
          >
            <ScanLine className="h-4 w-4" aria-hidden="true" />
            {scanOpen ? tp.hideScanner : tp.scanBarcode}
          </button>

          {/* Inline, NOT a nested Modal. D29: two live focus traps fight, and
              the outer one drags focus back out of the inner dialog. Inline
              also means the cashier can see the cart filling up while they
              scan, which is the whole job here. */}
          {scanOpen && (
            <div className="mb-4 rounded-xl border border-border bg-surface-muted p-4">
              <ScannerPrototype key={scanned} onDetected={handleScanned} />

              {scanBusy && <p className="mt-3 text-sm text-muted">{tp.scanLooking}</p>}

              {scanError && (
                <div role="alert" className="mt-3 rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                  {scanError}
                </div>
              )}

              {scanned > 0 && !scanError && (
                <p className="mt-3 text-sm text-muted">
                  {(scanned === 1 ? tp.scannedOne : tp.scannedMany).replace(
                    '{n}',
                    String(scanned),
                  )}
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tp.searchProducts}
              className="control-h w-full rounded-lg border border-border bg-surface-muted pl-10 pr-4 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-surface-muted"
                  >
                    {/* The photo is how a line gets recognised at a till — far
                        faster than reading a name out of a long list. */}
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ProductThumb name={p.name} imageUrl={p.image_url} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{p.name}</span>
                        {/* Only when there IS a date. An unexpiring product in
                            a dropdown of ten would otherwise contribute a line
                            of "No expiry date" saying nothing — the cart row
                            can afford that reassurance, a search list cannot. */}
                        {nextExpiry(p.product_batches) && (
                          <ExpiryTag
                            copy={t.expiry}
                            date={nextExpiry(p.product_batches)}
                            today={today}
                            warningDays={expiryWarningDays}
                            lots={atRiskLots(p)}
                          />
                        )}
                      </span>
                    </span>
                    <span className="text-muted">
                      {formatCurrency(p.unit_price)} ·{' '}
                      {tp.inStock.replace('{n}', String(p.stock))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {cart.length === 0 && (
              <div className="rounded-lg bg-surface-muted">
                <EmptyState
                  icon={ShoppingCart}
                  title={tp.emptyCartTitle}
                  description={tp.emptyCartBody}
                  className="py-8"
                />
              </div>
            )}
            {cart.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{l.product.name}</p>
                  <p className="text-xs text-muted">
                    {tp.eachPrice.replace('{price}', formatCurrency(l.product.unit_price))}
                  </p>
                  {/* Stays on the row after the toast has gone. A cashier who
                      scanned four things should still be able to see which of
                      them is the expired one while ringing up the fifth.
                      Rendered for scanned AND searched lines alike, because a
                      cart line does not remember how it got there. */}
                  <ExpiryTag
                    copy={t.expiry}
                    date={nextExpiry(l.product.product_batches)}
                    today={today}
                    warningDays={expiryWarningDays}
                    lots={atRiskLots(l.product)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1">
                    <button
                      type="button"
                      onClick={() => updateQty(l.product.id, -1)}
                      className="text-muted hover:text-foreground"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(l.product.id, 1)}
                      className="text-muted hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(l.product.unit_price * l.quantity)}
                  </span>
                  <button onClick={() => removeLine(l.product.id)} className="text-muted hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              {tp.paymentMethod}
            </label>
            <div className="flex gap-2">
              {paymentMethods(tp).map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`control-h flex-1 rounded-lg text-sm font-semibold ${
                    paymentMethod === m.value
                      ? 'bg-foreground text-surface'
                      : 'bg-surface-muted text-muted-strong hover:bg-surface-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

    </Modal>
  )
}
