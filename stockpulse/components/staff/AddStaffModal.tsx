'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { inviteStaff } from '@/app/auth/actions'
import { ASSIGNABLE_ROLES, ROLE_LABELS, type AssignableRole } from '@/lib/permissions'

/** What each role actually means, for someone choosing between them. */
const ROLE_HINTS: Record<AssignableRole, string> = {
  manager: 'Runs the shop: inventory, customers, suppliers, shifts and takings.',
  staff: 'Works the floor: view stock, log sales, see their own shifts.',
}

export default function AddStaffModal({ storeId, onClose }: { storeId: string; onClose: () => void }) {
  const router = useRouter()
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
      toast.error('Could not invite staff member', result.error)
      return
    }
    toast.success('Invitation sent', email)
    setSuccess(true)
    router.refresh()
  }

  return (
    <Modal title="Add Staff" onClose={onClose} width="sm">

        {success ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-strong">
              <span className="font-semibold">{fullName}</span> has been invited as{' '}
              <span className="font-semibold">{ROLE_LABELS[role]}</span>. They&apos;ll receive an
              email to set their password and sign in.
            </p>
            <button
              onClick={onClose}
              className="mt-5 control-h w-full rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error && <div className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Full Name
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
                Work Email
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
                Job Title
              </label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Cashier, Inventory Lead..."
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="staff-role"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong"
              >
                Role
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
                    {ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
              <p id="staff-role-hint" className="mt-1.5 text-xs text-muted">
                {ROLE_HINTS[role]}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="control-h w-full rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Sending invite…' : 'Send Invite'}
            </button>
          </form>
        )}
    </Modal>
  )
}
