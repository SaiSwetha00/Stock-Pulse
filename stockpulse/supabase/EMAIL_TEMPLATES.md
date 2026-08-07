# Supabase email templates

Apply these by hand in the Supabase dashboard, the same way the `.sql` files in
this folder are applied. Dashboard → **Authentication → Email Templates**.

## Why the default templates must be changed

`@supabase/ssr` pins `flowType: 'pkce'`. With PKCE, Supabase's default
`{{ .ConfirmationURL }}` sends the user back with `?code=…`, and exchanging that
code requires a **verifier cookie stored in the browser that requested the
link**.

That makes the default flow single-device by construction: request a reset on
your laptop, open the email on your phone, and the phone has no verifier — the
exchange fails and the user is stranded.

The templates below use `{{ .TokenHash }}` instead. `verifyOtp` validates a
token hash entirely server-side with no stored client state, so the link works
from **any** device, which is what people expect from a password reset.

`app/auth/callback/route.ts` accepts both shapes and prefers `token_hash`; the
`?code=` path is kept only as a fallback for links issued before this change.

## URL Configuration

Dashboard → **Authentication → URL Configuration**

- **Site URL**: `http://localhost:3000` (set this to the real origin in production)
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

`{{ .SiteURL }}` in the templates below resolves to the Site URL above, so the
templates need no edits between environments.

## Reset Password

Template → **Reset Password**. Replace the body with:

```html
<h2>Reset your password</h2>
<p>Someone requested a password reset for your StockPulse account.</p>
<p>
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
    Set a new password
  </a>
</p>
<p>This link can only be used once. If you didn't request it, ignore this email
and your password will stay unchanged.</p>
```

## Invite user

Template → **Invite user**. Staff invites hit the same code path — an invited
member has no password yet, so they are sent to the same screen to set one.

```html
<h2>You've been invited to StockPulse</h2>
<p>You've been added to a store on StockPulse. Set a password to get started.</p>
<p>
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/reset-password">
    Accept the invite
  </a>
</p>
```

## Notes

- `type` must match how the link was generated: `recovery` for
  `resetPasswordForEmail`, `invite` for `admin.inviteUserByEmail`. The callback
  rejects unrecognised values.
- `next` must be a relative path. The callback refuses absolute or
  protocol-relative values so a tampered link cannot redirect elsewhere with a
  live session attached.
- The `redirectTo` passed in `app/auth/actions.ts` still matters for the
  fallback `?code=` path and must stay allow-listed under Redirect URLs.
