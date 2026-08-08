'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isOptimizableImage } from '@/lib/images'
import Modal from '@/components/ui/Modal'
import ImageAdjuster, { type AdjustedImage } from '@/components/ui/ImageAdjuster'

/**
 * Mirrors the bucket's own limits in 0008. Checked here so the user gets a
 * sentence rather than a 413, and there so the browser is not the boundary.
 */
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function AvatarUpload({
  userId,
  fullName,
  value,
  onChange,
}: {
  userId: string
  fullName: string
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The chosen file, held while the crop dialog is open. Nothing is uploaded
  // until the user has framed it and confirmed.
  const [pending, setPending] = useState<File | null>(null)

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

    // Framing happens before anything leaves the browser.
    setPending(file)
  }

  async function handleAdjusted({ blob }: AdjustedImage) {
    setPending(null)
    setBusy(true)
    const supabase = createClient()

    // One object per person, overwritten in place. A unique filename per
    // upload would orphan every previous photo in the bucket, with nothing
    // pointing at them and no cleanup job to find them.
    const path = `${userId}/avatar`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      // Always WebP: ImageAdjuster re-encodes, so whatever the camera
      // produced is irrelevant by this point.
      .upload(path, blob, { upsert: true, contentType: 'image/webp' })

    if (uploadError) {
      setBusy(false)
      setError(
        uploadError.message.toLowerCase().includes('bucket')
          ? 'Photo storage is not set up yet. Apply migration 0008, then try again.'
          : `Upload failed: ${uploadError.message}`,
      )
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    // The path never changes, so without a cache-buster the browser would
    // keep serving the previous photo indefinitely.
    onChange(`${publicUrl}?v=${Date.now()}`)
    setBusy(false)
  }

  async function handleRemove() {
    setError(null)
    setBusy(true)
    const supabase = createClient()
    // Remove the object as well as clearing the column. Clearing only the
    // column would leave the file readable at a public URL after the user
    // asked for it to be gone.
    await supabase.storage.from('avatars').remove([`${userId}/avatar`])
    onChange(null)
    setBusy(false)
  }

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
        Profile Photo
      </p>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          {isOptimizableImage(value) ? (
            <Image
              src={value}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
              // A freshly uploaded photo sits behind a path that has not
              // changed, and the optimizer would keep serving the old one.
              unoptimized={value.includes('?v=')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
              {fullName.slice(0, 2).toUpperCase()}
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
              // Cleared first: picking the same file twice in a row fires no
              // change event otherwise, so a failed upload could not be
              // retried without choosing a different image.
              e.target.value = ''
              if (file) void handleFile(file)
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
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {value ? 'Replace' : 'Upload photo'}
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
        <Modal title="Adjust your photo" onClose={() => setPending(null)} width="sm">
          <div className="px-6 py-5">
            <ImageAdjuster
              file={pending}
              outputSize={512}
              onCancel={() => setPending(null)}
              onConfirm={handleAdjusted}
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
