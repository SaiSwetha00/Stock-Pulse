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

/**
 * Everything this module says out loud. The `value`s below are NOT here: they
 * are the CHECK constraint's own strings in migration 0006, so they stay as
 * they are in every language while their labels move.
 */
export type SupportCopy = {
  catGettingStarted: string
  catInventory: string
  catSales: string
  catSuppliers: string
  catCustomers: string
  catStaff: string
  catSettings: string
  catAi: string
  catRoles: string
  catBilling: string
  catBug: string
  catOther: string
  vName: string
  vNameTooLong: string
  vEmail: string
  vEmailTooLong: string
  vEmailInvalid: string
  vCategory: string
  vMessage: string
  vMessageShort: string
  vMessageLong: string
}

/** English, and what every caller that passes nothing still gets. */
const EN_SUPPORT: SupportCopy = {
  catGettingStarted: 'Getting started',
  catInventory: 'Inventory & stock',
  catSales: 'Sales',
  catSuppliers: 'Suppliers',
  catCustomers: 'Customers',
  catStaff: 'Staff & scheduling',
  catSettings: 'Settings',
  catAi: 'AI assistant',
  catRoles: 'Roles & permissions',
  catBilling: 'Billing',
  catBug: 'Something is broken',
  catOther: 'Something else',
  vName: 'Enter your name so we know who is writing.',
  vNameTooLong: 'Name must be {n} characters or fewer.',
  vEmail: 'Enter an email address so we can reply.',
  vEmailTooLong: 'That email address is too long.',
  vEmailInvalid: 'Enter a valid email address, like you@yourshop.com.',
  vCategory: 'Choose a category.',
  vMessage: 'Tell us what is going wrong.',
  vMessageShort: 'Please add a little more detail — at least {n} characters.',
  vMessageLong: 'Please keep this under {n} characters.',
}

/** A function, not a constant: a module-scope literal cannot read a hook. */
export function supportCategories(
  copy: SupportCopy = EN_SUPPORT,
): { value: SupportCategory; label: string }[] {
  return [
    { value: 'getting-started', label: copy.catGettingStarted },
    { value: 'inventory', label: copy.catInventory },
    { value: 'sales', label: copy.catSales },
    { value: 'suppliers', label: copy.catSuppliers },
    { value: 'customers', label: copy.catCustomers },
    { value: 'staff', label: copy.catStaff },
    { value: 'settings', label: copy.catSettings },
    { value: 'ai', label: copy.catAi },
    { value: 'roles', label: copy.catRoles },
    { value: 'billing', label: copy.catBilling },
    { value: 'bug', label: copy.catBug },
    { value: 'other', label: copy.catOther },
  ]
}

/** The values the CHECK allows, independent of any language. */
const SUPPORT_CATEGORY_VALUES: SupportCategory[] = [
  'getting-started',
  'inventory',
  'sales',
  'suppliers',
  'customers',
  'staff',
  'settings',
  'ai',
  'roles',
  'billing',
  'bug',
  'other',
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
  return SUPPORT_CATEGORY_VALUES.includes(value as SupportCategory)
}

/**
 * Run by both the form and the Server Action. Client-side validation is a
 * convenience; a crafted request skips it entirely, which is why the action
 * calls this again and the database checks a third time.
 */
export function validateSupportRequest(
  values: SupportRequestInput,
  copy: SupportCopy = EN_SUPPORT,
): SupportRequestErrors {
  const errors: SupportRequestErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = copy.vName
  else if (name.length > MAX_NAME) {
    errors.name = copy.vNameTooLong.replace('{n}', String(MAX_NAME))
  }

  const email = values.email.trim()
  if (!email) errors.email = copy.vEmail
  else if (email.length > MAX_EMAIL) errors.email = copy.vEmailTooLong
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = copy.vEmailInvalid
  }

  if (!isSupportCategory(values.category)) errors.category = copy.vCategory

  const message = values.message.trim()
  if (!message) errors.message = copy.vMessage
  else if (message.length < MIN_MESSAGE) {
    errors.message = copy.vMessageShort.replace('{n}', String(MIN_MESSAGE))
  } else if (message.length > MAX_MESSAGE) {
    errors.message = copy.vMessageLong.replace('{n}', MAX_MESSAGE.toLocaleString())
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
