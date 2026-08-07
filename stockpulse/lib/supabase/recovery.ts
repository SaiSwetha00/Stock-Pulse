/**
 * Sends the password-reset email by calling Supabase's auth endpoint directly.
 *
 * Why not the SDK
 * ---------------
 * Two independent reasons, either of which is disqualifying:
 *
 * 1. `@supabase/ssr` hardcodes `flowType: 'pkce'` — it spreads caller options in
 *    and then overwrites the field, so it cannot be configured away:
 *
 *        auth: { ...options?.auth, flowType: "pkce", ... }
 *
 *    Under PKCE the reset link comes back as `?code=…` and can only be redeemed
 *    by the browser holding the matching verifier cookie. Request on a laptop,
 *    open the email on a phone, and the exchange is impossible. That is a
 *    property of the flow, not of project settings.
 *
 * 2. Plain `@supabase/supabase-js` defaults to the implicit flow and would fix
 *    that, but constructing it initialises realtime-js, which throws on Node
 *    without a global WebSocket ("Node.js detected but native WebSocket not
 *    found"). Node 20 has no global WebSocket, so that client cannot be built
 *    on the current runtime at all.
 *
 * Issuing the request ourselves sidesteps both. Sending no `code_challenge`
 * puts Supabase in the implicit flow, so `/auth/v1/verify` redirects to
 * `redirectTo` with the tokens in the URL *fragment*
 * (`#access_token=…&refresh_token=…`). The fragment travels inside the link, so
 * any device that opens the email can establish the session.
 *
 * This works with Supabase's DEFAULT email template, which matters because
 * templates are read-only without Custom SMTP on the free plan.
 */
export async function sendPasswordResetEmail(
  email: string,
  redirectTo: string,
): Promise<{ error?: string; success?: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return { error: 'Authentication is not configured. Contact your administrator.' }
  }

  let response: Response
  try {
    response = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
  } catch {
    return { error: 'Could not reach the authentication service. Check your connection.' }
  }

  if (response.ok) return { success: true }

  // The free plan allows only a few auth emails per hour. Say so plainly rather
  // than surfacing a bare 429.
  if (response.status === 429) {
    return {
      error:
        'Too many reset emails requested. Supabase limits how many can be sent per hour — wait a few minutes and try again.',
    }
  }

  const body = await response.json().catch(() => null)
  const message =
    (body && (body.msg || body.message || body.error_description || body.error)) ||
    `Could not send the reset email (HTTP ${response.status}).`

  return { error: String(message) }
}
