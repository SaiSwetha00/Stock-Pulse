'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isOptimizableImage } from '@/lib/images'
import Modal from '@/components/ui/Modal'
import ImageAdjuster, { type AdjustedImage } from '@/components/ui/ImageAdjuster'

/** Mirrors the bucket's limits in 0009. Checked here so the user gets a
 *  sentence rather than a 413, and there so the browser is not the boundary. */
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'product-images'

/**
 * Product photo picker for the add/edit product form.
 *
 * Framing goes through the same ImageAdjuster the profile photo uses, so the
 * two behave identically and there is one crop implementation to maintain.
 *
 * `storeId` arrives as a prop, which looks like the browser choosing which
 * store to write to. It is not: the 0009 policies require the first path
 * segment to equal `current_store_id()`, so a forged value fails at the
 * database. The prop is a convenience, not a permission.
 */
export default function ProductImageUpload({
  storeId,
  value,
  onChange,
}: {
  storeId: string
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Storage path from a public URL, or null if this is not one of ours. */
  function pathFromUrl(url: string | null): string | null {
    if (!url) return null
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const i = url.indexOf(marker)
    if (i === -1) return null
    return url.slice(i + marker.length).split('?')[0]
  }

  function handleFile(file: File) {
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('Choose a JPEG, PNG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`)
      return
    }
    setPending(file)
  }

  async function handleAdjusted({ blob }: AdjustedImage) {
    setPending(null)
    setBusy(true)
    const supabase = createClient()

    // A fresh key per upload. It cannot be the product id, because an image
    // can be chosen while creating a product, before any id exists.
    const previous = pathFromUrl(value)
    const path = `${storeId}/${crypto.randomUUID()}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      // Always WebP — ImageAdjuster re-encodes, so the camera's format is
      // irrelevant by this point.
      .upload(path, blob, { contentType: 'image/webp' })

    if (uploadError) {
      setBusy(false)
      setError(
        uploadError.message.toLowerCase().includes('bucket')
          ? 'Product image storage is not set up yet. Apply migration 0009, then try again.'
          : `Upload failed: ${uploadError.message}`,
      )
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)

    // The old object goes only after the new one is safely stored. The reverse
    // order risks deleting the only copy if the upload then fails.
    if (previous) await supabase.storage.from(BUCKET).remove([previous])

    onChange(publicUrl)
    setBusy(false)
  }

  async function handleRemove() {
    setError(null)
    setBusy(true)
    const path = pathFromUrl(value)
    if (path) {
      const supabase = createClient()
      // Delete the object, not just the column — otherwise the photo stays
      // readable at a public URL after someone asked for it to be gone.
      await supabase.storage.from(BUCKET).remove([path])
    }
    onChange(null)
    setBusy(false)
  }

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
        Product Photo
      </p>

      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
          {isOptimizableImage(value) ? (
            <Image src={value} alt="" width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Cleared first: choosing the same file twice fires no change
              // event otherwise, so a failed upload could not be retried.
              e.target.value = ''
              if (file) handleFile(file)
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="control-h-sm inline-flex items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-strong hover:bg-surface-muted disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {value ? 'Replace' : 'Add photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="control-h-sm inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-danger hover:bg-danger-bg disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">JPEG, PNG or WebP. Up to 2 MB.</p>

      {pending && (
        <Modal title="Adjust the photo" onClose={() => setPending(null)} width="sm">
          <div className="px-6 py-5">
            <ImageAdjuster
              file={pending}
              outputSize={512}
              onCancel={() => setPending(null)}
              onConfirm={handleAdjusted}
              confirmLabel="Use image"
            />
          </div>
        </Modal>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
