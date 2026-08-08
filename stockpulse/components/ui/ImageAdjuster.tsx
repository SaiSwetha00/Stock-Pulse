'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * Square crop + zoom, shared by the profile photo and product images.
 *
 * Before this, whatever file you picked was uploaded verbatim: a 4:3 phone
 * photo became a squashed avatar and there was no way to say which part of it
 * mattered. Now you frame it first.
 *
 * Output is always a square WebP. The re-encode is not incidental — a 4MB
 * camera JPEG lands around 40KB at 512px, which is what stops the bucket's 2MB
 * ceiling from ever being the thing a shopkeeper has to argue with.
 */

/** CSS size of the framing viewport. Output size is independent of this. */
const VIEWPORT = 288
const MIN_ZOOM = 1
const MAX_ZOOM = 4

export type AdjustedImage = { blob: Blob; previewUrl: string }

export default function ImageAdjuster({
  file,
  outputSize = 512,
  quality = 0.85,
  onCancel,
  onConfirm,
  confirmLabel = 'Use photo',
}: {
  file: File
  /** Square edge of the produced image, in device pixels. */
  outputSize?: number
  quality?: number
  onCancel: () => void
  onConfirm: (result: AdjustedImage) => void
  confirmLabel?: string
}) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  /**
   * Raw, unclamped drag offset. The value actually used is derived below —
   * storing the clamped value would need an effect to re-clamp on zoom, and a
   * setState inside an effect is both a lint error here and a cascading
   * render. Deriving keeps one source of truth.
   */
  const [rawPan, setPan] = useState({ x: 0, y: 0 })
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  // Created during render rather than in an effect, so there is no frame where
  // src is null and no setState inside an effect. The effect only revokes:
  // object URLs are a manual resource and would otherwise stay resident for
  // the life of the document.
  const src = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(src), [src])

  /**
   * Scale at which the image exactly covers the square. Everything else is a
   * multiple of this, so zoom 1 always means "no gaps" whether the source is
   * portrait, landscape or already square.
   */
  const baseScale = natural ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) : 1
  const scale = baseScale * zoom
  const drawnW = natural ? natural.w * scale : 0
  const drawnH = natural ? natural.h * scale : 0

  /**
   * Pan is clamped so the frame can never show empty space: the limit is half
   * the overhang on each axis, and an axis with no overhang is pinned.
   */
  const clamp = useCallback(
    (p: { x: number; y: number }) => {
      const limitX = Math.max(0, (drawnW - VIEWPORT) / 2)
      const limitY = Math.max(0, (drawnH - VIEWPORT) / 2)
      return {
        x: Math.min(limitX, Math.max(-limitX, p.x)),
        y: Math.min(limitY, Math.max(-limitY, p.y)),
      }
    },
    [drawnW, drawnH],
  )

  // Derived, not stored. Zooming out therefore re-frames immediately instead
  // of leaving the image parked off-centre with a gap at one edge.
  const pan = clamp(rawPan)

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    setPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) })
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  /**
   * Renders exactly what the frame shows.
   *
   * The on-screen transform and the canvas draw use the same numbers scaled by
   * outputSize/VIEWPORT. That is what makes the preview honest: there is only
   * one calculation, so the two cannot drift.
   */
  const confirm = useCallback(async () => {
    const img = imgRef.current
    if (!img || !natural) return
    setWorking(true)
    setError(null)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is unavailable in this browser.')

      const ratio = outputSize / VIEWPORT
      const offsetX = (VIEWPORT - drawnW) / 2 + pan.x
      const offsetY = (VIEWPORT - drawnH) / 2 + pan.y

      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, offsetX * ratio, offsetY * ratio, drawnW * ratio, drawnH * ratio)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      )
      if (!blob) throw new Error('Could not process that image.')

      onConfirm({ blob, previewUrl: canvas.toDataURL('image/webp', quality) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that image.')
      setWorking(false)
    }
  }, [natural, drawnW, drawnH, pan, outputSize, quality, onConfirm])

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto touch-none overflow-hidden rounded-xl bg-surface-muted"
        style={{ width: VIEWPORT, height: VIEWPORT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {src && (
          /* eslint-disable-next-line @next/next/no-img-element -- a local
             object URL being measured and drawn to canvas. next/image would
             add an optimizer round trip and hide naturalWidth/naturalHeight,
             which the crop maths needs. */
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) =>
              setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
            style={{
              position: 'absolute',
              left: (VIEWPORT - drawnW) / 2 + pan.x,
              top: (VIEWPORT - drawnH) / 2 + pan.y,
              width: drawnW,
              height: drawnH,
              maxWidth: 'none',
              cursor: 'grab',
            }}
          />
        )}

        {/* Framing guides. pointer-events-none so the whole square stays
            draggable, including under the guide lines. */}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-border-strong" />
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-surface" />
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted">Drag to reposition</p>

      <div className="flex items-center gap-3">
        <ZoomOut className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-accent"
        />
        <ZoomIn className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={working}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={working || !natural}>
          {working && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
