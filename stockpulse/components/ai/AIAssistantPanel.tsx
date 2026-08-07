'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Sparkles,
  Send,
  Archive,
  TrendingUp,
  AlertTriangle,
  Bot,
  History,
  Volume2,
  VolumeX,
  Eraser,
  Loader2,
} from 'lucide-react'
import type { Profile, Store } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import RichText from './RichText'
import ThreadList from './ThreadList'
import VoiceInput from './VoiceInput'
import {
  listThreads,
  createThread,
  loadThread,
  clearThread,
  deleteThread,
  getAssistantMuted,
  setAssistantMuted,
  type ThreadSummary,
} from '@/app/(dashboard)/ai/actions'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

const SUGGESTIONS = [
  { icon: Archive, text: 'Check inventory for 2% Milk' },
  { icon: TrendingUp, text: "Show today's produce sales" },
  { icon: AlertTriangle, text: 'Identify low stock items' },
]

export default function AIAssistantPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  store: Store
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Muted until the stored preference says otherwise. The old panel spoke every
  // reply unconditionally with no way to stop it; starting silent means the
  // worst case of a slow preference read is a quiet assistant, not one that
  // announces itself across a shop floor before the user can find the switch.
  const [muted, setMuted] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const refreshThreads = useCallback(async () => {
    const res = await listThreads()
    if (res.ok) setThreads(res.data)
  }, [])

  /**
   * History and the mute preference load once, on the first open — not on
   * mount. The provider wraps every dashboard page, so fetching at mount would
   * put two queries on the critical path of every navigation for a panel most
   * visits never open.
   */
  useEffect(() => {
    if (!isOpen || loadedRef.current) return
    loadedRef.current = true
    setThreadsLoading(true)
    Promise.all([listThreads(), getAssistantMuted()])
      .then(([threadRes, mutedPref]) => {
        if (threadRes.ok) setThreads(threadRes.data)
        setMuted(mutedPref)
      })
      .finally(() => setThreadsLoading(false))
  }, [isOpen])

  /**
   * Stop talking when the panel closes.
   *
   * speechSynthesis is a browser-level queue, not a component one: without this
   * an utterance started in the panel keeps reading aloud after it is shut,
   * with no visible control left anywhere on the page to stop it.
   */
  useEffect(() => {
    if (isOpen) return
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    abortRef.current?.abort()
  }, [isOpen])

  const toggleMuted = useCallback(async () => {
    const next = !muted
    setMuted(next)
    if (next && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    const res = await setAssistantMuted(next)
    // Revert on failure rather than leave the control showing a state the
    // server did not accept — the next page load would silently disagree.
    if (!res.ok) {
      setMuted(!next)
      setNotice('Could not save that preference.')
    }
  }, [muted])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return
      setNotice(null)

      // A thread is created on the first message, never on open. Opening the
      // panel and closing it again should not litter the history with empty
      // conversations the user then has to clean up.
      let activeThread = threadId
      if (!activeThread) {
        const created = await createThread()
        if (created.ok) {
          activeThread = created.data
          setThreadId(activeThread)
        } else {
          // The answer is still worth having. Say plainly that this one will
          // not be kept rather than failing the whole send.
          setNotice('Could not start a saved conversation — this exchange will not be kept.')
        }
      }

      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text }
      const modelMsgId = crypto.randomUUID()
      const nextMessages = [...messages, userMsg]
      setMessages([...nextMessages, { id: modelMsgId, role: 'model', text: '' }])
      setInput('')
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            threadId: activeThread,
            messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
          }),
        })

        if (!res.body) throw new Error('No response stream')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value, { stream: true })
          setMessages((prev) => prev.map((m) => (m.id === modelMsgId ? { ...m, text: full } : m)))
        }

        if (!muted && 'speechSynthesis' in window && full) {
          const utterance = new SpeechSynthesisUtterance(full.replace(/[*#]/g, ''))
          utterance.rate = 1.05
          window.speechSynthesis.speak(utterance)
        }

        // Titles are assigned server-side once the turn is stored, so the list
        // is re-read afterwards rather than guessed at here.
        if (activeThread) void refreshThreads()
      } catch (err) {
        // An abort is the user switching conversations or closing the panel.
        // Replacing their message with an error would be wrong: nothing failed.
        if (err instanceof DOMException && err.name === 'AbortError') return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId
              ? { ...m, text: 'Sorry, something went wrong. Please try again.' }
              : m,
          ),
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming, threadId, muted, refreshThreads],
  )

  const startNewChat = useCallback(() => {
    abortRef.current?.abort()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setMessages([])
    setThreadId(null)
    setHistoryOpen(false)
    setNotice(null)
  }, [])

  const selectThread = useCallback(async (id: string) => {
    abortRef.current?.abort()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setHistoryOpen(false)
    setSwitching(true)
    setNotice(null)
    const res = await loadThread(id)
    setSwitching(false)
    if (!res.ok) {
      setNotice('Could not open that conversation.')
      return
    }
    setThreadId(id)
    setMessages(res.data.map((m) => ({ id: m.id, role: m.role, text: m.content })))
  }, [])

  const removeThread = useCallback(
    async (id: string) => {
      // Optimistic: the row leaves the list immediately, and the refresh below
      // puts it back if the delete did not actually take.
      setThreads((prev) => prev.filter((t) => t.id !== id))
      if (id === threadId) startNewChat()
      const res = await deleteThread(id)
      if (!res.ok) setNotice('Could not delete that conversation.')
      void refreshThreads()
    },
    [threadId, startNewChat, refreshThreads],
  )

  const doClearChat = useCallback(async () => {
    setConfirmClear(false)
    if (!threadId) {
      setMessages([])
      return
    }
    const res = await clearThread(threadId)
    if (!res.ok) {
      setNotice('Could not clear this conversation.')
      return
    }
    setMessages([])
    void refreshThreads()
  }, [threadId, refreshThreads])

  /**
   * Escape closes the panel — or the history drawer, if that is what is open.
   * Dismissing the whole assistant because someone glanced at their history and
   * changed their mind would throw away the conversation they were in.
   */
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmClear) return // the dialog handles its own Escape
      if (historyOpen) {
        setHistoryOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, historyOpen, confirmClear])

  if (!isOpen) return null

  return (
    <>
      {/* Decorative scrim. It keeps click-to-close for mouse users but is
          hidden from assistive tech: it is not a control, and the close button
          below already gives the keyboard a way out — as does Escape, wired up
          in the effect above. */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground">
              <Bot className="h-5 w-5 text-surface" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="ai-assistant-title" className="truncate text-base font-bold text-foreground">
                Store Assistant
              </h3>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Online
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-label="Conversation history"
              aria-expanded={historyOpen}
              className={`tap-target rounded-lg ${
                historyOpen
                  ? 'bg-surface-muted text-foreground'
                  : 'text-muted hover:bg-surface-muted hover:text-foreground'
              }`}
            >
              <History className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? 'Turn on spoken replies' : 'Turn off spoken replies'}
              aria-pressed={!muted}
              className="tap-target rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
            >
              {muted ? (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="tap-target rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {notice && (
          <p role="status" className="shrink-0 bg-surface-muted px-6 py-2 text-xs text-muted-strong">
            {notice}
          </p>
        )}

        <div className="relative min-h-0 flex-1">
          <div ref={scrollRef} className="h-full overflow-y-auto px-6 py-6">
            {switching ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Opening conversation…
              </p>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
                  <Sparkles className="h-7 w-7 text-muted-strong" />
                </div>
                <h4 className="text-lg font-bold text-foreground">How can I help you today?</h4>
                <p className="mt-2 max-w-xs text-sm text-muted">
                  I can check stock, analyze sales data, or help manage staff schedules.
                </p>
                <div className="mt-6 w-full space-y-2.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface-muted px-4 py-3.5 text-left text-sm font-medium text-muted-strong hover:bg-surface-muted"
                    >
                      <s.icon className="h-4 w-4 shrink-0 text-muted" />
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-foreground text-surface'
                          : 'bg-surface-muted text-foreground'
                      }`}
                    >
                      {m.text ? (
                        <RichText text={m.text} />
                      ) : isStreaming && m.role === 'model' ? (
                        '…'
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* The history drawer covers the conversation rather than sitting
              beside it: the panel is 448px at its widest, and a two-column
              split would leave neither column usable. */}
          {historyOpen && (
            <div className="absolute inset-0 z-10 flex flex-col bg-surface">
              <ThreadList
                threads={threads}
                activeId={threadId}
                loading={threadsLoading}
                onSelect={selectThread}
                onNew={startNewChat}
                onDelete={removeThread}
              />
              <div className="shrink-0 border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  disabled={messages.length === 0}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-strong transition-colors hover:bg-surface-muted hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                >
                  <Eraser className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Clear current chat
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-muted px-2 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, sales, or staff"
              className="control-h min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
            {/* Voice input is independent of the speaker control above: muting
                what the assistant says must never stop the user talking to it. */}
            <VoiceInput value={input} onChange={setInput} disabled={isStreaming} />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
              className="tap-target shrink-0 rounded-full bg-foreground text-surface disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-muted">
            AI can make mistakes. Verify critical data before acting.
          </p>
        </div>
      </div>

      {confirmClear && (
        <Modal
          title="Clear this conversation?"
          onClose={() => setConfirmClear(false)}
          width="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doClearChat}>
                Clear chat
              </Button>
            </div>
          }
        >
          <div className="px-6 py-5">
            <p className="text-sm text-muted-strong">
              This removes all {messages.length} message{messages.length === 1 ? '' : 's'} in this
              conversation. It cannot be undone.
            </p>
            <p className="mt-3 text-sm text-muted">
              The conversation itself stays open, so you can carry on asking questions — it just
              starts empty. To remove it entirely, use the delete button in the history list.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
