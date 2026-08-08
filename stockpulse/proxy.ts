import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // robots.txt and sitemap.xml must be excluded here, not merely allowed in
    // updateSession: without this the auth middleware redirects both to
    // /login, so a crawler asking for them receives the sign-in page as HTML
    // and the site is effectively unindexable.
    // Media extensions belong here for the same reason. The landing hero is a
    // <video src="/assets/hero.mp4">, and with mp4 missing from this list the
    // auth middleware answered that request with the sign-in page as HTML —
    // status 200, content-type text/html — so the browser had no decodable
    // source and the hero rendered black. A static file under public/ should
    // never reach session handling.
    // opengraph-image and twitter-image belong here for the same reason as
    // robots.txt above: Next serves them from an extensionless route
    // (/opengraph-image?<hash>), so none of the extension rules catch them,
    // and the auth middleware answered a scraper's image request with the
    // sign-in page as HTML. The card rendered blank in every link preview.
    // Caught by curling the production server — the build reports the route
    // as generated either way, so nothing upstream of this shows a problem.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mov|woff|woff2)$).*)',
  ],
}
