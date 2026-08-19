import type { MetadataRoute } from 'next'

/**
 * The web app manifest, served by Next at /manifest.webmanifest.
 *
 * A file convention rather than a static public/manifest.json, because this
 * Next version generates the route and links it from <head> itself — writing
 * the file by hand would mean also remembering the <link rel="manifest">, and
 * the two would drift.
 *
 * IMPORTANT: /manifest.webmanifest had to be added to proxy.ts's matcher. Its
 * path is not caught by any of the existing extension rules, so without that
 * line the auth middleware answers an install request with the sign-in page as
 * HTML and the browser reports no manifest at all. That is the same bug the
 * mp4 hero, the opengraph image and the barcode wasm each hit — proxy.ts now
 * records four instances of it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockPulse — Store operations for independent grocers',
    short_name: 'StockPulse',
    description:
      'Stock, sales and expiry for an independent grocery. Works on the shop floor.',
    // The till and the shelf are why this is installable at all, but
    // /dashboard is still the right landing: it is what the owner opens in the
    // morning, and a cashier reaches /sales from it in one tap.
    start_url: '/dashboard',
    // `standalone` rather than `fullscreen`: a shopkeeper needs the clock and
    // the battery indicator, and fullscreen hides both.
    display: 'standalone',
    orientation: 'portrait',
    // Matches the app's own dark surface so the splash does not flash white
    // before first paint on a phone.
    background_color: '#0f1115',
    theme_color: '#0f1115',
    categories: ['business', 'productivity', 'shopping'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Separate entries rather than `purpose: 'any maskable'` on one file: a
      // mark drawn for the full square gets its edges cropped by Android's
      // circular safe zone, so the maskable variants carry their own bleed.
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
