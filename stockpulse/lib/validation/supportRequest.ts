import type { HelpCategoryKey } from '@/lib/help/articles'

/**
 * Categories a support request can be filed under.
 *
 * A superset of HelpCategoryKey: 'billing' and 'bug' have no help article to
 * point at but are among the most common reasons anyone writes in, and 'other'
 * is the honest default. Must stay in step with the CHECK constraint on
 * support_requests.category in migration 0006 — the database rejects anything
 * else, and an unlisted value would surface as an opaque constraint violation
 * rather than a message the sender can act on.
 */
export type SupportCategory = HelpCategoryKey | 'billing' | 'bug' | 'other'

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: 'getting-started', label: 'Getting started' },
  { value: 'inventory', label: 'Inventory & stock' },
  { value: 'sales', label: 'Sales' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'customers', label: 'Customers' },
  { value: 'staff', label: 'Staff & scheduling' },
  { value: 'settings', label: 'Settings' },
  { value: 'ai', label: 'AI assistant' },
  { value: 'roles', label: 'Roles & permissions' },
  { value: 'billing', label: 'Billing' },
  { value: 'bug', label: 'Something is broken' },
  { value: 'other', label: 'Something else' },
]

/** Raw form values, as the inputs hold them: strings, possibly blank. */
export type SupportRequestInput = {
  name: string
  email: string
  category: string
  message: string
}

export type SupportRequestErrors = Partial<Record<keyof SupportRequestInput, string>>

export type SupportRequestPayload = {
  name: string
  email: string
  category: SupportCategory
  message: string
}

/** Mirrors the length checks in migration 0006 so the two cannot disagree. */
const MAX_NAME = 120
const MAX_EMAIL = 255
export const MIN_MESSAGE = 10
export const MAX_MESSAGE = 5000

function isSupportCategory(value: string): value is SupportCategory {
  return SUPPORT_CATEGORIES.some((c) => c.value === value)
}

/**
 * Run by both the form and the Server Action. Client-side validation is a
 * convenience; a crafted request skips it entirely, which is why the action
 * calls this again and the database checks a third time.
 */
export function validateSupportRequest(values: SupportRequestInput): SupportRequestErrors {
  const errors: SupportRequestErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = 'Enter your name so we know who is writing.'
  else if (name.length > MAX_NAME) errors.name = `Name must be ${MAX_NAME} characters or fewer.`

  const email = values.email.trim()
  if (!email) errors.email = 'Enter an email address so we can reply.'
  else if (email.length > MAX_EMAIL) errors.email = 'That email address is too long.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address, like you@yourshop.com.'
  }

  if (!isSupportCategory(values.category)) errors.category = 'Choose a category.'

  const message = values.message.trim()
  if (!message) errors.message = 'Tell us what is going wrong.'
  else if (message.length < MIN_MESSAGE) {
    errors.message = `Please add a little more detail — at least ${MIN_MESSAGE} characters.`
  } else if (message.length > MAX_MESSAGE) {
    errors.message = `Please keep this under ${MAX_MESSAGE.toLocaleString()} characters.`
  }

  return errors
}

/** Call only after validateSupportRequest returns no errors. */
export function toSupportRequestPayload(values: SupportRequestInput): SupportRequestPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    category: values.category as SupportCategory,
    message: values.message.trim(),
  }
}
