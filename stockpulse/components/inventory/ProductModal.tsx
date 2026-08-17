'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { saveProduct } from '@/app/(dashboard)/inventory/actions'
import { validateProduct, type ProductErrors, type ProductInput } from '@/lib/validation/product'
import ProductImageUpload from './ProductImageUpload'
import type { Product } from '@/types'
import type { CategoryOption } from '@/lib/categories'

// The local `CATEGORIES` array was here — a duplicate of the one in
// lib/validation/product.ts, so the form and its validator each held their own
// copy of the same five slugs. Both are gone; the list arrives as a prop from
// the page, which reads it from the store's own rows.

export default function ProductModal({
  product,
  storeId,
  categories,
  onClose,
  onSaved,
}: {
  /** Only the Storage path prefix. Not a permission — migration 0009's
   *  policies re-check it against current_store_id(). */
  storeId: string
  // storeId is intentionally absent: the Server Action reads it from the
  // session, so the browser can no longer choose which store it writes to.
  product: Product | null
  /** This store's categories, ordered. The Server Action re-reads them and
   *  re-validates against its own copy — this one is for the dropdown. */
  categories: CategoryOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  // Defaults to the store's first category rather than a hardcoded 'produce',
  // which would not exist in a shop that renamed or removed it.
  const [category, setCategory] = useState<string>(
    product?.category ?? categories[0]?.slug ?? '',
  )
  const [unitPrice, setUnitPrice] = useState(product?.unit_price?.toString() ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'ea')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '')
  const [threshold, setThreshold] = useState(product?.low_stock_threshold?.toString() ?? '10')
  const [expiryDate, setExpiryDate] = useState(product?.expiry_date ?? '')
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
      stock,
      lowStockThreshold: threshold,
      expiryDate,
      imageUrl: imageUrl ?? '',
    }
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
            <Field label="Quantity" error={errors.stock} required>
              {(p) => (
                <Input
                  {...p}
                  required
                  type="number"
                  min="0"
                  className="sp-num"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            {/* "(optional)" moves out of the label and into the hint slot —
                the label should name the field, not carry parenthetical
                instructions the hint row already has a place for. */}
            <Field label="Expiry Date" hint="Optional" error={errors.expiryDate}>
              {(p) => (
                <Input
                  {...p}
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              )}
            </Field>
          </div>

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
