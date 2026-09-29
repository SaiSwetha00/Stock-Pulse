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
/** The words, separate from the rules. English when no dictionary is given. */
export type SupplierValidationCopy = {
  vNameRequired: string
  vNameTooLong: string
  vContactTooLong: string
  vCategoryInvalid: string
  vStatusInvalid: string
}

const EN_SUPPLIER: SupplierValidationCopy = {
  vNameRequired: 'Supplier name is required.',
  vNameTooLong: 'Name must be 120 characters or fewer.',
  vContactTooLong: 'Contact must be 120 characters or fewer.',
  vCategoryInvalid: 'Choose a valid category.',
  vStatusInvalid: 'Choose a valid status.',
}

export function validateSupplier(
  values: SupplierInput,
  copy: SupplierValidationCopy = EN_SUPPLIER,
): SupplierErrors {
  const errors: SupplierErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = copy.vNameRequired
  else if (name.length > 120) errors.name = copy.vNameTooLong

  if (values.primaryContact.trim().length > 120) {
    errors.primaryContact = copy.vContactTooLong
  }

  if (!SUPPLIER_CATEGORIES.includes(values.category as SupplierCategory)) {
    errors.category = copy.vCategoryInvalid
  }

  if (!SUPPLIER_STATUSES.includes(values.status as SupplierStatus)) {
    errors.status = copy.vStatusInvalid
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
