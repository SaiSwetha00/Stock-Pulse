'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { saveShift } from '@/app/(dashboard)/staff/actions'
import { leaveCoversDay } from '@/lib/validation/leave'
import { validateShift, type ShiftErrors, type ShiftInput } from '@/lib/validation/shift'
import { LEAVE_KIND_LABELS, type Profile, type Shift, type StaffLeave } from '@/types'

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
  leave,
  weekDates,
  onClose,
}: {
  shift?: Shift | null
  staff: Profile[]
  /** Leave overlapping the visible week, for the clash warning below. */
  leave: StaffLeave[]
  weekDates: string[]
  onClose: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(shift)

  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
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

  /**
   * The chosen person's leave on the chosen day, if any.
   *
   * A warning, not a block — saveShift is what actually refuses, because this
   * only knows about leave in the week the page loaded and a stale tab knows
   * about none of it. The point of showing it here is that being told before
   * you fill in two times and press save is better than being told after.
   *
   * An unassigned shift (`staffId === ''`) is nobody's leave, hence the guard.
   */
  const leaveClash = staffId
    ? leave.find((l) => l.staff_id === staffId && leaveCoversDay(l, shiftDate)) ?? null
    : null

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
    <Modal
      title={isEdit ? 'Edit Shift' : 'Assign Shift'} onClose={onClose} width="md"
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
            {isEdit ? 'Save Changes' : 'Assign Shift'}
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

        {leaveClash && (
          <p
            role="status"
            className="rounded-lg bg-warning-bg px-3.5 py-2.5 text-sm text-warning"
          >
            {leaveClash.profiles?.full_name ?? 'That person'} is on{' '}
            {LEAVE_KIND_LABELS[leaveClash.kind].toLowerCase()} from {leaveClash.starts_on} to{' '}
            {leaveClash.ends_on}. This shift will not save.
          </p>
        )}

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
</form>
    </Modal>
  )
}
