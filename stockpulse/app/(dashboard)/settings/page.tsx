import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/data'
import SettingsClient from '@/components/settings/SettingsClient'

export const metadata: Metadata = {
  title: 'Store Settings',
  description: 'Store details, appearance, and operational thresholds.',
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
