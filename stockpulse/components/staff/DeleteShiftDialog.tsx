'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { deleteShift } from '@/app/(dashboard)/staff/actions'
import type { Shift } from '@/types'

export default function DeleteShiftDialog({
  shift,
  onClose,
}: {
  shift: Shift
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
      const result = await deleteShift(shift.id)

      if (!result.ok) {
        setError(result.message ?? 'Could not delete the shift.')
        toast.error('Could not delete shift', result.message)
        return
      }

      toast.success('Shift deleted', `${shift.role_label} · ${shift.shift_date}`)

      // revalidatePath alone does not repaint the client; see ShiftModal.
      router.refresh()
      onClose()
    })
  }

  const who = shift.profiles?.full_name ?? 'the unassigned slot'
  const when = `${shift.shift_date}, ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`

  return (
    <Modal title="Delete Shift" onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          Remove the <span className="font-semibold text-foreground">{shift.role_label}</span> shift
          for <span className="font-semibold text-foreground">{who}</span> on{' '}
          <span className="font-semibold text-foreground">{when}</span>? This cannot be undone.
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
