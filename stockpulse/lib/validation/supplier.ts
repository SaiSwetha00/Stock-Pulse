import type { SupplierCategory, SupplierStatus } from '@/types'

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'produce',
  'dairy',
  'dry_goods',
  'beverages',
  'bakery',
]

export const SUPPLIER_STATUSES: SupplierStatus[] = ['active', 'inactive', 'issue']

export type SupplierInput = {
  name: string
  primaryContact: string
  category: string
  status: string
}

export type SupplierErrors = Partial<Record<keyof SupplierInput, string>>

export type SupplierPayload = {
  name: string
  primary_contact: string | null
  category: SupplierCategory
  status: SupplierStatus
}

/**
 * Category and status are checked against the same lists the database CHECK
 * constraints enforce, so a bad value fails with a readable message instead of
 * a raw Postgres constraint violation.
 */
export function validateSupplier(values: SupplierInput): SupplierErrors {
  const errors: SupplierErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = 'Supplier name is required.'
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer.'

  if (values.primaryContact.trim().length > 120) {
    errors.primaryContact = 'Contact must be 120 characters or fewer.'
  }

  if (!SUPPLIER_CATEGORIES.includes(values.category as SupplierCategory)) {
    errors.category = 'Choose a valid category.'
  }

  if (!SUPPLIER_STATUSES.includes(values.status as SupplierStatus)) {
    errors.status = 'Choose a valid status.'
  }

  return errors
}

/** Call only after validateSupplier returns no errors. */
export function toSupplierPayload(values: SupplierInput): SupplierPayload {
  return {
    name: values.name.trim(),
    primary_contact: values.primaryContact.trim() || null,
    category: values.category as SupplierCategory,
    status: values.status as SupplierStatus,
  }
}
