'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { saveShift } from '@/app/(dashboard)/staff/actions'
import { validateShift, type ShiftErrors, type ShiftInput } from '@/lib/validation/shift'
import type { Profile, Shift } from '@/types'

const ROLE_LABELS = ['Front Desk', 'Produce', 'Dairy/Frozen', 'Manager', 'Receiving', 'Bakery']

/** Postgres `time` comes back as HH:MM:SS; <input type="time"> wants HH:MM. */
function toInputTime(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  return value.slice(0, 5)
}

/**
 * Assign or edit a shift. Passing `shift` switches to edit mode.
 *
 * No storeId prop: the Server Action reads the store from the session.
 */
export default function ShiftModal({
  shift,
  staff,
  weekDates,
  onClose,
}: {
  shift?: Shift | null
  staff: Profile[]
  weekDates: string[]
  onClose: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(shift)

  const [staffId, setStaffId] = useState(shift?.staff_id ?? '')
  const [roleLabel, setRoleLabel] = useState(shift?.role_label ?? ROLE_LABELS[0])
  const [shiftDate, setShiftDate] = useState(shift?.shift_date ?? weekDates[0])
  const [startTime, setStartTime] = useState(toInputTime(shift?.start_time, '09:00'))
  const [endTime, setEndTime] = useState(toInputTime(shift?.end_time, '17:00'))

  const toast = useToast()
  const [errors, setErrors] = useState<ShiftErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, startTransition] = useTransition()

  // An edited shift may sit outside the week currently on screen, so its own
  // date has to remain selectable.
  const dateOptions =
    shiftDate && !weekDates.includes(shiftDate) ? [shiftDate, ...weekDates] : weekDates

  // A role carried over from older data may not be in the preset list.
  const roleOptions =
    roleLabel && !ROLE_LABELS.includes(roleLabel) ? [roleLabel, ...ROLE_LABELS] : ROLE_LABELS

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const input: ShiftInput = { staffId, roleLabel, shiftDate, startTime, endTime }

    const found = validateShift(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    startTransition(async () => {
      const result = await saveShift(input, shift?.id)

      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFormError(result.message ?? 'Could not save the shift.')
        toast.error(isEdit ? 'Could not update shift' : 'Could not schedule shift', result.message)
        return
      }

      // revalidatePath clears the server cache but does not repaint the client;
      // without this the grid only updates after a manual reload.
      toast.success(isEdit ? 'Shift updated' : 'Shift scheduled', `${input.roleLabel} · ${input.shiftDate}`)
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title={isEdit ? 'Edit Shift' : 'Assign Shift'} onClose={onClose} width="md">
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {formError && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {formError}
          </div>
        )}

        <Field
          label="Team Member"
          error={errors.staffId}
          hint="Leave unassigned to post an open shift"
        >
          {(p) => (
            <Select {...p} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Role" required error={errors.roleLabel}>
          {(p) => (
            <Select {...p} value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Date" required error={errors.shiftDate}>
          {(p) => (
            <Select {...p} value={shiftDate} onChange={(e) => setShiftDate(e.target.value)}>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Time" required error={errors.startTime}>
            {(p) => (
              <Input
                {...p}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
          </Field>

          <Field label="End Time" required error={errors.endTime}>
            {(p) => (
              <Input
                {...p}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={saving}>
            {isEdit ? 'Save Changes' : 'Assign Shift'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
