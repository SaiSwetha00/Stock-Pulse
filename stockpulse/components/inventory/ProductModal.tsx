'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import ExpiryTag from '@/components/ui/ExpiryTag'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { saveProduct } from '@/app/(dashboard)/inventory/actions'
import {
  MAX_LOTS,
  totalLotQuantity,
  validateProduct,
  type LotInput,
  type ProductErrors,
  type ProductInput,
} from '@/lib/validation/product'
import ProductImageUpload from './ProductImageUpload'
import type { Product } from '@/types'
import type { CategoryOption } from '@/lib/categories'

// The local `CATEGORIES` array was here — a duplicate of the one in
// lib/validation/product.ts, so the form and its validator each held their own
// copy of the same five slugs. Both are gone; the list arrives as a prop from
// the page, which reads it from the store's own rows.

/**
 * A lot row as the form holds it. `key` is React's, not the database's: a new
 * row has no id yet, and keying on the array index makes React reuse the wrong
 * input when a row above it is removed — the classic symptom being a date
 * jumping up one row while the cursor stays put.
 */
type LotRow = LotInput & { key: string }

const BLANK_LOT = (key: string): LotRow => ({ key, quantity: '', expiryDate: '' })

/**
 * Existing lots, earliest expiry first, undated last.
 *
 * That order is the reading order of the question the section answers — what
 * goes off next — and it matches how the list column sorts, so the same
 * product does not present its lots in two different orders on two screens.
 *
 * A product with no lots still gets one blank row: the form has to offer
 * somewhere to type, and a blank row stores nothing (see `meaningfulLots`).
 */
function initialLots(product: Product | null): LotRow[] {
  const rows = (product?.product_batches ?? [])
    .slice()
    .sort((a, b) => {
      if (a.expiry_date === b.expiry_date) return a.created_at < b.created_at ? -1 : 1
      if (!a.expiry_date) return 1
      if (!b.expiry_date) return -1
      return a.expiry_date < b.expiry_date ? -1 : 1
    })
    .map((b) => ({
      key: b.id,
      id: b.id,
      quantity: String(b.quantity),
      expiryDate: b.expiry_date ?? '',
    }))
  return rows.length > 0 ? rows : [BLANK_LOT('lot-0')]
}

export default function ProductModal({
  product,
  storeId,
  categories,
  /**
   * Seeds the Barcode field when CREATING, so a scan that matched nothing
   * lands in the form with the digits already there.
   *
   * Ignored when editing: `product.barcode` is the row's own value and must
   * win, or a scan that resolved to a product could overwrite that product's
   * stored barcode with whatever was last held up to the camera.
   */
  initialBarcode,
  today,
  expiryWarningDays,
  onClose,
  onSaved,
}: {
  /** Shop's calendar date and warning window, from the server — the modal
   *  never reads a clock, for the reason lib/expiry.ts sets out. */
  today: string
  expiryWarningDays: number
  /** Only the Storage path prefix. Not a permission — migration 0009's
   *  policies re-check it against current_store_id(). */
  storeId: string
  // storeId is intentionally absent: the Server Action reads it from the
  // session, so the browser can no longer choose which store it writes to.
  product: Product | null
  /** This store's categories, ordered. The Server Action re-reads them and
   *  re-validates against its own copy — this one is for the dropdown. */
  categories: CategoryOption[]
  /** Create mode only — see the note on the destructured prop above. */
  initialBarcode?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  // The row's own barcode wins when editing; initialBarcode only fills a
  // blank create form.
  const [barcode, setBarcode] = useState(product?.barcode ?? initialBarcode ?? '')
  // Defaults to the store's first category rather than a hardcoded 'produce',
  // which would not exist in a shop that renamed or removed it.
  const [category, setCategory] = useState<string>(
    product?.category ?? categories[0]?.slug ?? '',
  )
  const [unitPrice, setUnitPrice] = useState(product?.unit_price?.toString() ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'ea')
  const [threshold, setThreshold] = useState(product?.low_stock_threshold?.toString() ?? '10')
  // Quantity and Expiry are no longer two loose fields. They are a LOT, and a
  // product has as many as it has had deliveries — which is the whole reason
  // migration 0016 exists. `products.stock` is now the sum of these, written
  // by a trigger, never typed.
  const [lots, setLots] = useState<LotRow[]>(() => initialLots(product))
  // Monotonic, so a removed row's key is never handed to a later one.
  const nextLotKey = useRef(1)
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null)
  const router = useRouter()
  const toast = useToast()
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<ProductErrors>({})

  // useTransition keeps `saving` true for the whole Server Action round-trip
  // *including* the revalidation it triggers. The old code flipped a local
  // boolean off the moment the insert resolved and fired router.refresh()
  // without awaiting it, so the modal closed over a table that had not been
  // re-fetched yet.
  const [saving, startTransition] = useTransition()

  // Keyed by field and handed to the matching `Field`, which owns the message
  // slot, the red border and the aria wiring.

  function currentInput(): ProductInput {
    return {
      name,
      brand,
      sku,
      barcode,
      category,
      unitPrice,
      unit,
      lowStockThreshold: threshold,
      imageUrl: imageUrl ?? '',
      // `key` is presentation state and is stripped here rather than being
      // sent to a Server Action that has no use for it.
      lots: lots.map(({ quantity, expiryDate, id }) => ({ quantity, expiryDate, id })),
    }
  }

  // Derived from the FORM's rows, not from `product.product_batches`, so the
  // line answers "what is on the shelf according to what is on screen" — edit
  // a date and the tag re-tones immediately, rather than describing the row as
  // it was when the modal opened.
  const datedLots = lots.filter((l) => l.expiryDate && Number(l.quantity.trim() || '0') > 0)
  const nearestLotExpiry =
    datedLots.length > 0
      ? datedLots.reduce((a, b) => (a.expiryDate <= b.expiryDate ? a : b)).expiryDate
      : null
  const datedLotCount = datedLots.length

  function updateLot(index: number, patch: Partial<LotRow>) {
    setLots((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addLot() {
    setLots((rows) =>
      rows.length >= MAX_LOTS ? rows : [...rows, BLANK_LOT(`lot-${nextLotKey.current++}`)],
    )
  }

  /**
   * Removing the last row leaves a fresh blank one rather than an empty
   * section — but a NEW blank one, with no id. That distinction is the
   * deletion: the action matches submitted ids against the product's existing
   * lots and deletes whatever is missing, so dropping the id is how "remove
   * this lot" is expressed. Clearing the fields in place would instead have
   * saved a lot of zero, which 0016 treats as a real state.
   */
  function removeLot(index: number) {
    setLots((rows) => {
      const next = rows.filter((_, i) => i !== index)
      return next.length > 0 ? next : [BLANK_LOT(`lot-${nextLotKey.current++}`)]
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const input = currentInput()

    // Client-side pass for instant feedback; the action re-checks regardless.
    const found = validateProduct(input, categories.map((c) => c.slug))
    setErrors(found)
    if (Object.keys(found).length > 0) return

    startTransition(async () => {
      const result = await saveProduct(input, product?.id)

      if (!result.ok) {
        setErrors(result.errors ?? {})
        setError(result.message ?? 'Could not save the product.')
        // The inline banner can be scrolled out of view in this nine-field
        // form, so the outcome is announced as well as shown.
        toast.error(
          product ? 'Could not update product' : 'Could not add product',
          result.message
        )
        return
      }

      // revalidatePath clears the server cache; router.refresh() is what makes
      // the client refetch. Both are needed — verified in production, where
      // revalidatePath alone left the table stale until a manual reload.
      toast.success(product ? 'Product updated' : 'Product added', input.name)
      router.refresh()
      onSaved()
    })
  }

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose} width="lg">
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* First field: the photo is what a shopkeeper recognises a line by,
              so it is asked for before the paperwork. */}
          <ProductImageUpload storeId={storeId} value={imageUrl} onChange={setImageUrl} />

          {/* Only the failure with no field of its own stays up here. The
              per-field messages moved onto their controls: a summary list at
              the top of a nine-field form makes the reader match prose against
              inputs by eye, and left every offending box looking untouched. */}
          {error && (
            <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <Field label="Product Name" error={errors.name} required>
            {(p) => <Input {...p} required value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand" error={errors.brand}>
              {(p) => <Input {...p} value={brand} onChange={(e) => setBrand(e.target.value)} />}
            </Field>
            <Field label="SKU" error={errors.sku}>
              {(p) => <Input {...p} value={sku} onChange={(e) => setSku(e.target.value)} />}
            </Field>
          </div>

          {/* Deliberately NOT type="number". A barcode is a string of digits,
              not a quantity: type="number" strips a leading zero (UPC-A codes
              legitimately start with one), accepts "8e12", and offers spinner
              arrows on a value nobody increments. inputMode="numeric" gets the
              phone keypad — which is the keyboard actually in the shopkeeper's
              hand — without any of that. */}
          <Field
            label="Barcode"
            hint="Optional · 8-14 digits, numbers only"
            error={errors.barcode}
          >
            {(p) => (
              <Input
                {...p}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                placeholder="e.g. 8901234567895"
                className="sp-num"
              />
            )}
          </Field>

          <div>
            <Field label="Category" error={errors.category}>
              {(p) => (
                <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {/* The moment somebody discovers they need a category is the
                moment they are filling this in, and hunting for it through
                Settings is how a shopkeeper concludes the feature is not
                there. Reachable by managers as well as owners, which is why
                /settings/categories carries its own canManage() guard rather
                than living on the owner-only /settings page. */}
            <Link
              href="/settings/categories"
              className="mt-1.5 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
            >
              Manage categories
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Price ($)" error={errors.unitPrice} required>
              {(p) => (
                <Input
                  {...p}
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="sp-num"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              )}
            </Field>
            <Field label="Unit" error={errors.unit}>
              {(p) => (
                <Input
                  {...p}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="ea, lb, gal"
                />
              )}
            </Field>
            <Field label="Low Stock Threshold" error={errors.lowStockThreshold}>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min="0"
                  className="sp-num"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              )}
            </Field>
          </div>

          {/* Stock lots. Same Field/Input pattern and the same two-column
              grid the Quantity and Expiry Date fields sat in before — this is
              that pair, repeated, because a shop that took delivery twice has
              two dates and one row could only ever hold the later one. */}
          <fieldset className="rounded-xl border border-border px-4 pb-4 pt-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-strong">
              Stock &amp; Expiry
            </legend>

            <p className="mb-3 text-xs text-muted">
              One row per delivery. Leave the date blank for anything that does not expire.
            </p>

            {/* The state of what is already on the shelf, said once at the top
                in Phase 3's colour language, before the rows that let you
                change it.

                This is the payoff for the Inventory scan: a scan opens this
                modal in edit mode, and without this line the reader would have
                to compare a column of dates against today in their head to
                learn the one thing the scan was asking about. The rows below
                still carry every lot — this only names the nearest. */}
            {nearestLotExpiry !== null && (
              <p className="mb-3">
                <ExpiryTag
                  date={nearestLotExpiry}
                  today={today}
                  warningDays={expiryWarningDays}
                  lots={datedLotCount}
                />
              </p>
            )}

            {errors.lots && (
              <p role="alert" className="mb-3 text-xs font-medium text-danger">
                {errors.lots}
              </p>
            )}

            <div className="space-y-3">
              {lots.map((lot, i) => (
                <div key={lot.key} className="grid grid-cols-[1fr_1fr_auto] items-start gap-3">
                  <Field label="Quantity" error={errors.lotRows?.[i]?.quantity}>
                    {(p) => (
                      <Input
                        {...p}
                        type="number"
                        min="0"
                        className="sp-num"
                        value={lot.quantity}
                        onChange={(e) => updateLot(i, { quantity: e.target.value })}
                      />
                    )}
                  </Field>
                  {/* "(optional)" stays out of the label and in the hint slot
                      — the label should name the field, not carry
                      parenthetical instructions the hint row has a place for. */}
                  <Field label="Expiry Date" hint="Optional" error={errors.lotRows?.[i]?.expiryDate}>
                    {(p) => (
                      <Input
                        {...p}
                        type="date"
                        value={lot.expiryDate}
                        onChange={(e) => updateLot(i, { expiryDate: e.target.value })}
                      />
                    )}
                  </Field>
                  {/* Pushed down past the label so it lines up with the two
                      controls rather than with their captions. */}
                  <button
                    type="button"
                    onClick={() => removeLot(i)}
                    aria-label={`Remove lot ${i + 1}`}
                    className="tap-target mt-6 rounded-lg text-muted hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={addLot}
                disabled={lots.length >= MAX_LOTS}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add another lot
              </Button>
              {/* Stated, not typed. This is the number 0016's trigger will put
                  in products.stock, and showing it is how the reader confirms
                  the rows add up to what they expected. */}
              <p className="sp-num text-sm text-muted-strong" aria-live="polite">
                Total stock:{' '}
                <span className="font-semibold text-foreground">
                  {totalLotQuantity(currentInput())}
                </span>
              </p>
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            {/* The ladder, not two hand-rolled buttons: secondary for the way
                out, one primary for the commit. `loading` carries the saving
                state, so the label no longer swaps to "Saving…" and the
                button cannot change width mid-click. */}
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={saving}>
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
