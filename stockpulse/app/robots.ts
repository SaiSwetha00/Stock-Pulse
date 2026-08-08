import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything behind auth is noise for a crawler, and /auth carries
      // one-time recovery codes that must never end up in an index.
      disallow: [
        '/dashboard',
        '/inventory',
        '/sales',
        '/customers',
        '/suppliers',
        '/staff',
        '/monitoring',
        '/settings',
        '/profile',
        '/reports',
        '/help',
        '/auth/',
        '/api/',
        '/reset-password',
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
