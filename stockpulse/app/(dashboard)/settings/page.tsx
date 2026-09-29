import type { Metadata } from 'next'
import { appCopy } from '@/lib/i18n/app'
import { getLocale } from '@/lib/i18n/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/data'
import SettingsClient from '@/components/settings/SettingsClient'

export async function generateMetadata(): Promise<Metadata> {
  // Page name only; app/layout.tsx appends " · StockPulse". In the
  // signed-in language, read from the same cookie the layout uses.
  const { title, description } = appCopy(await getLocale()).meta.settings
  return { title, description }
}

export default async function SettingsPage() {
  const { profile, store } = await getCurrentUser()
  if (profile.role !== 'owner') redirect('/dashboard')

  // The staff query that used to run here moved to /staff/team along with the
  // roster it fed. Settings is store configuration now, and the store already
  // arrives with getCurrentUser's single round trip — this page needs no query
  // of its own.
  return <SettingsClient store={store} />
}
