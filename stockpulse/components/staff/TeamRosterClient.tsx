'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, UserPlus, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { LocalDate } from '@/components/ui/LocalTime'
import type { BadgeTone } from '@/components/ui/Badge'
import type { Profile, Role } from '@/types'
import { setTeamMemberActive } from '@/app/(dashboard)/staff/teamActions'
import AddStaffModal from './AddStaffModal'
import EditStaffModal from './EditStaffModal'
import InviteActions from './InviteActions'
import StaffTabs from './StaffTabs'
import { displayJobTitle } from '@/lib/jobTitle'
import { useAppCopy } from '@/lib/i18n/client'

/** A profile plus whether the person behind it can still sign in. */
export type TeamMember = Profile & { active: boolean }

/**
 * One tone per role, typed against the full Role union rather than
 * Record<string, string>.
 *
 * The loose type is exactly how the previous version of this table shipped a
 * bug: `manager` had no entry, so every manager row emitted the literal string
 * "undefined" into its class list and the badge lost its background. Typing it
 * this way means the next role added to the system fails the build here instead
 * of failing silently on screen.
 */
const ROLE_TONES: Record<Role, BadgeTone> = {
  owner: 'info',
  manager: 'info',
  staff: 'neutral',
}

/**
 * The team roster — everyone in the store, and every control for changing who
 * they are and what they may do.
 *
 * This used to be a card at the bottom of Settings, which put "who works here"
 * beside "how many hours before a perishable warns" and left the rota in a
 * different module again. Settings is now store configuration only.
 */
export default function TeamRosterClient({
  role,
  storeId,
  currentUserId,
  members,
}: {
  role: Role
  storeId: string
  currentUserId: string
  members: TeamMember[]
}) {
  const t = useAppCopy()
  const ts = t.staff
  const router = useRouter()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  // Which row is asking "are you sure?", by id. One value rather than per-row
  // state because only one confirmation can be open at a time by definition.
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const activeCount = members.filter((m) => m.active && !m.invited).length
  const pendingCount = members.filter((m) => m.invited && m.role !== 'owner').length

  function toggleActive(member: TeamMember) {
    setConfirming(null)
    setPendingId(member.id)
    startTransition(async () => {
      const result = await setTeamMemberActive(member.id, !member.active)
      setPendingId(null)
      if (!result.ok) {
        toast.error(
          member.active ? ts.deactivateFailed : ts.reactivateFailed,
          result.message,
        )
        return
      }
      toast.success(
        member.active ? ts.accessRemoved : ts.accessRestored,
        (member.active ? ts.canNoLongerSignIn : ts.canSignInAgain).replace(
          '{name}',
          member.full_name,
        ),
      )
      router.refresh()
    })
  }

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="sp-eyebrow">{ts.eyebrow}</p>
          <h1 className="sp-title mt-2">{ts.teamTitle}</h1>
          <p className="sp-body mt-2">
            {(activeCount === 1 ? ts.activeOne : ts.activeMany).replace(
              '{n}',
              String(activeCount),
            )}
            {pendingCount > 0 && ts.pendingSuffix.replace('{n}', String(pendingCount))}.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {ts.addStaff}
        </Button>
      </div>

      <StaffTabs role={role} />

      <div className="sp-rise mt-6 sp-e1 rounded-2xl border border-border bg-surface shadow-sm">
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title={ts.teamEmptyTitle}
            description={ts.teamEmptyBody}
            action={
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {ts.addStaff}
              </Button>
            }
          />
        ) : (
          /* Rows become a card list below `lg` — five columns of controls
             cannot survive a phone's width, and a horizontal scroll for the
             roster would hide the actions off-screen. */
          <div className="sp-card-p lg:overflow-x-auto">
            <table className="sp-table block w-full text-left text-sm lg:table">
              <thead className="hidden lg:table-header-group">
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="pb-3 pr-4">{ts.colEmployee}</th>
                  <th className="pb-3 pr-4">{ts.colRole}</th>
                  <th className="pb-3 pr-4">{ts.colJoined}</th>
                  <th className="pb-3 pr-4">{ts.colStatus}</th>
                  <th className="pb-3 text-right">
                    <span className="sr-only">{ts.colActions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="block lg:table-row-group">
                {members.map((m) => {
                  const isOwnerRow = m.role === 'owner'
                  const isSelf = m.id === currentUserId
                  const pendingInvite = m.invited && !isOwnerRow
                  // The owner's account and the viewer's own row are not
                  // editable from here: an owner who can demote or lock out
                  // themselves can leave the store with nobody able to
                  // administer it. teamActions refuses both server-side too.
                  const manageable = !isOwnerRow && !isSelf
                  const busy = pendingId === m.id

                  return (
                    <tr
                      key={m.id}
                      className="block border-b border-border py-3 last:border-0 lg:table-row lg:py-0"
                    >
                      <td className="block lg:table-cell lg:pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                            {m.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {m.full_name}
                              {isSelf && (
                                <span className="ml-2 text-xs font-medium text-muted">{ts.you}</span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted">{m.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Below `lg` the column header is gone, so each value
                          carries its own label. */}
                      <td className="mt-3 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:pr-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          {ts.colRole}
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <Badge tone={ROLE_TONES[m.role]}>
                            {isOwnerRow ? ts.storeOwnerBadge : t.roles[m.role]}
                          </Badge>
                          {!isOwnerRow && m.job_title && (
                            <span className="truncate text-xs text-muted">
                              {displayJobTitle(m.job_title, { roles: t.roles, storeOwner: t.profile.storeOwner, storeOwnerDemo: t.profile.storeOwnerDemo })}
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="mt-2 flex items-center justify-between gap-3 text-muted-strong lg:mt-0 lg:table-cell lg:pr-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          {ts.colJoined}
                        </span>
                        <LocalDate iso={m.created_at} withYear />
                      </td>

                      <td className="mt-2 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:pr-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          {ts.colStatus}
                        </span>
                        {pendingInvite ? (
                          <Badge tone="warning" dot>
                            {ts.badgeInvited}
                          </Badge>
                        ) : m.active ? (
                          <Badge tone="success" dot>
                            {ts.badgeActive}
                          </Badge>
                        ) : (
                          <Badge tone="danger" dot>
                            {ts.badgeDeactivated}
                          </Badge>
                        )}
                      </td>

                      <td className="mt-3 flex items-center justify-between gap-3 lg:mt-0 lg:table-cell lg:text-right">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted lg:hidden">
                          {ts.colActions}
                        </span>
                        <span className="inline-flex items-center justify-end gap-1">
                          {busy && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              {ts.working}
                            </span>
                          )}

                          {/* A pending invitation gets resend/revoke and
                              nothing else — changing the role of somebody who
                              has not accepted yet, or deactivating an account
                              never used, are both meaningless. Revoke and
                              re-invite instead. */}
                          {!busy && pendingInvite && (
                            <InviteActions
                              profileId={m.id}
                              fullName={m.full_name}
                              email={m.email}
                            />
                          )}

                          {!busy && manageable && !pendingInvite && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditing(m)}
                                aria-label={ts.editAria.replace('{name}', m.full_name)}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                {ts.edit}
                              </Button>

                              {/* Inline rather than a modal: the row already
                                  supplies the context a dialog would have to
                                  repeat, and this is reversible — it removes
                                  sign-in, it does not delete anything. */}
                              {confirming === m.id ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="text-xs text-muted-strong">
                                    {m.active ? ts.removeAccessQ : ts.restoreAccessQ}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleActive(m)}
                                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-danger hover:underline"
                                  >
                                    {ts.yes}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirming(null)}
                                    className="rounded-md px-1.5 py-1 text-xs font-semibold text-muted hover:underline"
                                  >
                                    {ts.no}
                                  </button>
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirming(m.id)}
                                  aria-label={(m.active
                                    ? ts.deactivateAria
                                    : ts.reactivateAria
                                  ).replace('{name}', m.full_name)}
                                >
                                  {m.active ? ts.deactivate : ts.reactivate}
                                </Button>
                              )}
                            </>
                          )}

                          {!busy && isOwnerRow && (
                            <span className="text-xs text-muted">{ts.storeOwnerNote}</span>
                          )}
                          {!busy && isSelf && !isOwnerRow && (
                            <span className="text-xs text-muted">{ts.thisIsYou}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && <AddStaffModal storeId={storeId} onClose={() => setAddOpen(false)} />}
      {editing && <EditStaffModal member={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
