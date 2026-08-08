import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { toLocalISODate } from '@/lib/format'
import StaffScheduleClient from '@/components/staff/StaffScheduleClient'
import type { Profile, Shift, StaffLeave } from '@/types'

export const metadata: Metadata = {
  title: "Staff Schedule",
  description: "This week and who is covering each shift.",
  robots: { index: false, follow: false },
}

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { profile, store } = await getCurrentUser()
  const supabase = await createClient()
  const { week } = await searchParams

  const anchor = week ? new Date(week + 'T00:00:00') : new Date()
  const weekStart = startOfWeek(anchor)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekStartISO = toLocalISODate(weekStart)

  const weekEndISO = toLocalISODate(weekEnd)

  const [{ data: shifts }, { data: staff }, leaveResult] = await Promise.all([
    supabase
      .from('shifts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('store_id', store.id)
      .gte('shift_date', weekStartISO)
      .lte('shift_date', weekEndISO),
    supabase.from('profiles').select('*').eq('store_id', store.id).order('created_at', { ascending: true }),
    // Every leave range that OVERLAPS the week, which is not the same as one
    // that starts in it: a fortnight beginning last Monday covers this whole
    // week and would be invisible under a `starts_on >= weekStart` filter.
    // The test is "starts on or before the week ends, and ends on or after it
    // begins" — the standard interval overlap, with both bounds inclusive.
    supabase
      // The FK must be named. `profiles(full_name)` is ambiguous here because
      // staff_leave has TWO foreign keys to profiles — staff_id and created_by
      // — and PostgREST refuses to guess, answering PGRST201 with a 300. The
      // rows returned fine; only the embed failed, so leave silently rendered
      // as empty. Found by querying PostgREST directly, not by reading code.
      .from('staff_leave')
      .select('*, profiles!staff_leave_staff_id_fkey(full_name)')
      .eq('store_id', store.id)
      .lte('starts_on', weekEndISO)
      .gte('ends_on', weekStartISO),
  ])

  /**
   * Migration 0011 may not have been run yet. The rota predates leave and has
   * to keep rendering without it — an unapplied migration should cost the
   * leave bands, not the whole schedule.
   *
   * Every OTHER error is logged rather than swallowed. An earlier version
   * returned `data ?? []` for any failure at all, which is precisely how the
   * ambiguous embed above stayed invisible: the page rendered perfectly, with
   * no leave on it and nothing anywhere saying why.
   */
  if (leaveResult.error && leaveResult.error.code !== '42P01') {
    console.error('[staff] leave query failed', leaveResult.error)
  }
  const leave = (leaveResult.data ?? []) as StaffLeave[]

  return (
    <StaffScheduleClient
      role={profile.role}
      currentUserId={profile.id}
      staff={(staff ?? []) as Profile[]}
      shifts={(shifts ?? []) as Shift[]}
      leave={leave}
      weekStartISO={weekStartISO}
    />
  )
}
