import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/forgot-password') || path.startsWith('/reset-password')
  // /auth/callback must be reachable while signed out — it is the route that
  // creates the session from an email link. Redirecting it to /login would
  // discard the recovery code and strand the user on the sign-in page.
  const isAuthCallback = path.startsWith('/auth')
  // The legal pages have to be readable without an account. Someone deciding
  // whether to sign up reads the privacy policy first — redirecting them to
  // /login to find out what happens to their data is precisely backwards, and
  // it would have made the new footer links look broken to every visitor.
  const isLegalRoute = path.startsWith('/privacy') || path.startsWith('/terms')

  // The offline fallback must be public, and the reason is specific rather
  // than philosophical. The service worker precaches it with
  // `cache.add('/offline')` at install time. Redirected to /login, that call
  // caches the SIGN-IN PAGE as the offline document - so a cashier who lost
  // signal would be shown a login form they cannot submit, forever, on a
  // device that was already signed in.
  //
  // Caught by curling it unauthenticated, which is the only way this shows up:
  // signed in, /offline returns 200 and looks perfectly correct, and the build
  // reports the route as generated either way.
  const isOfflineRoute = path === '/offline'

  const isPublicRoute =
    path === '/' || isAuthRoute || isAuthCallback || isLegalRoute || isOfflineRoute

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // /reset-password must stay reachable even with a session: the recovery link
  // itself signs the user in before they choose a new password.
  if (user && isAuthRoute && !path.startsWith('/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
