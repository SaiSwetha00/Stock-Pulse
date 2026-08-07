/**
 * Whether a stored image URL can go through next/image.
 *
 * avatar_url and logo_url are free-text columns — anyone can paste a link to
 * any host. next/image throws at render for a host missing from
 * `images.remotePatterns` in next.config.ts, and an exception in the topbar
 * takes the whole dashboard down with it. Checking first lets the callers fall
 * back to their existing initials avatar, which is a better outcome than a
 * broken frame and far better than a crash.
 *
 * The allowlist here must stay in step with next.config.ts: both derive the
 * host from NEXT_PUBLIC_SUPABASE_URL, so neither can drift on its own.
 */
const OPTIMIZABLE_HOST = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
})()

export function isOptimizableImage(src: string | null | undefined): src is string {
  if (!src || !OPTIMIZABLE_HOST) return false
  try {
    const { hostname, protocol } = new URL(src)
    return protocol === 'https:' && hostname === OPTIMIZABLE_HOST
  } catch {
    // Relative paths and malformed values both land here. Relative URLs are
    // same-origin and safe, but nothing in this app stores one, so treating
    // them as unoptimizable costs nothing.
    return false
  }
}
