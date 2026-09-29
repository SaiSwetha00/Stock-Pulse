'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAppCopy } from '@/lib/i18n/client'
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
  const t = useAppCopy()
  const ts = t.suppliers
  const [error, setError] = useState('')
  const [deleting, startTransition] = useTransition()

  function handleDelete() {
    if (deleting) return
    setError('')

    startTransition(async () => {
      const result = await deleteSupplier(supplier.id)

      if (!result.ok) {
        setError(result.message ?? ts.deleteFailed)
        toast.error(ts.deleteFailedToast, result.message)
        return
      }

      toast.success(ts.deletedToast, supplier.name)

      // revalidatePath alone does not repaint the client; see SupplierModal.
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title={ts.deleteTitle} onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          {ts.deleteBodyA}
          <span className="font-semibold text-foreground">{supplier.name}</span>
          {ts.deleteBodyB}
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            {ts.deleteConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
