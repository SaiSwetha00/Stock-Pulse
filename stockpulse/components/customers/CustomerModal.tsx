'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { saveCustomer } from '@/app/(dashboard)/customers/actions'
import {
  validateCustomer,
  LOYALTY_TIERS as TIERS,
  type CustomerErrors,
  type CustomerInput,
} from '@/lib/validation/customer'
import { LOYALTY_TIER_LABELS, type Customer, type LoyaltyTier } from '@/types'

/**
 * Pure so it can be exercised without mounting the form. Values arrive as the
 * raw strings the inputs hold, not as numbers.
 */
/**
 * Add or edit a customer. Passing `customer` switches the modal to edit mode;
 * omitting it creates a new record.
 *
 * storeId is intentionally absent: the Server Action reads it from the session,
 * so the browser can no longer choose which store it writes into.
 */
export default function CustomerModal({
  customer,
  onClose,
}: {
  customer?: Customer | null
  onClose: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(customer)

  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [tier, setTier] = useState<LoyaltyTier>(customer?.loyalty_tier ?? 'bronze')
  const [totalSpent, setTotalSpent] = useState(String(customer?.total_spent ?? '0'))
  const [visits, setVisits] = useState(String(customer?.visits ?? '0'))
  const [notes, setNotes] = useState(customer?.notes ?? '')

  const toast = useToast()
  const [errors, setErrors] = useState<CustomerErrors>({})
  const [formError, setFormError] = useState('')

  // Holds `saving` true across the whole action round-trip *including* the
  // revalidation it triggers, so the modal cannot close over stale rows.
  const [saving, startTransition] = useTransition()

  function currentInput(): CustomerInput {
    return { fullName, email, phone, loyaltyTier: tier, totalSpent, visits, notes }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const input = currentInput()

    // Client pass for instant feedback; the action re-checks regardless.
    const found = validateCustomer(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    startTransition(async () => {
      const result = await saveCustomer(input, customer?.id)

      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFormError(result.message ?? 'Could not save the customer.')
        toast.error(isEdit ? 'Could not update customer' : 'Could not add customer', result.message)
        return
      }

      // revalidatePath clears the server cache; router.refresh() is what makes
      // the client refetch. Both are needed — verified in production, where
      // revalidatePath alone left the table stale until a manual reload.
      toast.success(isEdit ? 'Customer updated' : 'Customer added', input.fullName)
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      title={isEdit ? 'Edit Customer' : 'Add Customer'} onClose={onClose}
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
            {isEdit ? 'Save Changes' : 'Add Customer'}
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

        <Field label="Full Name" required error={errors.fullName}>
          {(p) => (
            <Input {...p} value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email} hint="Optional">
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            )}
          </Field>

          <Field label="Phone" hint="Optional">
            {(p) => (
              <Input
                {...p}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0100"
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Loyalty Tier">
            {(p) => (
              <Select {...p} value={tier} onChange={(e) => setTier(e.target.value as LoyaltyTier)}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {LOYALTY_TIER_LABELS[t]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Total Spent" error={errors.totalSpent}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min="0"
                step="0.01"
                value={totalSpent}
                onChange={(e) => setTotalSpent(e.target.value)}
              />
            )}
          </Field>

          <Field label="Visits" error={errors.visits}>
            {(p) => (
              <Input
                {...p}
                type="number"
                min="0"
                step="1"
                value={visits}
                onChange={(e) => setVisits(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="Notes" hint="Allergies, preferences, anything worth remembering">
          {(p) => (
            <Textarea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          )}
        </Field>
</form>
    </Modal>
  )
}
