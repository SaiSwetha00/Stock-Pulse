'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Sparkles, Send, Mic, Archive, TrendingUp, AlertTriangle, Bot } from 'lucide-react'
import type { Profile, Store } from '@/types'
import RichText from './RichText'

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

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

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
  const [isListening, setIsListening] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return
      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text }
      const modelMsgId = crypto.randomUUID()
      const nextMessages = [...messages, userMsg]
      setMessages([...nextMessages, { id: modelMsgId, role: 'model', text: '' }])
      setInput('')
      setIsStreaming(true)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          setMessages((prev) =>
            prev.map((m) => (m.id === modelMsgId ? { ...m, text: full } : m))
          )
        }

        if ('speechSynthesis' in window && full) {
          const utterance = new SpeechSynthesisUtterance(full.replace(/[*#]/g, ''))
          utterance.rate = 1.05
          window.speechSynthesis.speak(utterance)
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId ? { ...m, text: 'Sorry, something went wrong. Please try again.' } : m
          )
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, isStreaming]
  )

  function toggleMic() {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      alert('Voice input is not supported in this browser.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  /**
   * Escape closes the panel.
   *
   * It had no keyboard dismissal at all: the only way out was clicking the
   * scrim or the X, so a keyboard user who opened it was stuck tabbing through
   * the conversation to find the close button.
   */
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

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
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground">
              <Bot className="h-5 w-5 text-surface" aria-hidden="true" />
            </div>
            <div>
              <h3 id="ai-assistant-title" className="text-base font-bold text-foreground">
                Store Assistant
              </h3>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="tap-target rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
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
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

        <div className="border-t border-border px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-2 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, sales, or staff"
              className="control-h flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleMic}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={isListening}
              className={`tap-target shrink-0 rounded-full ${
                isListening ? 'bg-danger text-surface' : 'text-muted hover:bg-surface-muted'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
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
    </>
  )
}
