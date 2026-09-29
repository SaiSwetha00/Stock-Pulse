import { ROLE_LABELS } from '@/lib/permissions'
import type { Role } from '@/types'

/**
 * A job title as it should READ, in the chosen language.
 *
 * `profiles.job_title` is free text the owner types, and that stays exactly as
 * typed — it is the shop's own word, like a product name. But the app also
 * WRITES this column itself, in English, in two places:
 *   - signup stores 'Store Owner' (app/auth/actions.ts), and
 *   - an invite with the title left blank stores the role's English label
 *     (ROLE_LABELS, via teamActions.ts and auth/actions.ts).
 * Those are app vocabulary that happens to live in a data column — the same
 * situation as the five seeded categories — so exactly those values are shown
 * in the reader's language, and nothing else is touched.
 *
 * DISPLAY ONLY. The edit form (EditStaffModal) must keep showing the stored
 * value, or saving it would write the translation into the database.
 */
export function displayJobTitle(
  jobTitle: string | null | undefined,
  copy: { roles: Record<Role, string>; storeOwner: string },
): string | null | undefined {
  const value = jobTitle?.trim()
  if (!value) return jobTitle
  if (value === 'Store Owner') return copy.storeOwner
  const role = (Object.keys(ROLE_LABELS) as Role[]).find((r) => ROLE_LABELS[r] === value)
  return role ? copy.roles[role] : jobTitle
}
