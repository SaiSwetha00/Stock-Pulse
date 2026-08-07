'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'

/**
 * Voice input for the assistant's composer.
 *
 * Deliberately independent of the speaker/mute control. Muting is about what
 * the assistant says out loud; this is about what the user says to it. Someone
 * who does not want the app talking back on a shop floor still needs to be able
 * to talk to it with their hands full, so the two never share state.
 */

/**
 * Local structural types for the Web Speech API.
 *
 * The bundled DOM lib has a partial `SpeechRecognition` that is missing both
 * `abort()` and `SpeechRecognitionEvent.resultIndex`, and augmenting it would
 * mean declaring properties on a type that already exists. Describing only what
 * this component touches is smaller, and it fails at compile time if a property
 * is misspelled — which a cast to `any` would not.
 */
interface SpeechAlternative {
  transcript: string
}
interface SpeechResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechAlternative
}
interface SpeechResultList {
  readonly length: number
  [index: number]: SpeechResult
}
interface SpeechResultEvent {
  readonly resultIndex: number
  readonly results: SpeechResultList
}
interface SpeechErrorEvent {
  readonly error: string
}
interface SpeechRecognizer {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognizerCtor = new () => SpeechRecognizer

/** Chromium exposes this only under the webkit prefix; Firefox not at all. */
function getRecognizerCtor(): RecognizerCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognizerCtor
    webkitSpeechRecognition?: RecognizerCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Languages offered in the picker.
 *
 * Labels are written in the language itself, not in English: someone looking
 * for Telugu scans for "తెలుగు", and making them recognise the English word
 * "Telugu" first is a small tax paid by exactly the people this list is for.
 */
const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'bn-IN', label: 'বাংলা' },
] as const

const STORAGE_KEY = 'stockpulse.voice.lang'

/**
 * Neither support nor the stored language ever changes while the page is open,
 * so there is nothing to subscribe to. useSyncExternalStore is still the right
 * tool: it is the one way to read a browser-only value with an explicit server
 * snapshot, so the server renders "unsupported" and the client corrects it
 * during hydration instead of the two disagreeing.
 */
function subscribeNever(): () => void {
  return () => {}
}

/**
 * Picks a starting language from what the browser reports.
 *
 * Every entry in navigator.languages is tried in order for an exact match
 * first, then for the base language. A browser listing ["en-US","en-IN","te"]
 * gets en-US; one listing ["te"] gets te-IN rather than falling back to English
 * merely because the region tag was missing.
 */
function detectLanguage(): string {
  const candidates =
    typeof navigator !== 'undefined' && navigator.languages?.length
      ? Array.from(navigator.languages)
      : [typeof navigator !== 'undefined' ? navigator.language : 'en-IN']

  for (const candidate of candidates) {
    if (!candidate) continue
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === candidate.toLowerCase())
    if (exact) return exact.code
  }
  for (const candidate of candidates) {
    if (!candidate) continue
    const base = candidate.split('-')[0]?.toLowerCase()
    const partial = LANGUAGES.find((l) => l.code.split('-')[0].toLowerCase() === base)
    if (partial) return partial.code
  }
  return 'en-IN'
}

/** A previously chosen language wins over detection; anything stale or removed
 *  from the list falls back to detection rather than selecting nothing. */
function readStoredLanguage(): string {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private browsing can throw on localStorage access; detection still works.
  }
  return stored && LANGUAGES.some((l) => l.code === stored) ? stored : detectLanguage()
}

type VoiceState = 'idle' | 'listening' | 'processing'

/**
 * What the browser reports when recognition fails, mapped to something a
 * shopkeeper can act on. `aborted` is absent on purpose — it is what fires when
 * we stop the microphone ourselves, and is not an error to report.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow it from the icon in your browser’s address bar, then try again.',
  'service-not-allowed':
    'Microphone access is blocked. Allow it from the icon in your browser’s address bar, then try again.',
  'audio-capture':
    'No microphone found. Check that one is connected and not in use by another app.',
  network: 'Voice input needs an internet connection. Reconnect and try again.',
  'no-speech': 'Didn’t catch anything — try speaking a little closer to the microphone.',
  'language-not-supported':
    'This browser cannot recognise that language. Try another one from the list.',
}

export default function VoiceInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  const [state, setState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)
  // null until the user picks one, so detection stays in charge until then.
  const [chosenLanguage, setChosenLanguage] = useState<string | null>(null)

  const supported = useSyncExternalStore(
    subscribeNever,
    () => getRecognizerCtor() !== null,
    () => false,
  )
  const detected = useSyncExternalStore(subscribeNever, readStoredLanguage, () => 'en-IN')
  const language = chosenLanguage ?? detected

  const recognitionRef = useRef<SpeechRecognizer | null>(null)
  // What was already in the composer when the microphone started. Speech is
  // appended to it rather than replacing it, so a half-typed question survives.
  const baseRef = useRef('')
  // Held in refs as well: the recognition callbacks are bound once at start()
  // and would otherwise close over stale values.
  const finalRef = useRef('')
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Stop the microphone if the component goes away. Closing the assistant
  // unmounts this subtree, and a session left running would keep the browser's
  // recording indicator lit with no visible control anywhere to stop it.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    // stop() lets the service return what it has heard already; abort() would
    // throw away the last few words the user just said.
    setState('processing')
    recognitionRef.current.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor()
    if (!Ctor) return

    setError(null)
    const recognition = new Ctor()
    recognition.lang = language
    // Continuous so a pause for breath does not end the session mid-sentence;
    // interim so words appear as they are spoken rather than in one lump at
    // the end.
    recognition.continuous = true
    recognition.interimResults = true

    baseRef.current = value.trim()
    finalRef.current = ''

    recognition.onresult = (event: SpeechResultEvent) => {
      let interim = ''
      // From resultIndex, not 0: in continuous mode the event carries only what
      // is new, and re-reading from the start would duplicate earlier phrases.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalRef.current += text
        else interim += text
      }
      const spoken = (finalRef.current + interim).trim()
      onChangeRef.current([baseRef.current, spoken].filter(Boolean).join(' '))
    }

    recognition.onerror = (event: SpeechErrorEvent) => {
      if (event.error === 'aborted') return
      setError(ERROR_MESSAGES[event.error] ?? 'Voice input stopped unexpectedly. Try again.')
    }

    recognition.onend = () => {
      setState('idle')
      recognitionRef.current = null
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setState('listening')
    } catch {
      // start() throws if a session is somehow already running. Reset rather
      // than leave the button stuck in a state the user cannot clear.
      setState('idle')
      setError('Voice input could not start. Try again.')
    }
  }, [language, value])

  // Nothing is known yet on the first client render, and Firefox and most
  // non-Chromium browsers have no SpeechRecognition at all. Rendering a button
  // that can only fail is worse than rendering none.
  if (!supported) return null

  const listening = state === 'listening'
  const processing = state === 'processing'

  return (
    <>
      <select
        value={language}
        onChange={(e) => {
          setChosenLanguage(e.target.value)
          try {
            window.localStorage.setItem(STORAGE_KEY, e.target.value)
          } catch {
            // The preference simply will not persist. Not worth interrupting anyone over.
          }
        }}
        // Changing language mid-session would mean tearing down and rebuilding
        // the recognition object; locking it while live is simpler and matches
        // what anyone expects of a control that is currently in use.
        disabled={listening || processing}
        aria-label="Voice input language"
        className="control-h-sm shrink-0 rounded-lg bg-transparent px-1 text-xs text-muted focus:outline-none disabled:opacity-40"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled || processing}
        aria-label={listening ? 'Stop recording' : 'Start voice input'}
        aria-pressed={listening}
        className={`tap-target relative shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          listening ? 'bg-danger text-surface' : 'text-muted hover:bg-surface-muted'
        }`}
      >
        {/* The expanding ring is the "this is recording" signal. It is
            motion-safe: anyone who has asked for reduced motion still gets the
            solid red fill and the swapped icon, which carry the same meaning
            without anything moving. */}
        {listening && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-danger opacity-60 motion-safe:animate-ping"
          />
        )}
        <span className="relative flex items-center justify-center">
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : listening ? (
            <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          ) : (
            <Mic className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Announced rather than shown: the red button and the ring already say
          "recording" visually, and a second visible label would shove the
          composer around every time the microphone is used. */}
      <span className="sr-only" role="status">
        {listening ? 'Recording. Speak now.' : processing ? 'Finishing transcription.' : ''}
      </span>

      {error && (
        <p role="alert" className="basis-full px-2 pt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </>
  )
}
