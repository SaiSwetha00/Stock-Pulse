import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Only same-origin relative paths may be redirected to. Without this a crafted
 * `?next=https://evil.example` would turn the recovery link into an open
 * redirect carrying a freshly minted session.
 */
function safeNext(next: string | null, fallback: string): string {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//')) return fallback
  return next
}

function siteOrigin(request: NextRequest): string {
  // Prefer the configured site URL: behind a proxy, request.nextUrl.origin can
  // be the internal address rather than the one the user is browsing.
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
}

function failure(request: NextRequest, message: string): NextResponse {
  const url = new URL('/login', siteOrigin(request))
  url.searchParams.set('error', message)
  return NextResponse.redirect(url)
}

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

/**
 * The PKCE verifier is a cookie in the browser that *requested* the link, so a
 * `?code=` link opened on a different device can never be exchanged. Surface
 * that as something the user can act on instead of the raw driver message,
 * which talks about SSR frameworks and storage.
 */
function humanise(message: string): string {
  if (/code verifier/i.test(message)) {
    return 'This link was opened on a different device or browser than the one that requested it. Request a new link and open it on this device.'
  }
  if (/expired|invalid/i.test(message)) {
    return 'That link is no longer valid. Password reset links expire and can only be used once.'
  }
  return message
}

/**
 * Turns an email link into a real session.
 *
 * Two shapes are accepted, and the order matters:
 *
 * 1. `token_hash` + `type` — verified via `verifyOtp`. Stateless: nothing is
 *    stored in the requesting browser, so the link works on ANY device. This is
 *    what the email templates are configured to send (see
 *    supabase/EMAIL_TEMPLATES.md) and is the path production traffic takes.
 *
 * 2. `code` — the PKCE exchange. @supabase/ssr pins `flowType: 'pkce'`, so this
 *    is what Supabase's *default* template produces. It is kept as a fallback
 *    for links issued before the templates were updated, but it is inherently
 *    single-device: the verifier lives in a cookie on the requesting browser.
 *
 * Either way the exchange happens server-side, because the resulting session
 * cookies must be written by a server response.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Supabase reports its own failures (expired link, already used) this way.
  const errorDescription = searchParams.get('error_description') ?? searchParams.get('error')
  if (errorDescription) return failure(request, humanise(errorDescription))

  const tokenHash = searchParams.get('token_hash')
  const rawType = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'), '/dashboard')

  const supabase = await createClient()

  // Preferred: works from any device.
  if (tokenHash) {
    const type = (rawType ?? 'recovery') as EmailOtpType
    if (!EMAIL_OTP_TYPES.has(type)) {
      return failure(request, 'That link has an unrecognised type. Request a new one.')
    }
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) return failure(request, humanise(error.message))
    return NextResponse.redirect(new URL(next, siteOrigin(request)))
  }

  // Fallback: only succeeds on the device that requested the link.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return failure(request, humanise(error.message))
    return NextResponse.redirect(new URL(next, siteOrigin(request)))
  }

  return failure(request, 'That link is missing its verification code. Request a new one.')
}
