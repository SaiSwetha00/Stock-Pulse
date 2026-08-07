'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from '@/app/(dashboard)/customers/actions'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import type { Customer } from '@/types'

export default function DeleteCustomerDialog({
  customer,
  onClose,
}: {
  customer: Customer
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [error, setError] = useState('')
  // Stays true through the action *and* its revalidation, so the dialog can't
  // close over a table that still shows the deleted row.
  const [deleting, startTransition] = useTransition()

  function handleDelete() {
    if (deleting) return
    setError('')

    startTransition(async () => {
      const result = await deleteCustomer(customer.id)

      if (!result.ok) {
        setError(result.message ?? 'Could not delete the customer.')
        toast.error('Could not delete customer', result.message)
        return
      }

      toast.success('Customer deleted', customer.full_name)

      // revalidatePath alone does not repaint the client; see CustomerModal.
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title="Delete Customer" onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          Delete <span className="font-semibold text-foreground">{customer.full_name}</span> and their
          purchase history? This cannot be undone.
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
