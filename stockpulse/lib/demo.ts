import type { Profile } from '@/types'

/**
 * The published demo account.
 *
 * One definition, imported by both the login page (which offers the one-click
 * sign-in) and the dashboard layout (which marks the session as a demo). The
 * value also exists in `scripts/acceptance/ensure-demo-user.cjs`, which creates
 * the account — that copy is unavoidable, because a `.cjs` script run by node
 * outside the bundler cannot import a TypeScript module. Two copies pointing at
 * each other is the floor here; three would not have been.
 */
export const DEMO_EMAIL = 'demo@stockpulse.test'

/**
 * Whether this session is the public demo.
 *
 * Matched on the PROFILE's email rather than the auth user's, because the
 * dashboard layout already holds the profile from `getCurrentUser()` and a
 * second lookup would cost a round trip on every navigation just to decide
 * whether to draw a badge.
 *
 * This is presentational only. It gates a label, never data and never
 * permission — what the demo account may see and do is decided by RLS and by
 * `lib/permissions.ts` against its role, exactly as for any other account, and
 * nothing here changes that. If a future caller is tempted to branch access on
 * it, that belongs in the database instead.
 */
export function isDemoAccount(profile: Pick<Profile, 'email'>): boolean {
  return (profile.email ?? '').trim().toLowerCase() === DEMO_EMAIL
}
