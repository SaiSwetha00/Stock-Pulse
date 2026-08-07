import type { Role } from '@/types'

/**
 * The single source of truth for what each role may do.
 *
 * This mirrors `public.can_manage()` in migration 0002 exactly. The database
 * is the real enforcement — RLS applies even to a crafted request that never
 * touches this file — but Server Actions check here first so a refusal comes
 * back as a readable message rather than an opaque RLS error.
 *
 * If the two ever disagree, the database wins and the user sees a confusing
 * failure. Change them together.
 */

/** Day-to-day operations: products, customers, suppliers, shifts, stations. */
export function canManage(role: Role): boolean {
  return role === 'owner' || role === 'manager'
}

/**
 * Reserved to the owner, and deliberately narrower than `canManage`:
 *   - store settings
 *   - hiring (creating staff profiles)
 *   - the audit log, which records what managers do and so cannot be
 *     readable by them
 */
export function isOwner(role: Role): boolean {
  return role === 'owner'
}

/** Store-wide takings. Managers run the shop, so they see the numbers. */
export function canViewReports(role: Role): boolean {
  return canManage(role)
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
}

/**
 * The roles an owner may hand out when inviting someone into the store.
 *
 * 'owner' is deliberately absent. Ownership is established once, at signup, by
 * signUpOwner; no invite should be able to mint a second one. Were it listed
 * here, anyone who reached the invite form — or forged a request to the action
 * behind it — could grant themselves permanent ownership of the store.
 */
export const ASSIGNABLE_ROLES = ['manager', 'staff'] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

/**
 * Narrows a value arriving from a form or request body. The database's
 * profiles_role_check would reject an unknown string anyway, but that surfaces
 * as an opaque constraint violation rather than a message anyone can act on.
 */
export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === 'string' && (ASSIGNABLE_ROLES as readonly string[]).includes(value)
}
