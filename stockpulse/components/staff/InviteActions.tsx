'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { resendInvite, revokeInvite } from '@/app/auth/actions'
import { useToast } from '@/components/ui/Toast'

/**
 * Resend / revoke for one pending invitation.
 *
 * Per-row state is why this is its own component rather than inline in the
 * staff table: a single `confirmingId` held by the parent re-renders every row
 * whenever one of them is touched, and this is the longest list on the page.
 */
export default function InviteActions({
  profileId,
  fullName,
  email,
}: {
  profileId: string
  fullName: string
  email: string
}) {
  const router = useRouter()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleResend() {
    startTransition(async () => {
      const result = await resendInvite(profileId)
      if (result?.error) {
        toast.error('Could not resend invitation', result.error)
        return
      }
      toast.success('Invitation resent', email)
    })
  }

  function handleRevoke() {
    setConfirming(false)
    startTransition(async () => {
      const result = await revokeInvite(profileId)
      if (result?.error) {
        toast.error('Could not revoke invitation', result.error)
        return
      }
      toast.success('Invitation revoked', fullName)
      // The row has to leave the table, and the list is server-rendered.
      router.refresh()
    })
  }

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Working…
      </span>
    )
  }

  // Revoking deletes the account outright, so it asks first. Inline rather than
  // a modal: a dialog for cancelling an invitation nobody has accepted is
  // heavier than the action deserves, and the row itself supplies the context.
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-muted-strong">Revoke?</span>
        <button
          type="button"
          onClick={handleRevoke}
          className="rounded-md px-1.5 py-1 text-xs font-semibold text-danger hover:underline"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-1.5 py-1 text-xs font-semibold text-muted hover:underline"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleResend}
        className="rounded-md px-1.5 py-1 text-xs font-semibold text-muted-strong hover:underline"
      >
        Resend
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Revoke invitation for ${fullName}`}
        className="rounded-md px-1.5 py-1 text-xs font-semibold text-muted hover:text-danger hover:underline"
      >
        Revoke
      </button>
    </span>
  )
}
