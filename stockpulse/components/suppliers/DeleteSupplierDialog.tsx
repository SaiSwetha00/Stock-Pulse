'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { deleteSupplier } from '@/app/(dashboard)/suppliers/actions'
import type { Supplier } from '@/types'

export default function DeleteSupplierDialog({
  supplier,
  onClose,
}: {
  supplier: Supplier
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [error, setError] = useState('')
  const [deleting, startTransition] = useTransition()

  function handleDelete() {
    if (deleting) return
    setError('')

    startTransition(async () => {
      const result = await deleteSupplier(supplier.id)

      if (!result.ok) {
        setError(result.message ?? 'Could not delete the supplier.')
        toast.error('Could not delete supplier', result.message)
        return
      }

      toast.success('Supplier deleted', supplier.name)

      // revalidatePath alone does not repaint the client; see SupplierModal.
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title="Delete Supplier" onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          Delete <span className="font-semibold text-foreground">{supplier.name}</span>? Any incoming
          shipments recorded against them, and their entries in the activity feed, are removed too.
          This cannot be undone.
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
