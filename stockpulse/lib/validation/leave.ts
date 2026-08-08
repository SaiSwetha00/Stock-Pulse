import { LEAVE_KIND_LABELS, type LeaveKind } from '@/types'

export type LeaveInput = {
  staffId: string
  startsOn: string
  endsOn: string
  kind: string
  note: string
}

export type LeaveErrors = Partial<Record<keyof LeaveInput, string>>

export type LeavePayload = {
  staff_id: string
  starts_on: string
  ends_on: string
  kind: LeaveKind
  note: string | null
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The longest single entry the form will accept, in days. */
const MAX_SPAN_DAYS = 366

const KINDS = Object.keys(LEAVE_KIND_LABELS) as LeaveKind[]

export function isLeaveKind(value: unknown): value is LeaveKind {
  return typeof value === 'string' && (KINDS as readonly string[]).includes(value)
}

/** Whole days between two YYYY-MM-DD strings, inclusive of both ends. */
export function leaveSpanDays(startsOn: string, endsOn: string): number {
  const a = new Date(`${startsOn}T00:00:00`).getTime()
  const b = new Date(`${endsOn}T00:00:00`).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.round((b - a) / 86_400_000) + 1
}

export function validateLeave(values: LeaveInput): LeaveErrors {
  const errors: LeaveErrors = {}

  // Unlike a shift, leave cannot be unassigned — an absence belongs to a
  // person by definition, and the column is NOT NULL.
  if (!values.staffId.trim()) errors.staffId = 'Choose who this leave is for.'

  const start = values.startsOn.trim()
  const end = values.endsOn.trim()

  if (!ISO_DATE.test(start)) errors.startsOn = 'Choose a start date.'
  if (!ISO_DATE.test(end)) errors.endsOn = 'Choose an end date.'

  if (!errors.startsOn && !errors.endsOn) {
    const span = leaveSpanDays(start, end)
    // Mirrors the staff_leave_range_valid constraint. Checked here so the
    // user sees which field is wrong rather than an opaque 23514.
    if (span < 1) {
      errors.endsOn = 'The end date cannot be before the start date.'
    } else if (span > MAX_SPAN_DAYS) {
      // Not a business rule so much as a typo guard: a mistyped year turns
      // one day off into a decade of blocked scheduling, and nothing else in
      // the app would flag it.
      errors.endsOn = `That is ${span} days. Enter a year or less per entry.`
    }
  }

  if (!isLeaveKind(values.kind)) errors.kind = 'Choose a leave type.'

  if (values.note.trim().length > 200) {
    errors.note = 'Note must be 200 characters or fewer.'
  }

  return errors
}

/** Call only after validateLeave returns no errors. */
export function toLeavePayload(values: LeaveInput): LeavePayload {
  return {
    staff_id: values.staffId.trim(),
    starts_on: values.startsOn.trim(),
    ends_on: values.endsOn.trim(),
    // Narrowed by validateLeave; this cast is safe only because callers are
    // required to validate first.
    kind: values.kind as LeaveKind,
    // An empty string would render as a blank line in the rota tooltip rather
    // than being absent.
    note: values.note.trim() || null,
  }
}

/**
 * Does an inclusive leave range cover a given day?
 *
 * String comparison, not Date arithmetic. YYYY-MM-DD sorts lexicographically
 * in the same order it sorts chronologically, so this needs no timezone and
 * cannot drift by a day the way `new Date(iso)` does either side of UTC
 * midnight — which is exactly the bug that would let someone be rostered on
 * the first morning of their holiday.
 */
export function leaveCoversDay(
  leave: { starts_on: string; ends_on: string },
  isoDay: string,
): boolean {
  return leave.starts_on <= isoDay && leave.ends_on >= isoDay
}
