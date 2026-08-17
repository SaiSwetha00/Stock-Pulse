'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, ScanLine, TriangleAlert, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { decodeFrame, loadDecoder, type ScanOutcome } from '@/lib/barcode/decoder'

/**
 * PHASE 2 PROTOTYPE. Camera in, decoded string on screen, and nothing else.
 *
 * It deliberately does not look the code up, does not touch the database, and
 * is not reachable from the sidebar. Phases 3 and 4 wire it into Inventory and
 * Sales; until then the only thing this proves is that a phone camera can read
 * a barcode in this app, on this device.
 */

/**
 * Why the camera can be unavailable, and what to say about it.
 *
 * Every branch is a message a shopkeeper can act on. The failure this exists
 * to prevent is a black rectangle that never explains itself — what a bare
 * `catch { setActive(false) }` produces, and which reads as "the app is
 * broken" rather than "I tapped Block three weeks ago".
 */
type CameraFault =
  | { kind: 'denied' }
  | { kind: 'no-camera' }
  | { kind: 'in-use' }
  | { kind: 'insecure' }
  | { kind: 'unsupported' }
  | { kind: 'other'; detail: string }

const FAULT_COPY: Record<CameraFault['kind'], { title: string; body: string }> = {
  denied: {
    title: 'Camera permission was refused',
    // Names the actual remedy, because the browser will not ask again once it
    // has been refused — waiting for another prompt is a dead end.
    body:
      'Your browser is blocking the camera for this site. Open the padlock or camera icon in the address bar, set Camera to Allow, then reload this page. On iPhone: Settings → Safari → Camera → Allow.',
  },
  'no-camera': {
    title: 'No camera found',
    body:
      'This device has no camera the browser can reach. If you are on a desktop, try again on a phone or tablet, or plug in a webcam and reload.',
  },
  'in-use': {
    title: 'The camera is busy',
    body:
      'Another app or browser tab already has the camera. Close it — video calls are the usual culprit — and try again.',
  },
  insecure: {
    title: 'Camera needs a secure connection',
    body:
      'Browsers only allow camera access over HTTPS (or on localhost). Open this page over https:// and try again.',
  },
  unsupported: {
    title: 'This browser cannot open a camera',
    body:
      'The browser does not support camera capture from a web page. Try the current version of Safari, Chrome, Edge or Firefox.',
  },
  other: { title: 'The camera could not be started', body: '' },
}

/** DOMException names are the only reliable signal; messages are localised. */
function classifyCameraError(err: unknown): CameraFault {
  const name = (err as { name?: string })?.name ?? ''
  const detail = (err as { message?: string })?.message ?? String(err)

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return { kind: 'denied' }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    // Raised when no device satisfies the constraints. With `facingMode`
    // advisory rather than required (see start()) this effectively means "no
    // camera at all", so it shares that message.
    case 'OverconstrainedError':
      return { kind: 'no-camera' }
    case 'NotReadableError':
    case 'TrackStartError':
      return { kind: 'in-use' }
    case 'SecurityError':
      return { kind: 'insecure' }
    default:
      return { kind: 'other', detail }
  }
}

/** How often to sample the video. ~8 fps is more than a human needs to hold a
 *  barcode still, and leaves the main thread free between frames. */
const SAMPLE_MS = 120

/** Frames are downscaled before decoding: a 1080p frame costs far more to scan
 *  than it adds in accuracy for a barcode filling most of the view. */
const DECODE_WIDTH = 640

export default function ScannerPrototype() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [running, setRunning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [fault, setFault] = useState<CameraFault | null>(null)
  const [outcome, setOutcome] = useState<ScanOutcome>({ kind: 'none' })
  const [lastProduct, setLastProduct] = useState<{ value: string; format: string; at: string } | null>(null)
  const [frames, setFrames] = useState(0)
  const [decoderError, setDecoderError] = useState<string | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Stopping every track is what actually turns the camera light off. A
    // paused <video> keeps the device open, which looks like spyware to anyone
    // watching the indicator.
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setRunning(false)
    setOutcome({ kind: 'none' })
  }, [])

  // Release the camera when the component goes away, however it goes away.
  useEffect(() => stop, [stop])

  /** One sampled frame: video -> canvas -> ImageData -> decoder. */
  const tick = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    // Never let two decodes overlap. Without this a slow frame queues another
    // behind it and the backlog grows until the tab stalls.
    if (busyRef.current) return
    busyRef.current = true

    try {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const scale = Math.min(1, DECODE_WIDTH / vw)
      const w = Math.round(vw * scale)
      const h = Math.round(vh * scale)
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, 0, 0, w, h)

      const result = await decodeFrame(ctx.getImageData(0, 0, w, h))
      setFrames((n) => n + 1)
      setOutcome(result)
      if (result.kind === 'product') {
        setLastProduct({
          value: result.value,
          format: result.format,
          at: new Date().toLocaleTimeString(),
        })
      }
    } catch (err) {
      setDecoderError(err instanceof Error ? err.message : String(err))
    } finally {
      busyRef.current = false
    }
  }, [])

  const start = useCallback(async () => {
    setFault(null)
    setDecoderError(null)
    setStarting(true)
    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setFault({ kind: 'insecure' })
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setFault({ kind: 'unsupported' })
        return
      }

      // `facingMode: environment` as a PREFERENCE, not a requirement: as an
      // exact constraint it throws OverconstrainedError on every laptop, which
      // would report "no camera" about a machine that plainly has one.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      video.srcObject = stream
      await video.play()

      // Fetch the decoder now rather than on the first frame, so the 1 MB wasm
      // downloads while the user is still aiming.
      loadDecoder().catch((e) => setDecoderError(e instanceof Error ? e.message : String(e)))

      setRunning(true)
      timerRef.current = setInterval(tick, SAMPLE_MS)
    } catch (err) {
      setFault(classifyCameraError(err))
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    } finally {
      setStarting(false)
    }
  }, [tick])

  return (
    <div className="space-y-6">
      {/* The viewfinder */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="relative aspect-video w-full bg-black">
          {/* playsInline is not optional: without it iOS Safari takes the video
              fullscreen and the surrounding UI disappears. muted is required
              for autoplay to be permitted at all. */}
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

          {!running && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="space-y-2">
                <Camera className="mx-auto h-8 w-8 text-white/70" aria-hidden="true" />
                <p className="text-sm text-white/70">
                  {starting ? 'Asking for camera access…' : 'The camera is off.'}
                </p>
              </div>
            </div>
          )}

          {running && (
            <>
              {/* A reticle, so it is obvious where to hold the barcode. */}
              <div
                className="pointer-events-none absolute inset-x-[12%] inset-y-[28%] rounded-xl border-2 border-white/70"
                aria-hidden="true"
              />
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                Scanning
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
          {running ? (
            <Button variant="secondary" onClick={stop}>
              <CameraOff className="h-4 w-4" aria-hidden="true" />
              Stop camera
            </Button>
          ) : (
            <Button onClick={start} disabled={starting}>
              <Camera className="h-4 w-4" aria-hidden="true" />
              {starting ? 'Starting…' : 'Start camera'}
            </Button>
          )}
          {running && (
            <p className="text-xs text-muted">
              {frames} frame{frames === 1 ? '' : 's'} checked
            </p>
          )}
        </div>
      </div>

      {/* Camera faults — never a silent failure */}
      {fault && (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-border bg-danger-bg p-4 text-danger"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">{FAULT_COPY[fault.kind].title}</p>
            <p className="text-sm">
              {fault.kind === 'other'
                ? `${FAULT_COPY.other.title}. ${fault.detail}`
                : FAULT_COPY[fault.kind].body}
            </p>
          </div>
        </div>
      )}

      {decoderError && (
        <div role="alert" className="rounded-2xl border border-border bg-danger-bg p-4 text-danger">
          <p className="font-semibold">The decoder could not be loaded</p>
          <p className="text-sm">{decoderError}</p>
        </div>
      )}

      {/* Live status — the three outcomes must look different */}
      {running && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm" aria-live="polite">
          {outcome.kind === 'none' && (
            <p className="text-sm text-muted">
              Looking for a barcode… hold it inside the frame, filling most of the width.
            </p>
          )}

          {outcome.kind === 'unsupported-symbology' && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                That is a {outcome.format}, not a product barcode
              </p>
              <p className="text-sm text-muted">
                It scanned cleanly — the code just is not a retail barcode. It reads:{' '}
                <span className="sp-num break-all">{outcome.text}</span>
              </p>
            </div>
          )}

          {outcome.kind === 'product' && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Barcode detected</p>
              <p className="sp-num text-2xl font-semibold tracking-wide text-foreground">
                {outcome.value}
              </p>
              <p className="text-xs text-muted">{outcome.format}</p>
            </div>
          )}
        </div>
      )}

      {/* Last successful read, kept after the code leaves the frame */}
      {lastProduct && (
        <div className="rounded-2xl border border-border bg-surface-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Last decoded value
              </p>
              <p className="sp-num text-xl font-semibold text-foreground">{lastProduct.value}</p>
              <p className="text-xs text-muted">
                {lastProduct.format} · {lastProduct.at}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLastProduct(null)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
              aria-label="Clear the last decoded value"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Nothing was saved. This prototype only reads the code — matching it to a product comes
            in a later phase.
          </p>
        </div>
      )}
    </div>
  )
}
