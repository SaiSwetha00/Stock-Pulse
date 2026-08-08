'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { saveProduct } from '@/app/(dashboard)/inventory/actions'
import { validateProduct, type ProductErrors, type ProductInput } from '@/lib/validation/product'
import ProductImageUpload from './ProductImageUpload'
import type { Category, Product } from '@/types'
import { CATEGORY_LABELS } from '@/types'

const CATEGORIES: Category[] = ['produce', 'dairy', 'packaged', 'beverages', 'household']

export default function ProductModal({
  product,
  storeId,
  onClose,
  onSaved,
}: {
  /** Only the Storage path prefix. Not a permission — migration 0009's
   *  policies re-check it against current_store_id(). */
  storeId: string
  // storeId is intentionally absent: the Server Action reads it from the
  // session, so the browser can no longer choose which store it writes to.
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [category, setCategory] = useState<Category>(product?.category ?? 'produce')
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
    const found = validateProduct(input)
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

          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select
                {...p}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

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
