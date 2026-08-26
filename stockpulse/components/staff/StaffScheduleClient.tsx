'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { canManage, isOwner } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Users, Trash2, Palmtree } from 'lucide-react'
import { toLocalISODate } from '@/lib/format'
import { useLocalToday } from '@/components/ui/LocalTime'
import { leaveCoversDay } from '@/lib/validation/leave'
import { LEAVE_KIND_LABELS, type Profile, type Role, type Shift, type StaffLeave } from '@/types'
import Button from '@/components/ui/Button'
import ShiftModal from './ShiftModal'
import DeleteShiftDialog from './DeleteShiftDialog'
import LeaveModal from './LeaveModal'
import StaffTabs from './StaffTabs'

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

/**
 * Semantic tokens only — no raw palette classes.
 *
 * These blocks previously used `bg-red-50` / `bg-emerald-800` and friends,
 * which are fixed values: they do not follow dark mode, and they would have
 * been the only thing on this page still wearing the old palette after Phase 4.
 * An unassigned shift is a genuine alert state, so it uses the same danger
 * tokens as every other alert in the app rather than a red of its own.
 *
 * No `/opacity` modifiers here, deliberately. These tokens do not support them
 * — `text-danger/80` and friends compile, build and then emit no rule at all,
 * so the text simply loses its colour. Verified by grepping the built CSS; see
 * DECISIONS.md D9.
 */
function shiftStyle(shift: Shift, isCurrentUser: boolean) {
  if (!shift.staff_id) {
    return {
      block: 'bg-danger-bg border border-danger',
      text: 'text-danger',
      sub: 'text-danger',
    }
  }
  if (isCurrentUser || shift.role_label.toLowerCase() === 'manager') {
    return { block: 'bg-foreground', text: 'text-surface', sub: 'text-muted' }
  }
  if (shift.role_label.toLowerCase() === 'produce') {
    // accent-ink pairs with accent-soft, not with an accent fill — every other
    // usage in the app does the same, and ink-on-fill measures 2.6:1. Together
    // these are 8.19:1 in light and 9.58:1 in dark.
    return { block: 'bg-accent-soft', text: 'text-accent-ink', sub: 'text-accent-ink' }
  }
  return { block: 'bg-surface-muted border border-border', text: 'text-foreground', sub: 'text-muted' }
}

export default function StaffScheduleClient({
  role,
  currentUserId,
  staff,
  shifts,
  leave,
  weekStartISO,
}: {
  // storeId removed: shift mutations go through Server Actions that read the
  // store from the session, so the browser never names the target store.
  role: Role
  currentUserId: string
  staff: Profile[]
  shifts: Shift[]
  /** Every leave range overlapping this week — not only those starting in it. */
  leave: StaffLeave[]
  weekStartISO: string
}) {
  const router = useRouter()
  const canWrite = canManage(role)
  const [myScheduleOnly, setMyScheduleOnly] = useState(!canWrite)
  // `'new'` opens a blank form; a Shift opens it prefilled for editing.
  const [editing, setEditing] = useState<Shift | 'new' | null>(null)
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null)
  // Same convention as `editing`: 'new' is a blank form, a row is an edit.
  const [editingLeave, setEditingLeave] = useState<StaffLeave | 'new' | null>(null)

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

  const visibleLeave = myScheduleOnly ? leave.filter((l) => l.staff_id === currentUserId) : leave

  /**
   * Leave overlapping a given day, as a lookup the day columns can use without
   * re-scanning the whole list seven times.
   */
  const leaveByDay = useMemo(() => {
    const map = new Map<string, StaffLeave[]>()
    for (const day of weekDates) {
      map.set(
        day,
        visibleLeave.filter((l) => leaveCoversDay(l, day)),
      )
    }
    return map
  }, [visibleLeave, weekDates])

  const availability = staff.map((s) => ({
    profile: s,
    onToday: shifts.some((sh) => sh.staff_id === s.id && sh.shift_date === todayISO),
    // null until hydrated, same as todayISO — so this cannot claim someone is
    // on leave "today" using the server's calendar day.
    onLeaveToday: todayISO
      ? leave.find((l) => l.staff_id === s.id && leaveCoversDay(l, todayISO)) ?? null
      : null,
  }))

  return (
    <div className="sp-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sp-eyebrow">Team</p>
          <h1 className="sp-title mt-2">Staff Scheduling</h1>
          <p className="sp-body mt-2">Manage team shifts and coverage.</p>
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
            <>
              {/* Secondary to Assign Shift: recording absence is the rarer of
                  the two, and the rota's primary action is still building it. */}
              {/* Both were hand-rolled copies of the secondary and primary
                  variants. The primary also carried `uppercase tracking-wide`,
                  which no other primary in the app has — a lone shouting
                  button on one screen. On the ladder they inherit the focus
                  ring and disabled handling too. */}
              <Button variant="secondary" onClick={() => setEditingLeave('new')}>
                <Palmtree className="h-4 w-4" aria-hidden="true" />
                Record Leave
              </Button>
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Assign Shift
              </Button>
            </>
          )}
        </div>
      </div>

      <StaffTabs role={role} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/*
          min-w-0 (via the minmax(0,1fr) track above and this class) is what
          keeps the Staff Availability panel on screen.

          A grid item defaults to `min-width: auto`, so the `1fr` track could
          not shrink below the min-content width of what is inside it - and
          inside it is a `min-w-[800px]` schedule grid. The track therefore sat
          at 800px plus padding whatever the viewport was, and pushed the 320px
          sidebar past the right edge: measured at 1482px against a 1440
          viewport, and still clipped at 1280 and 1024.

          The inner `overflow-x-auto` was already there and was doing nothing,
          because nothing was ever narrow enough to make it scroll. With the
          track allowed to shrink, it finally does.
        */}
        <div className="sp-rise sp-e1 min-w-0 rounded-2xl border border-border bg-surface p-6 shadow-sm">
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
              <h2 className="sp-heading">{rangeLabel}</h2>
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
          {/* Below lg the rota is wider than the screen, and Chrome makes an
              overflowing container keyboard-focusable on its own so the week
              can be scrolled without a mouse. That implicit focus carries no
              tabindex attribute, so the global gold-ring rule — which reaches
              `[tabindex]:focus-visible` — missed it, and the strip was the one
              tab stop on the page painting the black UA ring. Measured at 390:
              nonGoldRing=1, rgb(16,16,16).

              Declaring the focusability rather than inheriting it fixes the
              ring and makes the stop announce itself instead of being an
              unlabelled div a screen-reader user lands on. */}
          <div
            className="-mx-6 mt-6 overflow-x-auto px-6"
            tabIndex={0}
            role="region"
            aria-label="Weekly rota, scrolls horizontally"
          >
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
                  <p className="sp-heading">{dayNum}</p>
                  {/* Leave sits ABOVE the hour grid rather than inside it.

                      A day off has no start or end time, so drawing it as a
                      block on a timeline would mean inventing hours it does
                      not have — and a full-height block would bury the shifts
                      underneath it. A band in the header says "this person is
                      not here today" without pretending to be a shift.

                      It is a warning tone, not danger: somebody being on
                      holiday is expected, and an unassigned shift (which is a
                      genuine gap in cover) already owns the danger tone on
                      this grid. */}
                  {(leaveByDay.get(d) ?? []).map((l) => {
                    const who = l.profiles?.full_name ?? 'Team member'
                    const label = `${who} — ${LEAVE_KIND_LABELS[l.kind]}${
                      l.note ? `: ${l.note}` : ''
                    }`
                    const content = (
                      <>
                        <Palmtree className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{who.split(' ')[0]}</span>
                      </>
                    )
                    const classes =
                      'mt-1 flex w-full items-center gap-1 rounded-md bg-warning-bg px-1.5 py-1 text-left text-[10px] font-semibold text-warning'

                    return canWrite ? (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setEditingLeave(l)}
                        title={label}
                        aria-label={`Edit leave: ${label}`}
                        className={`${classes} transition-colors hover:brightness-95`}
                      >
                        {content}
                      </button>
                    ) : (
                      <span key={l.id} title={label} className={classes}>
                        {content}
                        <span className="sr-only">{label}</span>
                      </span>
                    )
                  })}
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
                              className="absolute inset-y-0 left-0 right-11 rounded-l-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
                              className={`tap-target absolute right-0 top-0 z-10 rounded-lg opacity-70 transition hover:bg-black/20 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground group-hover:opacity-100 ${style.text}`}
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
          <div className="sp-rise sp-e1 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="sp-heading">Staff Availability</h2>
              <Users className="h-5 w-5 text-muted" />
            </div>
            {/* A store with nobody in it is the first-run state, not an
                error — the owner has signed up and has not invited anyone
                yet. Point them at where that happens rather than showing an
                empty column with a "0 of 0 on shift" line under it. */}
            {availability.length === 0 && (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Nobody on the team yet.{' '}
                {isOwner(role) ? (
                  <Link href="/staff/team" className="font-semibold text-foreground underline">
                    Invite your first colleague
                  </Link>
                ) : (
                  'The store owner can invite people from the Team tab.'
                )}
              </p>
            )}
            <div className="mt-4 space-y-4">
              {availability.map(({ profile, onToday, onLeaveToday }) => (
                <div key={profile.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{profile.full_name}</p>
                    <p className="truncate text-xs text-muted">
                      {onLeaveToday
                        ? `${LEAVE_KIND_LABELS[onLeaveToday.kind]} until ${onLeaveToday.ends_on}`
                        : profile.job_title || 'Staff'}
                    </p>
                  </div>
                  {/* Three states, not two. "Not scheduled" and "on leave"
                      look identical on a rota — both are an empty column —
                      and the difference is the whole point: one is someone you
                      can still call in, the other is not. */}
                  {onLeaveToday ? (
                    // The tooltip sits on a wrapper: lucide icons do not accept
                    // a `title` prop, and passing one silently does nothing.
                    <span title={`On ${LEAVE_KIND_LABELS[onLeaveToday.kind].toLowerCase()} today`}>
                      <Palmtree className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
                    </span>
                  ) : (
                    // Not being scheduled today isn't an error state, so the
                    // off-shift dot is neutral rather than red.
                    <span
                      title={onToday ? 'On shift today' : 'Not scheduled today'}
                      className={`h-2 w-2 shrink-0 rounded-full ${onToday ? 'bg-accent' : 'bg-surface-muted'}`}
                    />
                  )}
                  <span className="sr-only">
                    {onLeaveToday
                      ? `On ${LEAVE_KIND_LABELS[onLeaveToday.kind].toLowerCase()} today`
                      : onToday
                        ? 'On shift today'
                        : 'Not scheduled today'}
                  </span>
                </div>
              ))}
            </div>
            {/* Replaces a dead "View All Staff" button. */}
            <p className="mt-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {availability.filter((a) => a.onToday).length} of {staff.length} on shift today
              {availability.filter((a) => a.onLeaveToday).length > 0 &&
                ` · ${availability.filter((a) => a.onLeaveToday).length} on leave`}
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
          leave={leave}
          weekDates={weekDates}
          onClose={() => setEditing(null)}
        />
      )}

      {deletingShift && (
        <DeleteShiftDialog shift={deletingShift} onClose={() => setDeletingShift(null)} />
      )}

      {editingLeave && (
        <LeaveModal
          // Form state seeds from props on mount, so a different target has to
          // remount rather than reuse the previous entry's values.
          key={editingLeave === 'new' ? 'new' : editingLeave.id}
          leave={editingLeave === 'new' ? null : editingLeave}
          staff={staff}
          // Opens on the week being viewed rather than on today, which is the
          // date someone looking at next week actually means.
          defaultDate={todayISO && weekDates.includes(todayISO) ? todayISO : weekDates[0]}
          onClose={() => setEditingLeave(null)}
        />
      )}
    </div>
  )
}
