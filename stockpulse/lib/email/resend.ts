import 'server-only'

/**
 * Transactional email, via Resend's HTTP API.
 *
 * Deliberately not the `resend` npm package: this is one POST with a bearer
 * token, and a dependency for that adds install weight and supply-chain surface
 * for no capability. `server-only` makes importing it from a client component a
 * build error, so the API key cannot end up in a bundle.
 *
 * This is a separate channel from DECISIONS.md D8. Auth email (invites,
 * password resets) still goes through Supabase's SMTP settings and still needs
 * no key in the codebase. This path exists because the app itself now has
 * something to say — a support request landed — which Supabase Auth has no
 * reason to know about.
 */

const ENDPOINT = 'https://api.resend.com/emails'

/**
 * THE SHARED-SENDER FALLBACK WAS REMOVED, ON PURPOSE.
 *
 * This used to default to `StockPulse <onboarding@resend.dev>` when
 * `RESEND_FROM` was unset. That address is Resend's shared sender and by design
 * **only delivers to the Resend account owner's own address** — so every email
 * to anyone else was accepted by the API, reported as sent, and silently went
 * nowhere. Phase 6 found it: the key authenticates, `GET /domains` returns zero
 * verified domains, and `RESEND_FROM` is unset, so support confirmations could
 * never reach the person who submitted the request.
 *
 * A misconfiguration that returns success is worse than one that fails. This
 * now refuses to send rather than sending somewhere that resembles delivery,
 * and the refusal names the variable to set.
 *
 * To configure: verify a domain in the Resend dashboard, then set
 * `RESEND_FROM="StockPulse <support@yourdomain.com>"` on that same domain.
 */
const MISSING_FROM =
  'RESEND_FROM is not set. Verify a sending domain in Resend and set ' +
  'RESEND_FROM="StockPulse <you@yourdomain.com>". Refusing to send from the ' +
  'shared onboarding@resend.dev sender, which only reaches the Resend account owner.'

export type EmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'not-configured' | 'failed'; detail: string }

export async function sendEmail(input: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // Not worth throwing: a deployment without the key should still accept
    // support requests. The caller logs this.
    return { ok: false, reason: 'not-configured', detail: 'RESEND_API_KEY is not set' }
  }

  const from = process.env.RESEND_FROM
  if (!from) {
    // Loud in the server log as well as in the return value. The return value
    // reaches the caller, which degrades gracefully; the log is what an
    // operator reads when they wonder why nobody got an email.
    console.error('[email] ' + MISSING_FROM)
    return { ok: false, reason: 'not-configured', detail: MISSING_FROM }
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      // Resend puts the useful part in the body; the status alone cannot tell
      // a bad key from an unverified domain.
      const body = await res.text().catch(() => '')
      return { ok: false, reason: 'failed', detail: `${res.status} ${body.slice(0, 300)}` }
    }

    const data = (await res.json().catch(() => null)) as { id?: string } | null
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    return {
      ok: false,
      reason: 'failed',
      detail: err instanceof Error ? err.message : 'unknown network error',
    }
  }
}

/** Escapes interpolated values. A support message is arbitrary user text going
 *  into an HTML email — without this a `<script>` or a stray `<` mangles it. */
function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const WRAP = (inner: string) =>
  `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#14171a">${inner}</div>`

export type SupportEmailInput = {
  reference: string
  name: string
  email: string
  category: string
  message: string
  storeName: string
  createdAtIso: string
}

/**
 * Sends the operator notification, and optionally a confirmation to whoever
 * raised the request.
 *
 * The confirmation stays behind SUPPORT_CONFIRMATION_EMAILS. The original
 * reason — the shared `onboarding@resend.dev` sender reaching only the Resend
 * account owner — no longer applies, because `sendEmail` now refuses to send
 * at all without `RESEND_FROM`. The flag remains for a different reason: this
 * is the one place the app emails a member of the public, and starting to do
 * that is the operator's decision, not a side effect of setting an env var.
 *
 * Safe to enable once a domain is verified in Resend and RESEND_FROM points at
 * it. Before that, `sendEmail` returns `not-configured` and nothing is sent.
 *
 * Returns both outcomes rather than throwing: the request is already saved by
 * the time this runs, and a failed notification must never fail the save.
 */
export async function sendSupportEmails(
  input: SupportEmailInput,
): Promise<{ operator: EmailResult; confirmation: EmailResult | null }> {
  const operatorTo = process.env.SUPPORT_NOTIFY_EMAIL
  const when = new Date(input.createdAtIso).toUTCString()

  const operator = operatorTo
    ? await sendEmail({
        to: operatorTo,
        subject: `[${input.reference}] ${input.category} — ${input.storeName}`,
        // Reply-to is the point: hitting reply should reach the person who
        // asked, not bounce back to the app.
        replyTo: input.email,
        html: WRAP(`
          <h2 style="margin:0 0 12px;font-size:16px">New support request</h2>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr><td style="padding:2px 12px 2px 0;color:#6b7379">Reference</td><td><strong>${esc(input.reference)}</strong></td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7379">Store</td><td>${esc(input.storeName)}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7379">From</td><td>${esc(input.name)} &lt;${esc(input.email)}&gt;</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7379">Category</td><td>${esc(input.category)}</td></tr>
            <tr><td style="padding:2px 12px 2px 0;color:#6b7379">Received</td><td>${esc(when)}</td></tr>
          </table>
          <p style="margin:16px 0 6px;color:#6b7379">Message</p>
          <div style="white-space:pre-wrap;border-left:3px solid #e6e2db;padding-left:12px">${esc(input.message)}</div>
        `),
      })
    : {
        ok: false as const,
        reason: 'not-configured' as const,
        detail: 'SUPPORT_NOTIFY_EMAIL is not set',
      }

  const confirmation =
    process.env.SUPPORT_CONFIRMATION_EMAILS === 'true'
      ? await sendEmail({
          to: input.email,
          subject: `We got your message (${input.reference})`,
          html: WRAP(`
            <p>Hi ${esc(input.name)},</p>
            <p>Your message about <strong>${esc(input.category)}</strong> has reached us. Your reference is <strong>${esc(input.reference)}</strong> — quote it if you follow up.</p>
            <p style="margin:16px 0 6px;color:#6b7379">What you sent</p>
            <div style="white-space:pre-wrap;border-left:3px solid #e6e2db;padding-left:12px">${esc(input.message)}</div>
            <p style="margin-top:16px">We will reply to this address.</p>
          `),
        })
      : null

  return { operator, confirmation }
}
