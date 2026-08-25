'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { updateTeamMember } from '@/app/(dashboard)/staff/teamActions'
import { ASSIGNABLE_ROLES, ROLE_LABELS, type AssignableRole } from '@/lib/permissions'
import type { Profile } from '@/types'

/** What each role actually means, for someone choosing between them. */
const ROLE_HINTS: Record<AssignableRole, string> = {
  manager: 'Runs the shop: inventory, customers, suppliers, shifts and takings.',
  staff: 'Works the floor: view stock, log sales, see their own shifts.',
}

const INPUT =
  'control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm transition-colors focus:border-border-strong focus:bg-surface focus:outline-none'

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong'

/**
 * Edit one team member's name, job title and role.
 *
 * The email is shown but not editable. Changing it here would update the
 * profile row and leave `auth.users.email` — the address they actually sign in
 * with — untouched, so the app would display an address that does not work.
 * Moving both is a verified-email flow, not a text input.
 *
 * The owner's own row never reaches this dialog: TeamRosterClient offers no
 * edit control for it, and `updateTeamMember` refuses it server-side as well.
 */
export default function EditStaffModal({
  member,
  onClose,
}: {
  member: Profile
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [fullName, setFullName] = useState(member.full_name)
  const [jobTitle, setJobTitle] = useState(member.job_title ?? '')
  const [role, setRole] = useState<AssignableRole>(
    member.role === 'manager' ? 'manager' : 'staff',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const dirty =
    fullName !== member.full_name ||
    jobTitle !== (member.job_title ?? '') ||
    role !== member.role

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await updateTeamMember({
      profileId: member.id,
      fullName,
      jobTitle,
      role,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      toast.error('Could not save changes', result.message)
      return
    }
    toast.success('Team member updated', fullName)
    // The row is server-rendered, so the table only shows the new role once
    // the route re-renders.
    router.refresh()
    onClose()
  }

  return (
    <Modal
      title={`Edit ${member.full_name}`} onClose={onClose} width="sm"
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
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving} disabled={!dirty}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div role="alert" className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-staff-name" className={LABEL}>
            Full Name
          </label>
          <input
            id="edit-staff-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={INPUT}
          />
        </div>

        <div>
          <p className={LABEL}>Work Email</p>
          <p className="rounded-lg border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-muted">
            {member.email}
          </p>
          <p className="mt-1.5 text-xs text-muted">
            The sign-in address cannot be changed here.
          </p>
        </div>

        <div>
          <label htmlFor="edit-staff-title" className={LABEL}>
            Job Title
          </label>
          <input
            id="edit-staff-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Cashier, Inventory Lead…"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="edit-staff-role" className={LABEL}>
            Role
          </label>
          <select
            id="edit-staff-role"
            value={role}
            aria-describedby="edit-staff-role-hint"
            onChange={(e) => setRole(e.target.value as AssignableRole)}
            className={INPUT}
          >
            {ASSIGNABLE_ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </select>
          <p id="edit-staff-role-hint" className="mt-1.5 text-xs text-muted">
            {ROLE_HINTS[role]}
          </p>
        </div>
</form>
    </Modal>
  )
}
