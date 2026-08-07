/**
 * Canonical public origin, with no trailing slash.
 *
 * Order matters: an explicit NEXT_PUBLIC_SITE_URL wins so a custom domain can
 * override Vercel's generated one. VERCEL_PROJECT_PRODUCTION_URL is the stable
 * production host — deliberately not VERCEL_URL, which is the per-deployment
 * immutable host and would put a throwaway URL into sitemaps and canonicals.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}
