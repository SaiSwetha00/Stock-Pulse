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
type CameraFaultKind =
  | 'denied'
  | 'no-camera'
  | 'in-use'
  | 'insecure'
  | 'unsupported'
  | 'iframe'
  | 'other'

/**
 * `raw` carries the underlying DOMException name and message, ALWAYS — not
 * just for the unclassified case.
 *
 * That is here because of a real bug this file shipped with: an Android Chrome
 * user saw "Camera permission was refused" while the camera permission was
 * granted, and the friendly copy gave neither of us anything to work with.
 * Whatever the message says, the actual error name is now on screen under it.
 */
type CameraFault = { kind: CameraFaultKind; raw?: string }

const FAULT_COPY: Record<CameraFaultKind, { title: string; body: string }> = {
  denied: {
    title: 'Camera permission was refused',
    // Names the actual remedy, because the browser will not ask again once it
    // has been refused — waiting for another prompt is a dead end.
    //
    // Both layers are named on purpose. Android has TWO separate permissions
    // and granting one does not grant the other: the OS permission for the
    // Chrome app, and Chrome's own per-site permission for this origin. A user
    // who has checked the first and been told "your browser is blocking the
    // camera" has been sent to the wrong place.
    body:
      'This is set in two independent places, and both must allow it. In Chrome or Safari, tap the padlock or the icon at the left of the address bar and set Camera to Allow, then reload. Separately, on Android check Settings → Apps → Chrome → Permissions → Camera; on iPhone, Settings → Safari → Camera.',
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
  iframe: {
    title: 'Camera blocked inside an embedded frame',
    body:
      'This page is running inside an iframe that has not been given camera permission. Open it in its own tab, or the embedding page needs allow="camera" on the iframe.',
  },
  other: {
    title: 'The camera could not be started',
    body: 'The browser refused the camera for a reason it did not classify. The exact error is shown below.',
  },
}

/**
 * DOMException names are the only reliable signal; messages are localised.
 *
 * IMPORTANT: only ever call this with an error from `getUserMedia`. It used to
 * receive anything thrown anywhere in the start sequence, including
 * `video.play()` — and `play()` rejects with `NotAllowedError` under the
 * autoplay policy, which this function then reported as a refused camera
 * permission. That was the Android Chrome bug.
 */
function classifyCameraError(err: unknown): CameraFault {
  const name = (err as { name?: string })?.name ?? ''
  const message = (err as { message?: string })?.message ?? String(err)
  const raw = name ? `${name}: ${message}` : message

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      // Chrome uses NotAllowedError for a frame-policy block too, and the
      // remedy is completely different, so separate them on the message.
      return /permissions policy|feature policy|disallowed by/i.test(message)
        ? { kind: 'iframe', raw }
        : { kind: 'denied', raw }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    // Raised when no device satisfies the constraints. With `facingMode`
    // advisory rather than required (see start()) this effectively means "no
    // camera at all", so it shares that message.
    case 'OverconstrainedError':
      return { kind: 'no-camera', raw }
    case 'NotReadableError':
    case 'TrackStartError':
      return { kind: 'in-use', raw }
    case 'SecurityError':
      return { kind: 'insecure', raw }
    default:
      return { kind: 'other', raw }
  }
}

/**
 * What the environment looks like, gathered before the camera is touched.
 *
 * A prototype being debugged on somebody else's phone needs this: without it
 * the only evidence available is a sentence I wrote, and that sentence was
 * wrong. Rendered in a collapsed block so it costs nothing in normal use.
 */
type Diagnostics = {
  secure: boolean
  protocol: string
  host: string
  inIframe: boolean
  hasMediaDevices: boolean
  /** Permissions API state, or why it could not be read. Safari has no
   *  'camera' descriptor, so 'unsupported' is a normal answer, not a fault. */
  permission: string
  videoInputs: string
  userAgent: string
}

async function collectDiagnostics(): Promise<Diagnostics> {
  const d: Diagnostics = {
    secure: typeof window !== 'undefined' && window.isSecureContext,
    protocol: typeof location !== 'undefined' ? location.protocol : '?',
    host: typeof location !== 'undefined' ? location.host : '?',
    inIframe: typeof window !== 'undefined' && window.self !== window.top,
    hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    permission: 'unread',
    videoInputs: 'unread',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '?',
  }

  try {
    // Not supported everywhere, and the descriptor name is not standard on
    // Safari — hence the try. A throw here says nothing about the camera.
    const status = await navigator.permissions?.query({
      name: 'camera' as PermissionName,
    })
    d.permission = status?.state ?? 'unsupported'
  } catch {
    d.permission = 'unsupported'
  }

  try {
    // Before permission is granted the labels are blank and, on some browsers,
    // the list is empty — so a 0 here is not proof there is no camera. Counted
    // anyway because a non-zero count rules the question out entirely.
    const devices = await navigator.mediaDevices?.enumerateDevices()
    const cams = (devices ?? []).filter((x) => x.kind === 'videoinput')
    d.videoInputs = `${cams.length}`
  } catch (e) {
    d.videoInputs = `error: ${(e as Error)?.name ?? 'unknown'}`
  }

  return d
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
  /** A rejected video.play(). Recorded, not fatal — see start(). */
  const [videoWarning, setVideoWarning] = useState<string | null>(null)
  const [diag, setDiag] = useState<Diagnostics | null>(null)
  /** Sampled from the element so "is video actually flowing?" is answerable
   *  without a debugger on somebody else's phone. */
  const [videoState, setVideoState] = useState('')

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

  /**
   * Force `muted` on the element itself, in addition to the JSX prop.
   *
   * React sets `muted` as a property and does not reliably reflect it to the
   * HTML attribute — a long-standing, well-documented gap. Chrome's autoplay
   * policy inspects the element's muted state, so an unreflected attribute is
   * one of the ways `play()` comes back with NotAllowedError even though the
   * stream carries no audio track at all (`audio: false` above).
   *
   * Belt and braces: cheap, and it removes one candidate cause rather than
   * leaving it to be argued about.
   */
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.defaultMuted = true
    }
  }, [])

  /** One sampled frame: video -> canvas -> ImageData -> decoder. */
  const tick = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Recorded BEFORE the readyState gate, so a feed that never starts is
    // visible as "readyState 0, 0x0" rather than as silence. A loop that
    // returns early without saying so is how "the camera does not work"
    // becomes unanswerable.
    setVideoState(
      `readyState ${video.readyState} · ${video.videoWidth}x${video.videoHeight} · ${video.paused ? 'paused' : 'playing'}`,
    )
    if (video.readyState < 2) return
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
    setVideoWarning(null)
    setStarting(true)

    // Collected before anything is attempted, so the panel describes the
    // environment even when the camera call fails instantly.
    collectDiagnostics().then(setDiag)

    // ---------------------------------------------------------------------
    // Preflight. These are facts about the page, not camera errors.
    // ---------------------------------------------------------------------
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setFault({ kind: 'insecure', raw: `protocol ${location.protocol}, host ${location.host}` })
      setStarting(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setFault({
        kind: 'unsupported',
        raw: `navigator.mediaDevices ${navigator.mediaDevices ? 'present without getUserMedia' : 'undefined'}`,
      })
      setStarting(false)
      return
    }

    // ---------------------------------------------------------------------
    // The camera request. THIS try/catch wraps getUserMedia and NOTHING else.
    // ---------------------------------------------------------------------
    // The bug this replaces: getUserMedia and video.play() shared one try, and
    // one catch ran both through classifyCameraError. play() rejects with
    // NotAllowedError under the autoplay policy — and on Android Chrome the
    // await above consumes the user activation from the tap, so play() is
    // treated as an unprivileged autoplay attempt. A working camera therefore
    // reported "Camera permission was refused".
    //
    // Only a getUserMedia rejection may ever produce a permission message.
    let stream: MediaStream
    try {
      // `facingMode: environment` as a PREFERENCE, not a requirement: as an
      // exact constraint it throws OverconstrainedError on every laptop, which
      // would report "no camera" about a machine that plainly has one.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
    } catch (err) {
      setFault(classifyCameraError(err))
      setStarting(false)
      collectDiagnostics().then(setDiag)
      return
    }

    // From here on the camera IS open. Nothing below may report a permission
    // problem, and nothing below may leave the track running on the way out.
    streamRef.current = stream
    const video = videoRef.current
    if (!video) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStarting(false)
      return
    }

    video.srcObject = stream

    // ---------------------------------------------------------------------
    // Playback. Non-fatal by design.
    // ---------------------------------------------------------------------
    // A rejected play() does not mean no video: the element is already bound
    // to a live track, and on Android Chrome it frequently starts playing
    // regardless. So this records a warning and carries on rather than
    // aborting a working camera. The decode loop gates on readyState, so it
    // simply waits if frames are not flowing yet.
    try {
      await video.play()
    } catch (err) {
      const name = (err as { name?: string })?.name ?? 'Error'
      const message = (err as { message?: string })?.message ?? String(err)
      setVideoWarning(`${name}: ${message}`)
    }

    // Fetch the decoder now rather than on the first frame, so the 1 MB wasm
    // downloads while the user is still aiming.
    loadDecoder().catch((e) => setDecoderError(e instanceof Error ? e.message : String(e)))

    setRunning(true)
    setStarting(false)
    collectDiagnostics().then(setDiag)
    timerRef.current = setInterval(tick, SAMPLE_MS)
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
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">{FAULT_COPY[fault.kind].title}</p>
            <p className="text-sm">{FAULT_COPY[fault.kind].body}</p>
            {/* The real error, always. The friendly sentence above is a guess
                at what it means; this is what actually happened. */}
            {fault.raw && (
              <p className="sp-num mt-2 break-all text-xs opacity-80">{fault.raw}</p>
            )}
          </div>
        </div>
      )}

      {/* A rejected play() with a live camera — worth saying, not worth
          stopping for. */}
      {videoWarning && !fault && (
        <div className="rounded-2xl border border-border bg-surface-muted p-4">
          <p className="text-sm font-semibold text-foreground">
            The video element refused to start playing
          </p>
          <p className="mt-1 text-sm text-muted">
            The camera is open and scanning continues — this is usually the browser&apos;s autoplay
            policy and is harmless. Reported so it is not invisible.
          </p>
          <p className="sp-num mt-2 break-all text-xs text-muted">{videoWarning}</p>
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

      {/* ---------------------------------------------------------------- */}
      {/* Diagnostics                                                       */}
      {/* ---------------------------------------------------------------- */}
      {/* Collapsed, and only after Start has been pressed. This exists because
          the first version of this component reported a permission failure on
          a working Android camera and there was no way to tell from the screen
          what had actually gone wrong. A prototype that will be tested on
          devices I cannot open a console on has to be able to explain itself. */}
      {diag && (
        <details className="rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Diagnostics
          </summary>
          <dl className="mt-3 space-y-1.5 text-xs">
            {[
              ['Secure context', String(diag.secure)],
              ['Origin', `${diag.protocol}//${diag.host}`],
              ['In an iframe', String(diag.inIframe)],
              ['navigator.mediaDevices.getUserMedia', String(diag.hasMediaDevices)],
              ['Permissions API camera state', diag.permission],
              ['Video input devices', diag.videoInputs],
              ['Video element', videoState || 'not sampled yet'],
              ['Frames checked', String(frames)],
              ['Last error', fault?.raw ?? videoWarning ?? 'none'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-2">
                <dt className="text-muted">{k}:</dt>
                <dd className="sp-num break-all text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 break-all text-xs text-muted">{diag.userAgent}</p>
        </details>
      )}
    </div>
  )
}
