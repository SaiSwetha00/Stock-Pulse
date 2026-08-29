'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackageX } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Badge, { type BadgeTone } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProductThumb from '@/components/ui/ProductThumb'
import EmptyState from '@/components/ui/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/format'
import { expiryRelative, expiryTone, formatExpiry, nextExpiry } from '@/lib/expiry'
import { getProductDetails, type ProductDetails } from '@/app/(dashboard)/inventory/actions'

/**
 * What the global search opens when a product result is clicked.
 *
 * WHAT IT REPLACED, AND WHY. The palette answered a product click by pushing
 * `/inventory?q=<name>` — a whole page navigation that re-fetched the
 * catalogue to show one filtered row, and that from `/sales` or `/reports`
 * threw the reader off the page they were working on. It also could not answer
 * the question the search implies: someone typing a product name wants to know
 * what that product IS, and a table row shows six columns of it. This shows
 * the record.
 *
 * READ-ONLY, DELIBERATELY, AND FOR TWO SEPARATE REASONS.
 *
 *  - Editing already has a home. `ProductModal` is the edit form, it is where
 *    stock is adjusted (CLAUDE.md: the Quantity field in that modal IS the
 *    stock-adjust screen), and it is gated behind `canWrite`. A second editing
 *    surface reachable from the search box would be a third scan-style flow of
 *    exactly the kind the inventory notes warn against adding.
 *  - This opens from ANY route, for ANY role. Staff reach it — they use the
 *    same search box — and `saveProduct` refuses staff writes. An editable
 *    field here would be a form whose Save is guaranteed to fail for the
 *    people most likely to be holding the phone.
 *
 * So the only way out of it toward a change is "Open in Inventory", which is
 * the old navigation kept as a footer button rather than as the click
 * behaviour. Nothing that used to be reachable stopped being reachable.
 *
 * EVERY FIELD IS A COLUMN. Nothing here is derived beyond the two things the
 * inventory list already derives from the same data — the stock-status badge
 * (`stock` vs `low_stock_threshold`) and the nearest expiry (`nextExpiry` over
 * the lots). No value is invented, and a column that is null says so in an em
 * dash rather than being hidden, because "this product has no barcode" and "we
 * did not look" are different answers.
 */

/**
 * The status rule, mirrored from `InventoryClient`'s `stockStatus`/`statusFor`
 * pair.
 *
 * COPIED rather than imported because that pair is module-private to an
 * 800-line client component that also owns filters, sorting, CSV columns and
 * four modals — importing from it would pull all of that into every route that
 * mounts the palette, which is every dashboard route. The rule is three
 * comparisons and it is stated here in full. If the thresholds ever change
 * they change in both places: the badge in the search result and the badge in
 * the table are the same claim about the same product and must not disagree.
 */
function statusFor(stock: number, threshold: number): { label: string; tone: BadgeTone } {
  if (stock <= 0) return { label: 'Out of Stock', tone: 'danger' }
  if (stock <= threshold) return { label: 'Low Stock', tone: 'warning' }
  return { label: 'In Stock', tone: 'success' }
}

/** One label/value pair. `value` is already formatted by the caller. */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  )
}

/** The em dash every empty column shares, so blanks read as one thing. */
const EMPTY = <span className="text-muted">—</span>

export default function ProductDetailsModal({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'missing' } | { status: 'ready'; data: ProductDetails }
  >({ status: 'loading' })

  /**
   * Fetched on open rather than carried over from the search result, which
   * holds only id/name/sku/barcode.
   *
   * `cancelled` guards the state write: the dialog can be dismissed while the
   * action is still in flight, and setting state on an unmounted component is
   * the one way this could complain at a moment the user has already moved on.
   *
   * NOTHING RESETS TO 'loading' HERE, and that is not an omission. The
   * provider mounts this with `key={detailsId}`, so choosing a second product
   * remounts the component and `useState` hands back 'loading' on its own. The
   * synchronous reset this effect used to open with was both redundant and a
   * cascading render — the same `react-hooks/set-state-in-effect` rule
   * CommandPalette's debounce already works around.
   */
  useEffect(() => {
    let cancelled = false
    void getProductDetails(productId).then((data) => {
      if (cancelled) return
      setState(data ? { status: 'ready', data } : { status: 'missing' })
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  const product = state.status === 'ready' ? state.data.product : null

  return (
    <Modal
      title={product ? product.name : 'Product details'}
      onClose={onClose}
      width="xl"
      footer={
        product ? (
          /* Full width on a phone, where the panel is the whole screen and a
             small right-aligned target is the hardest thing to hit; auto width
             from `sm` up. `w-full` rather than the `fullWidth` prop, because
             `Button` carries `shrink-0` — the measured trap ProductModal's
             footer comment records. One child, so nothing here can fight for
             width either way. */
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                onClose()
                // The palette's old click behaviour, kept: this is the route
                // to editing, to deleting, and to the rest of the catalogue.
                router.push(`/inventory?q=${encodeURIComponent(product.name)}`)
              }}
            >
              Open in Inventory
            </Button>
          </div>
        ) : undefined
      }
    >
      {/* `px-6 py-5` on the body, because Modal's own body div carries NO
          padding — every caller supplies it (ProductModal, ImportProductsModal
          and the rest all wrap their children exactly this way). Without it
          the content sits flush against the panel edge. */}
      {state.status === 'loading' && (
        <div className="space-y-4 px-6 py-5" aria-busy="true" aria-label="Loading product details">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A product deleted in another tab between the search and the click is
          an ordinary race, not an error. It is said plainly instead of leaving
          an empty dialog or throwing. */}
      {state.status === 'missing' && (
        <EmptyState
          icon={PackageX}
          title="Product not found"
          description="It may have been deleted, or it belongs to another store."
          className="py-10"
        />
      )}

      {state.status === 'ready' && <ProductDetailsBody details={state.data} />}
    </Modal>
  )
}

function ProductDetailsBody({ details }: { details: ProductDetails }) {
  const { product, categoryName, today, warningDays } = details
  const badge = statusFor(product.stock, product.low_stock_threshold)

  // The lots, as stored. Sorted earliest-expiry-first with undated lots last,
  // which is the order a shopkeeper reads them in — and the same ordering rule
  // `nextExpiry` applies when it picks one date out of them.
  const lots = [...(product.product_batches ?? [])].sort((a, b) => {
    if (a.expiry_date === b.expiry_date) return a.received_on.localeCompare(b.received_on)
    if (!a.expiry_date) return 1
    if (!b.expiry_date) return -1
    return a.expiry_date.localeCompare(b.expiry_date)
  })

  const soonest = nextExpiry(product.product_batches)

  return (
    <div className="space-y-6 px-6 py-5">
      {/* ---- Identity ---- */}
      <div className="flex items-start gap-4">
        <ProductThumb name={product.name} imageUrl={product.image_url} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{product.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {product.brand || 'No brand recorded'}
          </p>
          <div className="mt-2">
            <Badge tone={badge.tone} dot>
              {badge.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* ---- The record ---- */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 sm:grid-cols-3">
        <DetailRow label="SKU" value={product.sku || EMPTY} />
        {/* sp-num: the tabular figures the inventory row uses for barcodes. */}
        <DetailRow
          label="Barcode"
          value={product.barcode ? <span className="sp-num">{product.barcode}</span> : EMPTY}
        />
        {/* The shop's own label, resolved server-side from the slug that
            `products.category` actually stores. */}
        <DetailRow label="Category" value={categoryName} />
        <DetailRow label="Brand" value={product.brand || EMPTY} />
        <DetailRow label="Price" value={formatCurrency(product.unit_price)} />
        <DetailRow label="Unit" value={product.unit} />
        <DetailRow
          label="Current stock"
          value={
            <span
              className={
                product.stock <= product.low_stock_threshold
                  ? 'font-semibold text-danger'
                  : 'font-semibold'
              }
            >
              {product.stock} {product.unit}
            </span>
          }
        />
        <DetailRow label="Min stock" value={`${product.low_stock_threshold} ${product.unit}`} />
        {/* DERIVED, and the only derived money in this dialog — there is no
            `inventory_value` column and none was added. It is `stock ×
            unit_price` from the two columns shown directly above and beside
            it, so a reader can check the arithmetic against the same panel.

            Placed here rather than beside Price so the three stock figures —
            how many, the floor, what they are worth — read as one group.

            `formatCurrency` does the rounding, and that matters: 23 × 1.1 is
            25.300000000000004 in IEEE-754, and Intl's two-decimal formatting
            is what turns it into ₹25.30. Rounding the product by hand first
            would add a second place where this currency's precision is
            decided, and lib/format.ts exists to keep that in one file. */}
        <DetailRow
          label="Inventory value"
          value={formatCurrency(product.stock * product.unit_price)}
        />
        <DetailRow
          label="Next expiry"
          value={
            soonest ? (
              <ExpiryText date={soonest} today={today} warningDays={warningDays} />
            ) : (
              // Not a warning colour, and not blank: most of what a kirana
              // shop sells never expires, and an unexpiring product must be
              // distinguishable from one whose date nobody has entered.
              <span className="text-muted">No expiry date</span>
            )
          }
        />
      </dl>

      {/* ---- Lots ---- */}
      <div className="border-t border-border pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Batches / Lots{lots.length > 0 && ` (${lots.length})`}
        </h3>

        {lots.length === 0 ? (
          // A real state, not an error: a product can exist with no delivery
          // recorded against it, and its stock is then 0 by the 0016 trigger.
          <p className="mt-3 text-sm text-muted">
            No batches recorded. Stock is tracked per delivery, so this product has none on hand.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Quantity
                  </th>
                  <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Expiry
                  </th>
                  <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Received
                  </th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <tr key={lot.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4">
                      {/* A sold-out lot is kept for its history (0016). It is
                          shown muted rather than hidden — the row explains why
                          a product with batches can still read 0 in stock. */}
                      <span className={lot.quantity > 0 ? 'sp-num font-semibold' : 'sp-num text-muted'}>
                        {lot.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      {lot.expiry_date ? (
                        <ExpiryText
                          date={lot.expiry_date}
                          today={today}
                          warningDays={warningDays}
                          // A lot with nothing left in it is not urgent, so it
                          // is never coloured. Same rule as `nextExpiry`, which
                          // skips empty lots entirely.
                          muted={lot.quantity <= 0}
                        />
                      ) : (
                        EMPTY
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-strong">{formatExpiry(lot.received_on)}</td>
                    <td className="py-2.5 text-muted">{lot.note || EMPTY}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A date plus how long until it, toned by the SHOP's window.
 *
 * `warningDays` is threaded in from the server rather than defaulted, for the
 * reason `lib/expiry.ts` records: a store that moved the setting off 7 would
 * otherwise see this dialog and the inventory list disagree about the same lot.
 */
function ExpiryText({
  date,
  today,
  warningDays,
  muted = false,
}: {
  date: string
  today: string
  warningDays: number
  muted?: boolean
}) {
  const tone = expiryTone(date, today, warningDays)
  const colour = muted
    ? 'text-muted'
    : tone === 'expired'
      ? 'font-semibold text-danger'
      : tone === 'soon'
        ? 'font-semibold text-warning'
        : 'text-foreground'

  return (
    <span className={colour}>
      {formatExpiry(date)}
      <span className="text-muted"> · {expiryRelative(date, today)}</span>
    </span>
  )
}
