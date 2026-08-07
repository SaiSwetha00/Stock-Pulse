'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { REPORTING_TIMEZONE, reportingDate } from '@/lib/reportingTimezone'
import { notify } from '@/app/(dashboard)/notifications/actions'
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
                    className="flex control-h w-full items-center justify-between px-4 text-left text-sm hover:bg-surface-muted"
                  >
                    <span className="font-medium text-foreground">{p.name}</span>
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
