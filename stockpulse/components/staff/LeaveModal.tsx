'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Trash2 } from 'lucide-react'
import { deleteLeave, saveLeave } from '@/app/(dashboard)/staff/leaveActions'
import { leaveSpanDays, type LeaveErrors } from '@/lib/validation/leave'
import { LEAVE_KIND_LABELS, type LeaveKind, type Profile, type StaffLeave } from '@/types'

const INPUT =
  'control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm transition-colors focus:border-border-strong focus:bg-surface focus:outline-none'

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong'

const KINDS = Object.keys(LEAVE_KIND_LABELS) as LeaveKind[]

/**
 * Record or edit one absence.
 *
 * A single day and a fortnight are the same form: `ends_on` seeds from
 * `starts_on`, so marking one day off is picking one date and pressing save.
 * Making the common case require touching two fields is how a feature ends up
 * unused.
 */
export default function LeaveModal({
  leave,
  staff,
  defaultDate,
  onClose,
}: {
  /** null opens a blank form; a row opens it prefilled for editing. */
  leave: StaffLeave | null
  staff: Profile[]
  /** The day whose column was clicked, so the form opens on it. */
  defaultDate: string
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()

  const [staffId, setStaffId] = useState(leave?.staff_id ?? staff[0]?.id ?? '')
  const [startsOn, setStartsOn] = useState(leave?.starts_on ?? defaultDate)
  const [endsOn, setEndsOn] = useState(leave?.ends_on ?? defaultDate)
  const [kind, setKind] = useState<LeaveKind>(leave?.kind ?? 'holiday')
  const [note, setNote] = useState(leave?.note ?? '')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<LeaveErrors>({})
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function handleDelete() {
    if (!leave) return
    setConfirmingDelete(false)
    setSaving(true)
    const result = await deleteLeave(leave.id)
    setSaving(false)
    if (!result.ok) {
      toast.error('Could not remove leave', result.message ?? '')
      return
    }
    toast.success('Leave removed', leave.profiles?.full_name ?? undefined)
    router.refresh()
    onClose()
  }

  // Derived during render rather than synchronised in an effect — see
  // DECISIONS.md D14. Moving the start past the end drags the end with it,
  // which is what someone extending a booking forwards actually means.
  const effectiveEnd = endsOn < startsOn ? startsOn : endsOn
  const span = leaveSpanDays(startsOn, effectiveEnd)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setMessage('')

    const result = await saveLeave(
      { staffId, startsOn, endsOn: effectiveEnd, kind, note },
      leave?.id,
    )
    setSaving(false)

    if (!result.ok) {
      setErrors(result.errors ?? {})
      setMessage(result.message ?? '')
      if (result.message) toast.error('Could not save leave', result.message)
      return
    }

    const who = staff.find((s) => s.id === staffId)?.full_name ?? 'Team member'
    toast.success(
      leave ? 'Leave updated' : 'Leave recorded',
      span === 1 ? `${who}, ${startsOn}` : `${who}, ${startsOn} to ${effectiveEnd}`,
    )
    router.refresh()
    onClose()
  }

  return (
    <Modal title={leave ? 'Edit leave' : 'Record leave'} onClose={onClose} width="sm">
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {message && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {message}
          </div>
        )}

        <div>
          <label htmlFor="leave-staff" className={LABEL}>
            Who
          </label>
          <select
            id="leave-staff"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            aria-invalid={errors.staffId ? true : undefined}
            className={INPUT}
          >
            {/* No "Unassigned" option, unlike the shift form. An absence
                without a person is not a thing, and the column is NOT NULL. */}
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          {errors.staffId && <p className="mt-1.5 text-xs text-danger">{errors.staffId}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="leave-start" className={LABEL}>
              First day
            </label>
            <input
              id="leave-start"
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              aria-invalid={errors.startsOn ? true : undefined}
              className={INPUT}
            />
            {errors.startsOn && <p className="mt-1.5 text-xs text-danger">{errors.startsOn}</p>}
          </div>
          <div>
            <label htmlFor="leave-end" className={LABEL}>
              Last day
            </label>
            <input
              id="leave-end"
              type="date"
              value={effectiveEnd}
              // The browser's own constraint, so the invalid state is
              // unreachable rather than merely rejected.
              min={startsOn || undefined}
              onChange={(e) => setEndsOn(e.target.value)}
              aria-invalid={errors.endsOn ? true : undefined}
              className={INPUT}
            />
            {errors.endsOn && <p className="mt-1.5 text-xs text-danger">{errors.endsOn}</p>}
          </div>
        </div>

        {/* Both dates are inclusive, which is not self-evident from two date
            pickers — this line is what makes "1 day" visible when someone
            picks the same date twice. */}
        <p className="text-xs text-muted">
          {span > 0 && `${span} day${span === 1 ? '' : 's'} off, including both dates.`}
        </p>

        <div>
          <label htmlFor="leave-kind" className={LABEL}>
            Type
          </label>
          <select
            id="leave-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as LeaveKind)}
            aria-invalid={errors.kind ? true : undefined}
            className={INPUT}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {LEAVE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          {errors.kind && <p className="mt-1.5 text-xs text-danger">{errors.kind}</p>}
        </div>

        <div>
          <label htmlFor="leave-note" className={LABEL}>
            Note <span className="font-normal normal-case text-muted">(optional)</span>
          </label>
          <input
            id="leave-note"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Covering arranged with Priya"
            aria-invalid={errors.note ? true : undefined}
            className={INPUT}
          />
          {errors.note && <p className="mt-1.5 text-xs text-danger">{errors.note}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          {/* Removing leave lives here rather than behind its own dialog: it
              frees the person up for scheduling again, which is reversible and
              destroys nothing. The inline confirm is enough — a modal on top
              of a modal for that is heavier than the action deserves. */}
          {leave && (
            <div className="mr-auto">
              {confirmingDelete ? (
                <span className="inline-flex items-center gap-2 text-xs">
                  <span className="text-muted-strong">Remove this leave?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md px-1.5 py-1 font-semibold text-danger hover:underline"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-md px-1.5 py-1 font-semibold text-muted hover:underline"
                  >
                    No
                  </button>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              )}
            </div>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={staff.length === 0}>
            {leave ? 'Save changes' : 'Record leave'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
