export type ShiftInput = {
  staffId: string
  roleLabel: string
  shiftDate: string
  startTime: string
  endTime: string
}

export type ShiftErrors = Partial<Record<keyof ShiftInput, string>>

export type ShiftPayload = {
  staff_id: string | null
  role_label: string
  shift_date: string
  start_time: string
  end_time: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
/** Accepts HH:MM from <input type="time"> and HH:MM:SS from Postgres. */
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

/** '09:30' and '09:30:00' both become 570. */
function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export function validateShift(values: ShiftInput): ShiftErrors {
  const errors: ShiftErrors = {}

  const role = values.roleLabel.trim()
  if (!role) errors.roleLabel = 'Role is required.'
  else if (role.length > 60) errors.roleLabel = 'Role must be 60 characters or fewer.'

  if (!ISO_DATE.test(values.shiftDate.trim())) errors.shiftDate = 'Choose a date.'

  const start = values.startTime.trim()
  const end = values.endTime.trim()

  if (!TIME.test(start)) errors.startTime = 'Enter a start time.'
  if (!TIME.test(end)) errors.endTime = 'Enter an end time.'

  // Only comparable once both parse. An overnight shift would need a second
  // date column to express, so it is rejected rather than silently stored
  // backwards and rendered as a negative-height block on the grid.
  if (!errors.startTime && !errors.endTime && toMinutes(end) <= toMinutes(start)) {
    errors.endTime = 'End time must be after the start time.'
  }

  return errors
}

/** Call only after validateShift returns no errors. */
export function toShiftPayload(values: ShiftInput): ShiftPayload {
  const withSeconds = (t: string) => (t.length === 5 ? `${t}:00` : t)

  return {
    // Empty means an open, unassigned slot — the grid renders those as
    // "UNASSIGNED", so the column is deliberately nullable.
    staff_id: values.staffId.trim() || null,
    role_label: values.roleLabel.trim(),
    shift_date: values.shiftDate.trim(),
    start_time: withSeconds(values.startTime.trim()),
    end_time: withSeconds(values.endTime.trim()),
  }
}
