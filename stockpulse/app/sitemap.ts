import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

/**
 * Only publicly reachable pages belong here. Every authenticated route is
 * behind a redirect, so listing them would advertise URLs a crawler can only
 * ever receive a 307 from.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const lastModified = new Date()

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/login`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/signup`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/forgot-password`, lastModified, changeFrequency: 'yearly', priority: 0.1 },
  ]
}
