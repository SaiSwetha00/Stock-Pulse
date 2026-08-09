'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from './AvatarUpload'
import type { Profile } from '@/types'

export default function EditProfileModal({
  profile,
  onClose,
}: {
  profile: Profile
  onClose: () => void
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // `not null` is not `not blank`. Clearing this field wrote '' successfully
    // and left the person nameless in the roster, the rota, every sale they
    // rang up and every audit entry — the same defect the store name had.
    //
    // NOTE: this modal writes `profiles` straight from the browser rather than
    // through a Server Action, so unlike every other write in the app this
    // check is the ONLY one. A crafted request still reaches the table. RLS
    // confines the damage to the caller's own row, so the worst case is
    // blanking your own name, but the asymmetry is real and is logged.
    const name = fullName.trim()
    if (!name) {
      setNameError('Your name is required.')
      return
    }
    if (name.length > 120) {
      setNameError('Keep your name to 120 characters or fewer.')
      return
    }
    setNameError('')

    setSaving(true)
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        // Trimmed on the way out, matching what was validated — otherwise
        // " " passes a check that ran against "".
        full_name: name,
        phone: phone.trim() || null,
        location: location.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      toast.error('Could not update profile', dbError.message)
      return
    }
    toast.success('Profile updated')
    router.refresh()
    onClose()
  }

  return (
    <Modal title="Edit Profile" onClose={onClose} width="md">
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg bg-danger-bg px-4 py-2.5 text-sm text-danger">{error}</div>}
          {/* Was three hand-rolled label+input pairs with no htmlFor over
              inputs with no id — none of the labels pointed at its own control,
              which is exactly the defect Phase 3C-ii found on Settings. `Field`
              wires label, control and error by useId, and brings the error slot
              this name check needs. */}
          <Field label="Full Name" error={nameError} required>
            {(p) => (
              <Input
                {...p}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            )}
          </Field>
          <Field label="Phone Number">
            {(p) => (
              <Input
                {...p}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />
            )}
          </Field>
          <Field label="Location">
            {(p) => (
              <Input
                {...p}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Portland, OR"
              />
            )}
          </Field>
          <AvatarUpload
            userId={profile.id}
            fullName={fullName || profile.full_name}
            value={avatarUrl}
            onChange={setAvatarUrl}
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="control-h flex-1 rounded-lg border border-border text-sm font-semibold text-muted-strong hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="control-h flex-1 rounded-lg bg-foreground text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
