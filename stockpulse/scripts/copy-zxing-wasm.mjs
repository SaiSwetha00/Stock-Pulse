/**
 * Copies the zxing reader wasm into public/ so the app serves it itself.
 *
 * WHY THIS EXISTS AT ALL. zxing-wasm defaults to fetching its .wasm from a
 * public CDN (jsDelivr) at runtime. That is three separate problems here:
 *
 *   1. It is a third-party request on a page inside the authenticated product.
 *      This project has already removed six unsplash.com texture loads and a
 *      CDN-fetched rendering library for exactly that reason.
 *   2. A CDN outage becomes a scanner outage, silently, in a shop.
 *   3. The privacy policy enumerates every place data leaves the system (D42).
 *      A decoder that phones out on first use is a new egress nobody declared.
 *
 * WHY A COPY RATHER THAN COMMITTING THE BINARY. It is 1,068 KB. Committing it
 * puts a megabyte of build output in git forever, and it would have to be
 * re-committed on every zxing-wasm bump — a step someone will forget, leaving
 * a wasm that does not match the JS glue that loads it. Copying at build time
 * means the two cannot disagree: they come from the same installed version.
 *
 * Wired to `predev` and `prebuild`, so both npm lifecycles run it with no
 * separate command to remember. public/wasm/ is gitignored.
 */
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')

const from = resolve(app, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')
const to = resolve(app, 'public/wasm/zxing_reader.wasm')

try {
  const src = await stat(from)
  await mkdir(dirname(to), { recursive: true })
  await copyFile(from, to)
  const dst = await stat(to)
  // Report the size rather than just "done": a 0-byte copy is a working script
  // and a broken scanner, and that is the shape of failure worth catching here.
  console.log(
    `zxing wasm: ${(dst.size / 1024).toFixed(0)} KB -> public/wasm/zxing_reader.wasm` +
      (dst.size === src.size ? '' : `  WARNING: size differs from source (${src.size})`),
  )
} catch (err) {
  // Loud, and it names the fix. A missing decoder must not surface later as
  // "the camera does not work".
  console.error(
    `\nFAILED to stage the barcode decoder wasm.\n` +
      `  looked for: ${from}\n` +
      `  ${err.message}\n` +
      `  Run \`npm install\` in stockpulse/ and try again.\n`,
  )
  process.exit(1)
}
