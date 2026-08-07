'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/data'

export type ThreadSummary = {
  id: string
  title: string | null
  last_message_at: string
}

export type ThreadMessage = {
  id: string
  role: 'user' | 'model'
  content: string
}

export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string }

/**
 * Titles are the first user message, truncated. Long enough to tell two
 * conversations apart in a narrow sidebar, short enough not to wrap to three
 * lines — and well inside the 120 the CHECK constraint in 0007 allows.
 */
const TITLE_MAX = 60

export function titleFromMessage(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length <= TITLE_MAX) return clean
  // Cut on a word boundary where there is one reasonably near the limit, so
  // titles do not end mid-word.
  const cut = clean.slice(0, TITLE_MAX)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > TITLE_MAX - 15 ? cut.slice(0, lastSpace) : cut) + '…'
}

/**
 * Every query here is scoped by `user_id` in addition to the RLS policy that
 * already enforces it. Not redundant belt-and-braces for its own sake: an
 * explicit `.eq('user_id', ...)` turns a policy refusal — which arrives as
 * zero rows, silently — into an ordinary empty result, so the failure mode is
 * "nothing found" rather than a confusing partial success.
 */
async function requireUser() {
  const { profile, store } = await getCurrentUser()
  return { profile, store }
}

export async function listThreads(): Promise<AiResult<ThreadSummary[]>> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_threads')
    .select('id, title, last_message_at')
    .eq('user_id', profile.id)
    .order('last_message_at', { ascending: false })
    // The sidebar is a recency list, not an archive. Fetching every thread a
    // heavy user has ever opened in order to render twenty of them is the kind
    // of query that is free on day one and a problem by month six.
    .limit(30)

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: (data ?? []) as ThreadSummary[] }
}

export async function createThread(): Promise<AiResult<string>> {
  const { profile, store } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_threads')
    .insert({ user_id: profile.id, store_id: store.id, title: null })
    .select('id')
    .single()

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: data.id as string }
}

export async function loadThread(threadId: string): Promise<AiResult<ThreadMessage[]>> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_messages')
    .select('id, role, content')
    .eq('thread_id', threadId)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: (data ?? []) as ThreadMessage[] }
}

/**
 * Persist one message and bump the thread's recency.
 *
 * Titling happens here rather than at creation because a thread has no subject
 * until somebody says something: the first user message becomes the title, and
 * only if the thread does not already have one.
 */
export async function appendMessage(
  threadId: string,
  role: 'user' | 'model',
  content: string,
): Promise<AiResult<null>> {
  const { profile } = await requireUser()
  if (!content.trim()) return { ok: false, message: 'Cannot save an empty message.' }

  const supabase = await createClient()

  const { error: msgError } = await supabase
    .from('ai_messages')
    .insert({ thread_id: threadId, user_id: profile.id, role, content })

  if (msgError) return { ok: false, message: msgError.message }

  const patch: { last_message_at: string; title?: string } = {
    last_message_at: new Date().toISOString(),
  }

  if (role === 'user') {
    // Only set a title if there isn't one. Reading it first costs a round trip
    // but avoids overwriting the subject of a long conversation with whatever
    // its most recent question happened to be.
    const { data: thread } = await supabase
      .from('ai_threads')
      .select('title')
      .eq('id', threadId)
      .eq('user_id', profile.id)
      .single()

    if (thread && !thread.title) patch.title = titleFromMessage(content)
  }

  const { error: threadError } = await supabase
    .from('ai_threads')
    .update(patch)
    .eq('id', threadId)
    .eq('user_id', profile.id)

  // A failed bump is not worth failing the send over: the message is already
  // stored, and the only casualty is sidebar ordering until the next message.
  if (threadError) return { ok: true, data: null }
  return { ok: true, data: null }
}

/**
 * Empty a thread but keep it. Used by "Clear chat", which the user reaches
 * through a confirm dialog naming what will be removed.
 *
 * Deleting the messages rather than the thread means the conversation the user
 * is looking at stays selected and immediately usable, instead of dumping them
 * back to an empty picker.
 */
export async function clearThread(threadId: string): Promise<AiResult<null>> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('ai_messages')
    .delete()
    .eq('thread_id', threadId)
    .eq('user_id', profile.id)

  if (error) return { ok: false, message: error.message }

  await supabase
    .from('ai_threads')
    .update({ title: null, last_message_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('user_id', profile.id)

  return { ok: true, data: null }
}

/** Remove a thread outright. ai_messages cascades — see migration 0007. */
export async function deleteThread(threadId: string): Promise<AiResult<null>> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('ai_threads')
    .delete()
    .eq('id', threadId)
    .eq('user_id', profile.id)

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: null }
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function getAssistantMuted(): Promise<boolean> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_preferences')
    .select('assistant_muted')
    .eq('user_id', profile.id)
    .maybeSingle()

  // No row yet means the user has never touched a preference. Default to
  // muted, matching the column default — silence is the safe default for a
  // device sitting on a shop counter.
  return data?.assistant_muted ?? true
}

export async function setAssistantMuted(muted: boolean): Promise<AiResult<null>> {
  const { profile } = await requireUser()
  const supabase = await createClient()

  // Upsert rather than update: the row is created lazily on first change, so
  // signup does not have to remember to seed a preferences row for everyone.
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: profile.id, assistant_muted: muted, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: null }
}
