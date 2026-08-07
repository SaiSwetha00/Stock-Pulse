import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import { toLocalISODate } from '@/lib/format'
import StaffScheduleClient from '@/components/staff/StaffScheduleClient'
import type { Profile, Shift } from '@/types'

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

  const [{ data: shifts }, { data: staff }] = await Promise.all([
    supabase
      .from('shifts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('store_id', store.id)
      .gte('shift_date', weekStartISO)
      .lte('shift_date', toLocalISODate(weekEnd)),
    supabase.from('profiles').select('*').eq('store_id', store.id).order('created_at', { ascending: true }),
  ])

  return (
    <StaffScheduleClient
      role={profile.role}
      currentUserId={profile.id}
      staff={(staff ?? []) as Profile[]}
      shifts={(shifts ?? []) as Shift[]}
      weekStartISO={weekStartISO}
    />
  )
}
