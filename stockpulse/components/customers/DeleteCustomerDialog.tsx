'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCustomer } from '@/app/(dashboard)/customers/actions'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAppCopy } from '@/lib/i18n/client'
import Button from '@/components/ui/Button'
import type { Customer } from '@/types'

export default function DeleteCustomerDialog({
  customer,
  onClose,
}: {
  customer: Customer
  onClose: () => void
}) {
  const t = useAppCopy()
  const tc = t.customers
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
        setError(result.message ?? tc.deleteFailed)
        toast.error(tc.deleteFailedToast, result.message)
        return
      }

      toast.success(tc.deletedToast, customer.full_name)

      // revalidatePath alone does not repaint the client; see CustomerModal.
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title={tc.deleteTitle} onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          {tc.deleteBodyA}
          <span className="font-semibold text-foreground">{customer.full_name}</span>
          {tc.deleteBodyB}
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            {tc.deleteConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
