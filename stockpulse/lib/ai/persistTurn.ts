import type { SupabaseClient } from '@supabase/supabase-js'

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
 * Mirrors the CHECK on ai_messages.content. Over-length text is trimmed rather
 * than rejected: losing the tail of a long answer beats losing all of it to a
 * constraint violation the user can neither see nor act on.
 */
const CONTENT_MAX = 20_000

/**
 * Store one complete exchange — the question and the answer — and move the
 * thread to the top of the history list.
 *
 * This lives server-side, called from the chat route once streaming finishes,
 * rather than in the browser after the stream ends. The difference matters: if
 * someone closes the panel or the tab while the model is still talking, the
 * client never gets to make that call and the reply is lost, leaving a question
 * in the history with no answer under it. The route's stream runs to completion
 * regardless, so persisting here records the turn either way.
 *
 * Failures are returned, never thrown: this runs inside the stream's cleanup,
 * where an exception would surface as a broken response to a question the model
 * has already answered correctly on screen.
 */
export async function persistTurn({
  supabase,
  threadId,
  userId,
  userText,
  modelText,
}: {
  supabase: SupabaseClient
  threadId: string
  userId: string
  userText: string
  modelText: string
}): Promise<{ ok: boolean; message?: string }> {
  const rows = [
    { thread_id: threadId, user_id: userId, role: 'user', content: userText.slice(0, CONTENT_MAX) },
  ]
  // An empty model reply is possible — a turn that produced only tool calls and
  // then failed. Skip it rather than trip the length CHECK.
  if (modelText.trim()) {
    rows.push({
      thread_id: threadId,
      user_id: userId,
      role: 'model',
      content: modelText.slice(0, CONTENT_MAX),
    })
  }

  // Ownership is confirmed before the insert, not after. The RLS policy on
  // ai_messages checks `user_id = auth.uid()` on the row being written — it
  // says nothing about the thread that row points at, so a caller who guessed
  // another person's thread id could otherwise append to it. They still could
  // not read it back, but writing into someone else's history is not a
  // failure mode worth leaving open.
  const { data: thread } = await supabase
    .from('ai_threads')
    .select('title')
    .eq('id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!thread) return { ok: false, message: 'Conversation not found.' }

  const { error } = await supabase.from('ai_messages').insert(rows)
  if (error) return { ok: false, message: error.message }

  // Title only if the thread has none, so a conversation keeps the subject it
  // started with instead of being renamed by its most recent question.
  const patch: { last_message_at: string; title?: string } = {
    last_message_at: new Date().toISOString(),
  }
  if (!thread.title) patch.title = titleFromMessage(userText)

  await supabase.from('ai_threads').update(patch).eq('id', threadId).eq('user_id', userId)

  return { ok: true }
}
