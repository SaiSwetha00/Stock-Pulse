'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAppCopy } from '@/lib/i18n/client'
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
  const t = useAppCopy()
  const ts = t.staff
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
        setError(result.message ?? ts.deleteShiftFailed)
        toast.error(ts.deleteShiftFailedToast, result.message)
        return
      }

      toast.success(ts.shiftDeleted, `${shift.role_label} · ${shift.shift_date}`)

      // revalidatePath alone does not repaint the client; see ShiftModal.
      router.refresh()
      onClose()
    })
  }

  const who = shift.profiles?.full_name ?? ts.unassignedSlot
  const when = `${shift.shift_date}, ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)}`

  return (
    <Modal title={ts.deleteShiftTitle} onClose={onClose} width="sm">
      <div className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted-strong">
          {ts.deleteShiftA}
          <span className="font-semibold text-foreground">{shift.role_label}</span>
          {ts.deleteShiftB}
          <span className="font-semibold text-foreground">{who}</span>
          {ts.deleteShiftC}
          <span className="font-semibold text-foreground">{when}</span>
          {ts.deleteShiftD}
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            {t.common.delete}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
