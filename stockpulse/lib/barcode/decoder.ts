/**
 * Barcode decoding for the Phase 2 scanning prototype.
 *
 * ============================================================
 * WHY zxing-wasm ON EVERY BROWSER, AND NOT BarcodeDetector
 * ============================================================
 * The obvious design is "native BarcodeDetector where available, library
 * elsewhere". It was rejected, and the reason is about verification rather
 * than about either implementation being better.
 *
 * WebKit does not implement BarcodeDetector at all — not behind a flag, not
 * partially. So on every iPhone and iPad, and in Safari on the desktop, a
 * native-first design ALWAYS takes the fallback. The fallback is therefore the
 * real implementation for a large share of a grocery's staff, while being the
 * branch nobody exercises on a Chrome laptop.
 *
 * That is precisely the failure this project keeps writing down: measuring one
 * world and shipping another (D26, D38). Two decoders means two sets of quirks
 * — different `format` spellings, different behaviour on a blurred frame,
 * different rotation handling — and the set that could actually be tested here
 * would be the one iOS never runs.
 *
 * One decoder everywhere means the behaviour verified here is the behaviour
 * that ships, on every browser. The cost is a wasm download; the benefit is
 * that "works on iOS" stops being an assumption.
 *
 * If native detection is ever wanted for speed, add it as a measured
 * optimisation with the wasm path kept as the reference — not as the default
 * with the wasm path as an untested safety net.
 *
 * ============================================================
 * WHERE THE WASM COMES FROM
 * ============================================================
 * `/wasm/zxing_reader.wasm`, served by this app. zxing-wasm would otherwise
 * fetch it from a CDN on first decode. See scripts/copy-zxing-wasm.mjs.
 */

/** Retail symbologies a grocery actually puts on a shelf. */
const PRODUCT_FORMATS = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'ITF'] as const

/**
 * Also decoded, deliberately — so a QR code can be REPORTED as the wrong kind
 * of code rather than ignored. A scanner that silently does nothing when
 * pointed at a QR code is indistinguishable from a broken scanner, and telling
 * those two apart is a requirement of this phase.
 */
const ALSO_DECODED = ['QRCode', 'Code128', 'Code39', 'DataMatrix'] as const

const ALL_FORMATS = [...PRODUCT_FORMATS, ...ALSO_DECODED]

/**
 * What one frame produced. A discriminated union rather than
 * `{ value?: string; error?: string }` because D17 records exactly how the
 * optional-field shape fails to narrow, and because these three cases must
 * stay visibly distinct all the way to the screen.
 */
export type ScanOutcome =
  /** Nothing decodable in this frame — the overwhelmingly common case while
   *  someone is still aiming. NOT an error, and must never be shown as one. */
  | { kind: 'none' }
  /** Decoded cleanly, but it is not a retail product barcode. */
  | { kind: 'unsupported-symbology'; text: string; format: string }
  /** Decoded a product barcode. */
  | { kind: 'product'; value: string; format: string }

type ReadResult = { text: string; format: string; isValid?: boolean }
type ReadFn = (image: ImageData, options?: unknown) => Promise<ReadResult[]>

let readerPromise: Promise<ReadFn> | null = null

/**
 * Loads the decoder once and caches the promise.
 *
 * Caching the PROMISE rather than the resolved module matters: two frames can
 * ask before the first load finishes, and caching only the module would start
 * a second 1 MB fetch.
 */
export function loadDecoder(): Promise<ReadFn> {
  if (readerPromise) return readerPromise

  readerPromise = (async () => {
    const mod = await import('zxing-wasm/reader')
    mod.prepareZXingModule({
      overrides: {
        // Absolute, so it resolves the same from any route depth.
        locateFile: (path: string) =>
          path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : path,
      },
      fireImmediately: false,
    })
    return mod.readBarcodesFromImageData as unknown as ReadFn
  })()

  // A failed load must not be cached as a permanent failure — a flaky network
  // on the first frame would otherwise disable the scanner for the rest of the
  // session with no way back except a reload.
  readerPromise.catch(() => {
    readerPromise = null
  })

  return readerPromise
}

/**
 * Classify one frame.
 *
 * `tryHarder` is off: this runs on every sampled frame of a live camera, and
 * the exhaustive search costs far more than simply looking at the next frame.
 * The still-image tests use it; a video loop should not.
 */
export async function decodeFrame(frame: ImageData): Promise<ScanOutcome> {
  const read = await loadDecoder()
  const results = await read(frame, { formats: ALL_FORMATS, tryHarder: false })

  if (results.length === 0) return { kind: 'none' }

  // Prefer a product barcode when a frame contains more than one code — a
  // shelf label can carry both a QR code and an EAN-13.
  const product = results.find((r) => isProductFormat(r.format) && r.text)
  if (product) return { kind: 'product', value: product.text, format: product.format }

  const other = results.find((r) => r.text)
  if (other) return { kind: 'unsupported-symbology', text: other.text, format: other.format }

  // Decoded "something" with no text in it. Treated as nothing rather than as
  // a mystery error, because there is nothing a user could do about it.
  return { kind: 'none' }
}

/**
 * zxing reports formats without the hyphens used in the request list
 * ("EAN13", not "EAN-13"), so comparison strips non-alphanumerics rather than
 * matching literally. Measured, not assumed: a seeded EAN-13 comes back as
 * `format: "EAN13"`.
 */
function isProductFormat(format: string): boolean {
  const norm = (s: string) => s.replace(/[^a-z0-9]/gi, '').toLowerCase()
  return PRODUCT_FORMATS.some((f) => norm(f) === norm(format))
}

/** Exported for the verification harness, which asserts this mapping directly. */
export const __testing = { isProductFormat, PRODUCT_FORMATS, ALL_FORMATS }
