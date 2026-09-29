'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { inviteStaff } from '@/app/auth/actions'
import { ASSIGNABLE_ROLES, type AssignableRole } from '@/lib/permissions'
import { useAppCopy } from '@/lib/i18n/client'
import type { StaffCopy } from '@/lib/i18n/app'

/** What each role actually means, for someone choosing between them. */
function roleHints(t: StaffCopy): Record<AssignableRole, string> {
  return { manager: t.roleHintManager, staff: t.roleHintStaff }
}

export default function AddStaffModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const t = useAppCopy()
  const ts = t.staff
  const hints = roleHints(ts)
  const router = useRouter()
  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [jobTitle, setJobTitle] = useState('Cashier')
  const [role, setRole] = useState<AssignableRole>('staff')
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await inviteStaff({ storeId, fullName, email, jobTitle, role })
    setSaving(false)
    if (result?.error) {
      setError(result.error)
      toast.error(ts.inviteFailed, result.error)
      return
    }
    toast.success(ts.invitationSent, email)
    setSuccess(true)
    router.refresh()
  }

  return (
    <Modal
      title={ts.addStaffTitle} onClose={onClose} width="sm"
      /*
        Actions live in Modal's `footer`. `children` scrolls; `footer` is
        pinned, shrink-0, and carries the safe-area-inset-bottom padding. Left
        inside the form the action scrolls away on a short viewport - the same
        shape ProductModal was reported for. The submit carries `form={formId}`
        so native submission, validation and the Enter key still work.
      */
      footer={
        <button
          type="submit"
          form={formId}
          disabled={saving}
          className="control-h w-full rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
        >
          {saving ? ts.sendingInvite : ts.sendInvite}
        </button>
      }
    >

        {success ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-strong">
              <span className="font-semibold">{fullName}</span>
              {ts.invitedBodyA}
              <span className="font-semibold">{t.roles[role]}</span>
              {ts.invitedBodyB}
            </p>
            <button
              onClick={onClose}
              className="mt-5 control-h w-full rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90"
            >
              {ts.done}
            </button>
          </div>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error && <div className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {ts.fFullName}
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {ts.fWorkEmail}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                {ts.fJobTitle}
              </label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={ts.jobTitlePlaceholder}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="staff-role"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong"
              >
                {ts.fRole}
              </label>
              <select
                id="staff-role"
                value={role}
                aria-describedby="staff-role-hint"
                onChange={(e) => setRole(e.target.value as AssignableRole)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              >
                {ASSIGNABLE_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {t.roles[option]}
                  </option>
                ))}
              </select>
              <p id="staff-role-hint" className="mt-1.5 text-xs text-muted">
                {hints[role]}
              </p>
            </div>
          </form>
        )}
    </Modal>
  )
}
