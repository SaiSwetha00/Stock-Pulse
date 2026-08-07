import type { LoyaltyTier } from '@/types'

export const LOYALTY_TIERS: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type CustomerInput = {
  fullName: string
  email: string
  phone: string
  loyaltyTier: string
  totalSpent: string
  visits: string
  notes: string
}

export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>

export type CustomerPayload = {
  full_name: string
  email: string | null
  phone: string | null
  loyalty_tier: LoyaltyTier
  total_spent: number
  visits: number
  notes: string | null
}

/**
 * Extracted from CustomerModal so the Server Action can run the same rules.
 * Client-side validation is a convenience; a crafted request skips it entirely.
 */
export function validateCustomer(values: CustomerInput): CustomerErrors {
  const errors: CustomerErrors = {}

  const name = values.fullName.trim()
  if (!name) errors.fullName = 'Name is required.'
  else if (name.length > 120) errors.fullName = 'Name must be 120 characters or fewer.'

  const email = values.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!LOYALTY_TIERS.includes(values.loyaltyTier as LoyaltyTier)) {
    errors.loyaltyTier = 'Choose a valid tier.'
  }

  // A blank numeric input reads as '' — treat it as 0 rather than NaN.
  const spent = Number(values.totalSpent.trim() || '0')
  if (!Number.isFinite(spent) || spent < 0) errors.totalSpent = 'Must be zero or more.'

  const visits = Number(values.visits.trim() || '0')
  if (!Number.isInteger(visits) || visits < 0) {
    errors.visits = 'Must be a whole number, zero or more.'
  }

  return errors
}

/** Call only after validateCustomer returns no errors. */
export function toCustomerPayload(values: CustomerInput): CustomerPayload {
  return {
    full_name: values.fullName.trim(),
    // Blank must stay NULL: the partial unique index on lower(email) would
    // otherwise collide on the second customer with no email.
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    loyalty_tier: values.loyaltyTier as LoyaltyTier,
    total_spent: Number(values.totalSpent.trim() || '0'),
    visits: Number(values.visits.trim() || '0'),
    notes: values.notes.trim() || null,
  }
}
