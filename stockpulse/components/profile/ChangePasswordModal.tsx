'use client'

import { useId, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { updatePassword } from '@/app/auth/actions'

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  // Ties the footer submit back to the form it now sits outside of.
  const formId = useId()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    const result = await updatePassword(password)
    setSaving(false)
    if (result?.error) {
      setError(result.error)
      toast.error('Could not update password', result.error)
      return
    }
    toast.success('Password updated')
    setSuccess(true)
  }

  return (
    <Modal
      title="Change Password" onClose={onClose} width="sm"
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
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      }
    >
        {success ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-strong">Your password has been updated.</p>
            <button
              onClick={onClose}
              className="mt-5 control-h w-full rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            {error && <div className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-strong">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="control-h w-full rounded-lg border border-border bg-surface-muted px-3.5 text-sm focus:border-border-strong focus:bg-surface focus:outline-none"
              />
            </div>
          </form>
        )}
    </Modal>
  )
}
