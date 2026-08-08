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
      .from('staff_leave')
      .select('*, profiles(full_name)')
      .eq('store_id', store.id)
      .lte('starts_on', weekEndISO)
      .gte('ends_on', weekStartISO),
  ])

  // Migration 0011 may not have been run yet. The rota predates leave and has
  // to keep rendering without it — an unapplied migration should cost the
  // leave stripes, not the whole schedule.
  const leave =
    leaveResult.error?.code === '42P01' ? [] : ((leaveResult.data ?? []) as StaffLeave[])

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
