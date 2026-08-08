'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
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

  // Rendered as a list in the alert. The fields in this form are hand-rolled
  // rather than using the Field primitive, so there is no per-input slot to
  // hang messages off without restyling the whole modal.
  const fieldErrors = Object.entries(errors) as [keyof ProductErrors, string][]

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

          {(error || fieldErrors.length > 0) && (
            <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
              {error}
              {fieldErrors.length > 0 && (
                <ul className={error ? 'mt-1.5 list-disc pl-4' : 'list-disc pl-4'}>
                  {fieldErrors.map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              Product Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Brand
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                SKU
              </label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Price ($)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Unit
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ea, lb, gal"
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Quantity
              </label>
              <input
                required
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Expiry Date (optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="control-h flex-1 rounded-lg border border-border text-sm font-semibold text-muted-strong hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="control-h flex-1 rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
