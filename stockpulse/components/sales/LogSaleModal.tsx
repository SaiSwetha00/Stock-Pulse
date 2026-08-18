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
import { findProductByBarcode } from '@/app/(dashboard)/inventory/actions'
import ScannerPrototype from '@/components/scan/ScannerPrototype'
import type { Product } from '@/types'

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
async function raiseMilestoneIfReached(supabase: ReturnType<typeof createClient>) {
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
    title: `${count} sales today`,
    body: `Today's takings are ${formatCurrency(Number(row.total))} across ${count} transactions.`,
    kind: 'sales',
    entity: 'sales',
  })
}

interface CartLine {
  product: Product
  quantity: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'nfc', label: 'NFC' },
] as const

export default function LogSaleModal({
  products,
  onClose,
}: {
  products: Product[]
  onClose: () => void
}) {
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

  function addToCart(product: Product) {
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
      const result = await findProductByBarcode(value)
      if (!result.ok) {
        setScanError(result.message)
        return
      }
      if (!result.product) {
        setScanError(`No product in this store has the barcode ${value}. Nothing was added.`)
        return
      }
      // Manual search only lists products with stock > 0, so a scan must not
      // be a way round that. Same rule, stated once more because the search
      // filter cannot reach here.
      if (result.product.stock <= 0) {
        setScanError(`${result.product.name} is out of stock. Nothing was added.`)
        return
      }

      addToCart(result.product)
      setScanned((n) => n + 1)
      setScanError('')
      toast.success('Added to sale', `${result.product.name} · ${formatCurrency(result.product.unit_price)}`)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'The lookup failed. Try again.')
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

    setSaving(false)
    if (rpcError) {
      setError(rpcError.message)
      toast.error('Could not log sale', rpcError.message)
      return
    }
    toast.success(
      'Sale logged',
      `${cart.length} line item${cart.length === 1 ? '' : 's'} · ${formatCurrency(total)}`
    )

    // Deliberately not awaited: the sale is already committed and the toast
    // already shown, so a slow or failed milestone check must not hold the
    // modal open or surface an error for work the user did not ask for.
    void raiseMilestoneIfReached(supabase)

    router.refresh()
    onClose()
  }

  return (
    <Modal
      title="Log a Sale"
      onClose={onClose}
      width="lg"
      footer={
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">Total</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || cart.length === 0}
            className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Logging sale…' : 'Complete Sale'}
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
            {scanOpen ? 'Hide the scanner' : 'Scan a barcode'}
          </button>

          {/* Inline, NOT a nested Modal. D29: two live focus traps fight, and
              the outer one drags focus back out of the inner dialog. Inline
              also means the cashier can see the cart filling up while they
              scan, which is the whole job here. */}
          {scanOpen && (
            <div className="mb-4 rounded-xl border border-border bg-surface-muted p-4">
              <ScannerPrototype key={scanned} onDetected={handleScanned} />

              {scanBusy && <p className="mt-3 text-sm text-muted">Looking that barcode up…</p>}

              {scanError && (
                <div role="alert" className="mt-3 rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                  {scanError}
                </div>
              )}

              {scanned > 0 && !scanError && (
                <p className="mt-3 text-sm text-muted">
                  {scanned} item{scanned === 1 ? '' : 's'} scanned into this sale. Press Start
                  camera again for the next one.
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add..."
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
                      <span className="truncate font-medium text-foreground">{p.name}</span>
                    </span>
                    <span className="text-muted">
                      {formatCurrency(p.unit_price)} · {p.stock} in stock
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
                  title="No items yet"
                  description="Search above and add products to build this sale."
                  className="py-8"
                />
              </div>
            )}
            {cart.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{l.product.name}</p>
                  <p className="text-xs text-muted">{formatCurrency(l.product.unit_price)} each</p>
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
              Payment Method
            </label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((m) => (
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
