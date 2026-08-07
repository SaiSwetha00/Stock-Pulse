'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'
import {
  NOTIFICATION_FEED_LIMIT,
  type Notification,
  type NotificationAudience,
  type NotificationKind,
} from '@/lib/notifications'

export type NotificationFeed = { items: Notification[]; unread: number }

/**
 * There is deliberately no role branching anywhere in this file.
 *
 * Who may see, mark or clear a notification is decided by the RLS policies in
 * migration 0005 — staff reach only what is addressed to them, managers
 * everything bar owner-only items, owners the whole store. Repeating that
 * logic here would give it a second place to drift out of step, and the copy
 * in application code is the one a crafted request can skip.
 *
 * The store_id filters below are for the index, not for security.
 */
export async function getNotifications(): Promise<NotificationFeed> {
  const { store } = await getCurrentUser()
  const supabase = await createClient()

  const [{ data: items }, { data: unread }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(NOTIFICATION_FEED_LIMIT),
    supabase.rpc('unread_notification_count'),
  ])

  return {
    items: (items ?? []) as Notification[],
    // The RPC counts through the same select policy, so the badge can never
    // promise more than the dropdown is able to show.
    unread: Number(unread ?? 0),
  }
}

/**
 * `read_at is null` is not redundant beside the id filter: without it,
 * reopening an already-read notification would keep pushing its timestamp
 * forward and reorder a feed sorted by recency.
 */
export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const { store } = await getCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('store_id', store.id)
    .is('read_at', null)

  if (error) return { ok: false }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const { store } = await getCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('store_id', store.id)
    .is('read_at', null)

  if (error) return { ok: false }

  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Clears what the viewer can see, which is not necessarily everything in the
 * store — a manager clearing their feed leaves owner-only notifications
 * untouched, because the delete policy admits exactly the rows the select
 * policy does.
 */
export async function clearNotifications(): Promise<{ ok: boolean }> {
  const { store } = await getCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase.from('notifications').delete().eq('store_id', store.id)

  if (error) return { ok: false }

  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Raise a notification from another server action.
 *
 * Goes through the notify() RPC rather than a direct insert because the table
 * has no insert policy at all: the function is SECURITY DEFINER and stamps
 * store_id from the session, so a caller can compose a message but never
 * plant one in someone else's store.
 *
 * Failures are swallowed on purpose. Every caller raises these *after* the
 * work that matters has already committed — a supplier saved, a staff member
 * hired — and failing that operation because its notification did not land
 * would be the worse outcome by far.
 */
export async function notify(input: {
  title: string
  body?: string
  audience?: NotificationAudience
  kind?: NotificationKind
  entity?: string
  entityId?: string
  recipientId?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.rpc('notify', {
      p_title: input.title,
      p_body: input.body ?? null,
      p_audience: input.audience ?? 'store',
      p_kind: input.kind ?? 'general',
      p_entity: input.entity ?? null,
      p_entity_id: input.entityId ?? null,
      p_recipient: input.recipientId ?? null,
    })
  } catch {
    // Intentionally silent — see above.
  }
}
