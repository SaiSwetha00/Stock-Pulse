/**
 * StockPulse service worker — Offline Phase 1.
 *
 * SCOPE OF THIS FILE, DELIBERATELY SMALL. It makes the app installable and
 * serves static assets from cache. It queues nothing, replays nothing, and
 * caches no page a signed-in user sees. Offline WRITES are Phase 2+, and
 * shipping a queue in the same change that introduces a service worker would
 * mean debugging two new failure modes at once.
 *
 * ------------------------------------------------------------------
 * WHAT IS NOT CACHED, AND WHY EACH WOULD BE A BUG
 * ------------------------------------------------------------------
 * 1. Anything that is not a GET. Every write here is a POST — the `log_sale`
 *    RPC, every Server Action, every PostgREST insert. A worker that touched
 *    them would be the offline-write feature, unbuilt and untested. They fall
 *    through to the network and fail exactly as they do today.
 *
 * 2. Any cross-origin request. Supabase is another origin. Caching its
 *    responses would serve one shop stale stock; caching its auth endpoints
 *    would be a way to resurrect a dead session.
 *
 * 3. HTML for authenticated pages. This is the important one. A grocery phone
 *    is a SHARED device — owner and staff sign into the same handset. Caching
 *    /dashboard's HTML would let the next person see the previous person's
 *    takings before the network answered, and RLS could not prevent it because
 *    those bytes never reach the server. Only the /offline document is
 *    precached, and it contains nothing but a message.
 *
 * 4. RSC payloads (`?_rsc=` / `RSC: 1`). Same reason as 3 — the page's data in
 *    a different wrapper.
 *
 * ------------------------------------------------------------------
 * WHAT IS CACHED
 * ------------------------------------------------------------------
 * - `/_next/static/*` — content-hashed by the build, so a stale entry is
 *   impossible by construction: a changed file has a different URL.
 * - `/icons/*`, `/assets/*` and the immutable file types under public/.
 * - `/wasm/zxing_reader.wasm` — the barcode decoder. Cache-first is a real
 *   improvement rather than a risk: 1 MB, fetched on every visit to a scanning
 *   screen, staged per build by scripts/copy-zxing-wasm.mjs.
 *
 * ------------------------------------------------------------------
 * SCANNER SAFETY
 * ------------------------------------------------------------------
 * CLAUDE.md records that an expired session used to answer the wasm request
 * with the sign-in page as HTML, and the decoder then failed with a module
 * instantiation error. Caching only OK responses whose content-type is not
 * text/html means this worker can never cache that HTML impostor and then
 * serve it back forever. That is why `putIfCacheable` exists rather than a
 * bare `cache.put`.
 */

const STATIC_CACHE = 'stockpulse-static-v1'
const SHELL_CACHE = 'stockpulse-shell-v1'
// A STATIC FILE, not a route. An App Router page cannot be served offline
// from a precached document: hydrating one needs its RSC payload, which this
// worker refuses to cache so that no signed-in page data is ever stored on a
// shared shop phone. Pointing at a plain .html file removes the conflict
// instead of carving an exception into that rule.
const OFFLINE_URL = '/offline.html'

/** Same-origin path prefixes safe to serve cache-first. */
const STATIC_PREFIXES = ['/_next/static/', '/icons/', '/wasm/', '/assets/']

/** File types under public/ that are immutable in practice. */
const STATIC_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico',
  '.woff', '.woff2', '.mp4', '.webm', '.wasm',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      // A failed precache must not abort installation. The offline page is a
      // courtesy; refusing to install without it would mean one bad deploy
      // leaves users with no worker at all.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== SHELL_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isStaticAsset(url) {
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) return true
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))
}

/**
 * Store a response only if it is a real one.
 *
 * A 200 whose content-type is text/html, on a request for a .wasm or a .png,
 * is the signature of the auth middleware answering with the sign-in page —
 * the exact failure proxy.ts's exclusion list exists to prevent. Caching that
 * would make a transient auth problem permanent and invisible.
 */
async function putIfCacheable(cacheName, request, response) {
  if (!response || !response.ok || response.type === 'opaque') return
  const type = response.headers.get('content-type') || ''
  if (type.includes('text/html')) return

  // CLONE FIRST, BEFORE ANY await. This is not style - it is the whole
  // correctness of the function. The same response is handed to the page, and
  // the page starts reading its body immediately. If the clone is taken after
  // `await caches.open(...)`, the body is already disturbed and clone() throws,
  // so nothing is ever cached and nothing ever says so.
  //
  // Measured, not theorised: with the clone taken late, /icons/icon-192.png
  // and /wasm/zxing_reader.wasm both fetched 200 - ok - basic - correct
  // content-type, and the static cache still held 0 entries afterwards.
  const copy = response.clone()
  const cache = await caches.open(cacheName)
  await cache.put(request, copy)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Rule 1: never touch a write. Rule 2: never touch another origin.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Rule 4: RSC payloads are page data, not assets.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((response) => {
          // waitUntil, not a bare call: once respondWith settles the worker
          // may be terminated, and a cache write that is not registered
          // against the event's lifetime is a write the browser is entitled
          // to kill halfway.
          event.waitUntil(putIfCacheable(STATIC_CACHE, request, response))
          return response
        })
      }),
    )
    return
  }

  // Navigations: network, with the offline page as a fallback. NOT
  // network-first-then-cache — nothing authenticated is ever stored, so there
  // is no cached page to fall back to, and that is the point (item 3 above).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL)
        return (
          fallback ||
          new Response('You are offline.', {
            status: 503,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          })
        )
      }),
    )
  }

  // Everything else — API routes, anything unrecognised — is left entirely
  // alone. An unrecognised request reaching the network unchanged is the
  // behaviour this app already has, and Phase 1 promises not to change it.
})
