'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { saveSupplier } from '@/app/(dashboard)/suppliers/actions'
import {
  validateSupplier,
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  type SupplierErrors,
  type SupplierInput,
} from '@/lib/validation/supplier'
import { SUPPLIER_CATEGORY_LABELS, type Supplier } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  issue: 'Issue',
}

/**
 * Add or edit a supplier. Passing `supplier` switches to edit mode.
 *
 * No storeId prop: the Server Action reads the store from the session, so the
 * browser cannot choose which store it writes into.
 */
export default function SupplierModal({
  supplier,
  onClose,
}: {
  supplier?: Supplier | null
  onClose: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(supplier)

  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [name, setName] = useState(supplier?.name ?? '')
  const [primaryContact, setPrimaryContact] = useState(supplier?.primary_contact ?? '')
  const [category, setCategory] = useState<string>(supplier?.category ?? 'produce')
  const [status, setStatus] = useState<string>(supplier?.status ?? 'active')

  const toast = useToast()
  const [errors, setErrors] = useState<SupplierErrors>({})
  const [formError, setFormError] = useState('')

  // Held across the action *and* its revalidation, so the modal cannot close
  // over a table that has not been re-fetched.
  const [saving, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const input: SupplierInput = { name, primaryContact, category, status }

    const found = validateSupplier(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    startTransition(async () => {
      const result = await saveSupplier(input, supplier?.id)

      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFormError(result.message ?? 'Could not save the supplier.')
        toast.error(isEdit ? 'Could not update supplier' : 'Could not add supplier', result.message)
        return
      }

      // revalidatePath clears the server cache but does not repaint the client.
      // Verified in production: without this the row only appeared after a
      // manual reload. Awaited inside the transition so `saving` stays true
      // until the table has actually re-rendered.
      toast.success(isEdit ? 'Supplier updated' : 'Supplier added', input.name)
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      title={isEdit ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose} width="md"
      /*
        Actions live in Modal's `footer`, not at the end of the form. `children`
        scrolls; `footer` is pinned, shrink-0, and carries the
        safe-area-inset-bottom padding. Left inside the form these buttons
        scroll away on a short viewport, which is the bug ProductModal was
        reported for - this modal had the identical shape.

        The submit sits outside <form> now and carries `form={formId}`, the
        attribute that associates a control with a form it is not nested in.
        Native submission, native validation and the Enter key all keep
        working; an onClick handler would have discarded all three.
      */
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} fullWidth loading={saving}>
            {isEdit ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {formError && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {formError}
          </div>
        )}

        <Field label="Supplier Name" required error={errors.name}>
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}
        </Field>

        <Field label="Primary Contact" error={errors.primaryContact} hint="Optional">
          {(p) => (
            <Input
              {...p}
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              placeholder="Jane Doe"
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
                {SUPPLIER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {SUPPLIER_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Status" error={errors.status}>
            {(p) => (
              <Select {...p} value={status} onChange={(e) => setStatus(e.target.value)}>
                {SUPPLIER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
</form>
    </Modal>
  )
}
