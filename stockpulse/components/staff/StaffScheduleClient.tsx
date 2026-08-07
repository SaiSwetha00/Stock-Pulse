'use client'

import { useMemo, useState } from 'react'
import { canManage } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Users, Trash2 } from 'lucide-react'
import { toLocalISODate } from '@/lib/format'
import { useLocalToday } from '@/components/ui/LocalTime'
import type { Profile, Role, Shift } from '@/types'
import ShiftModal from './ShiftModal'
import DeleteShiftDialog from './DeleteShiftDialog'

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 18
const HOUR_HEIGHT = 56

function toDecimalHour(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

/**
 * The grid used to be pinned to 08:00–18:00, so an early delivery shift or a
 * late close was clamped to the top edge or ran off the bottom. Widen the
 * window to whatever the week actually contains.
 */
export function gridBounds(shifts: { start_time: string; end_time: string }[]): {
  start: number
  end: number
} {
  let start = DEFAULT_START_HOUR
  let end = DEFAULT_END_HOUR

  for (const s of shifts) {
    start = Math.min(start, Math.floor(toDecimalHour(s.start_time)))
    end = Math.max(end, Math.ceil(toDecimalHour(s.end_time)))
  }

  return { start: Math.max(0, start), end: Math.min(24, Math.max(end, start + 1)) }
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toLocalISODate(d)
}

function shiftStyle(shift: Shift, isCurrentUser: boolean) {
  if (!shift.staff_id) {
    return { block: 'bg-red-50 border border-red-200', text: 'text-red-700', sub: 'text-red-600' }
  }
  if (isCurrentUser || shift.role_label.toLowerCase() === 'manager') {
    return { block: 'bg-foreground', text: 'text-surface', sub: 'text-muted' }
  }
  if (shift.role_label.toLowerCase() === 'produce') {
    return { block: 'bg-emerald-800', text: 'text-surface', sub: 'text-emerald-200' }
  }
  return { block: 'bg-surface-muted border border-border', text: 'text-foreground', sub: 'text-muted' }
}

export default function StaffScheduleClient({
  role,
  currentUserId,
  staff,
  shifts,
  weekStartISO,
}: {
  // storeId removed: shift mutations go through Server Actions that read the
  // store from the session, so the browser never names the target store.
  role: Role
  currentUserId: string
  staff: Profile[]
  shifts: Shift[]
  weekStartISO: string
}) {
  const router = useRouter()
  const canWrite = canManage(role)
  const [myScheduleOnly, setMyScheduleOnly] = useState(!canWrite)
  // `'new'` opens a blank form; a Shift opens it prefilled for editing.
  const [editing, setEditing] = useState<Shift | 'new' | null>(null)
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null)

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartISO, i)),
    [weekStartISO]
  )
  // null until hydrated: the server's "today" is its own timezone's, which
  // would highlight the wrong column and mismatch on hydration.
  const todayISO = useLocalToday()

  const visibleShifts = myScheduleOnly ? shifts.filter((s) => s.staff_id === currentUserId) : shifts

  // Bounds come from every shift in the week, not just the visible ones, so
  // toggling "My Schedule" doesn't reflow the grid under you.
  const { start: startHour, end: endHour } = useMemo(() => gridBounds(shifts), [shifts])
  const gridHeight = (endHour - startHour) * HOUR_HEIGHT

  const hourMarks = useMemo(() => {
    const marks: number[] = []
    for (let h = startHour; h <= endHour; h += 2) marks.push(h)
    return marks
  }, [startHour, endHour])

  function goToWeek(offsetDays: number) {
    const next = addDays(weekStartISO, offsetDays)
    router.push(`/staff?week=${next}`)
  }

  const rangeLabel = `${new Date(weekDates[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(
    weekDates[6] + 'T00:00:00'
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const availability = staff.map((s) => ({
    profile: s,
    onToday: shifts.some((sh) => sh.staff_id === s.id && sh.shift_date === todayISO),
  }))

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Scheduling</h1>
          <p className="mt-1 text-sm text-muted">Manage team shifts and coverage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMyScheduleOnly((v) => !v)}
            className={`control-h rounded-lg px-4 text-sm font-semibold transition ${
              myScheduleOnly ? 'bg-foreground text-surface' : 'bg-surface-muted text-muted-strong hover:bg-surface-muted'
            }`}
          >
            My Schedule
          </button>
          {canWrite && (
            <button
              onClick={() => setEditing('new')}
              className="flex control-h items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold uppercase tracking-wide text-surface hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Assign Shift
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToWeek(-7)}
                aria-label="Previous week"
                className="tap-target rounded-lg text-muted hover:bg-surface-muted"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <h2 className="text-lg font-bold text-foreground">{rangeLabel}</h2>
              <button
                type="button"
                onClick={() => goToWeek(7)}
                aria-label="Next week"
                className="tap-target rounded-lg text-muted hover:bg-surface-muted"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {/* A Day/Week/Month switcher sat here with no handlers on any of
                the three buttons — only a week view exists. */}
            <span className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-muted-strong">
              Week view
            </span>
          </div>

          {/* Seven day columns cannot survive a phone's width: at 375px they
              were being crushed to ~28px each, narrower than the controls
              inside them. Below 800px the grid scrolls sideways instead. That
              floor is what each column needs to seat a 44px delete target and
              still leave a 44px edit target beside it. */}
          <div className="-mx-6 mt-6 overflow-x-auto px-6">
          <div className="grid min-w-[800px] grid-cols-[56px_repeat(7,1fr)] gap-x-1">
            <div />
            {weekDates.map((d, i) => {
              const isToday = d === todayISO
              const dayNum = new Date(d + 'T00:00:00').getDate()
              return (
                <div
                  key={d}
                  className={`rounded-t-lg py-2 text-center ${isToday ? 'bg-foreground text-surface' : ''}`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-muted' : 'text-muted'}`}>
                    {DAY_NAMES[i]}
                  </p>
                  <p className="text-lg font-bold">{dayNum}</p>
                </div>
              )
            })}
          </div>

          <div className="grid min-w-[800px] grid-cols-[56px_repeat(7,1fr)] gap-x-1">
            <div className="relative" style={{ height: gridHeight }}>
              {hourMarks.map((h) => (
                <div
                  key={h}
                  className="absolute -translate-y-1/2 text-xs text-muted"
                  style={{ top: (h - startHour) * HOUR_HEIGHT }}
                >
                  {h.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {weekDates.map((d) => {
              const dayShifts = visibleShifts.filter((s) => s.shift_date === d)
              return (
                <div key={d} className="relative border-l border-border" style={{ height: gridHeight }}>
                  {hourMarks.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border"
                      style={{ top: (h - startHour) * HOUR_HEIGHT }}
                    />
                  ))}
                  {dayShifts.map((shift) => {
                    const start = toDecimalHour(shift.start_time)
                    const end = toDecimalHour(shift.end_time)
                    const top = Math.max(0, (start - startHour) * HOUR_HEIGHT)
                    // 44px floor, not 24: a block has to be able to hold a
                    // 44px control. Only shifts under ~47 minutes are drawn
                    // taller than their true duration, which the old 24px
                    // floor already did to anything under ~26 minutes.
                    const height = Math.max(44, (end - start) * HOUR_HEIGHT)
                    const isCurrentUser = shift.staff_id === currentUserId
                    const style = shiftStyle(shift, isCurrentUser)
                    return (
                      <div
                        key={shift.id}
                        className={`group absolute inset-x-0.5 flex flex-col justify-between overflow-hidden rounded-lg p-2 text-xs ${
                          // Clears the delete icon's visual footprint, not the
                          // whole 44px hit box — reserving all 44 left a ~100px
                          // block with 44px of label room, which hard-clipped
                          // every role name. The invisible left edge of the hit
                          // box does overlap the label, and a stray tap there
                          // still has to pass the delete confirmation.
                          canWrite ? 'pr-7' : ''
                        } ${style.block}`}
                        style={{ top, height }}
                      >
                        <div>
                          {!shift.staff_id && (
                            <p className={`flex items-center gap-1 font-bold ${style.text}`}>
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {/* A role label is one word, so it cannot wrap —
                                  without this it was cut mid-glyph. */}
                              <span className="truncate">{shift.role_label}</span>
                            </p>
                          )}
                          {shift.staff_id && (
                            <p className={`truncate font-bold ${style.text}`}>{shift.role_label}</p>
                          )}
                        </div>
                        <p className={`font-semibold ${style.sub}`}>
                          {!shift.staff_id
                            ? 'UNASSIGNED'
                            : isCurrentUser
                              ? 'You'
                              : shift.profiles?.full_name ?? 'Staff'}
                        </p>

                        {canWrite && (
                          <>
                            {/* Transparent overlay makes the rest of the block
                                the edit target. It sits after the content so
                                the text stays selectable-looking, and stops
                                44px short of the right edge so it never
                                overlaps the delete target — nesting one button
                                inside another is invalid. */}
                            <button
                              type="button"
                              onClick={() => setEditing(shift)}
                              aria-label={`Edit ${shift.role_label} shift on ${shift.shift_date}`}
                              className="absolute inset-y-0 left-0 right-11 rounded-l-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                            />
                            {/* Was a 20px control revealed on hover, so it was
                                both under the 44px floor and unreachable on a
                                touch screen, which has no hover. It is now a
                                full-size target that is always visible — the
                                affordance has to match the hit area, or a tap
                                meant for "edit" lands on an invisible delete.
                                Deleting still goes through a confirm dialog. */}
                            <button
                              type="button"
                              onClick={() => setDeletingShift(shift)}
                              aria-label={`Delete ${shift.role_label} shift on ${shift.shift_date}`}
                              className={`tap-target absolute right-0 top-0 z-10 rounded-lg opacity-70 transition hover:bg-black/20 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 group-hover:opacity-100 ${style.text}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Staff Availability</h2>
              <Users className="h-5 w-5 text-muted" />
            </div>
            <div className="mt-4 space-y-4">
              {availability.map(({ profile, onToday }) => (
                <div key={profile.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{profile.full_name}</p>
                    <p className="truncate text-xs text-muted">{profile.job_title || 'Staff'}</p>
                  </div>
                  {/* Not being scheduled today isn't an error state, so the
                      off-shift dot is neutral rather than red. */}
                  <span
                    title={onToday ? 'On shift today' : 'Not scheduled today'}
                    className={`h-2 w-2 shrink-0 rounded-full ${onToday ? 'bg-accent' : 'bg-surface-muted'}`}
                  />
                  <span className="sr-only">
                    {onToday ? 'On shift today' : 'Not scheduled today'}
                  </span>
                </div>
              ))}
            </div>
            {/* Replaces a dead "View All Staff" button. */}
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {availability.filter((a) => a.onToday).length} of {staff.length} on shift today
            </p>
          </div>

          {/* A "Weekend Promo — requires 2 extra produce staff" card sat here.
              Nothing computed it; the numbers were invented. Removed rather
              than left presenting fiction as an operational insight. */}
        </div>
      </div>

      {editing && (
        <ShiftModal
          // Form state seeds from props on mount, so a different target must
          // remount rather than reuse the previous shift's values.
          key={editing === 'new' ? 'new' : editing.id}
          shift={editing === 'new' ? null : editing}
          staff={staff}
          weekDates={weekDates}
          onClose={() => setEditing(null)}
        />
      )}

      {deletingShift && (
        <DeleteShiftDialog shift={deletingShift} onClose={() => setDeletingShift(null)} />
      )}
    </div>
  )
}
