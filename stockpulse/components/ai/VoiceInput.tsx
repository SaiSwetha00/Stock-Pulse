'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'

/**
 * Voice input for the assistant's composer.
 *
 * One button. Tap to speak, words appear in the input as you talk, tap again to
 * stop, then edit before sending. There is no language picker — that was scope
 * nobody asked for, and a dropdown wedged beside a text field is clutter in the
 * one place the interface should be calm.
 *
 * Deliberately independent of the speaker/mute control. Muting governs what the
 * assistant says out loud; this governs what the user says to it. Someone who
 * does not want the app talking back on a shop floor still needs to talk to it
 * with their hands full.
 */

/**
 * Local structural types for the Web Speech API.
 *
 * `types/speech.d.ts` in this repo hand-declares a global `SpeechRecognition`
 * that omits `abort()`, `maxAlternatives`, `onstart` and
 * `SpeechRecognitionEvent.resultIndex`. That is a repo file, not the bundled
 * DOM lib — an earlier commit message of mine blamed the lib, wrongly.
 * Declaring only what this file touches keeps the two from fighting and still
 * fails at compile time on a typo, which a cast to `any` would not.
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
  maxAlternatives: number
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
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
 * Fixed, not chosen. en-IN reads Indian-accented English and copes with the
 * English loanwords that pepper Hindi and Telugu speech in a shop, which is the
 * realistic case here.
 */
const LANGUAGE = 'en-IN'

/**
 * Nothing to subscribe to — support does not change while the page is open.
 * useSyncExternalStore is still right: it is the one way to read a browser-only
 * value with an explicit server snapshot, so the server renders "unsupported"
 * and the client corrects it during hydration rather than the two disagreeing.
 */
function subscribeNever(): () => void {
  return () => {}
}

/**
 * What the browser reports, mapped to something a shopkeeper can act on.
 * `aborted` is absent on purpose: it fires when we stop the microphone
 * ourselves and is not an error.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'audio-capture': 'No microphone found. Check one is connected and not in use by another app.',
  network: 'Voice input needs an internet connection. Reconnect and try again.',
  'no-speech': 'Didn’t catch that — try again, a little closer to the microphone.',
  'language-not-supported': 'This browser cannot recognise speech here.',
  'service-not-allowed': 'Speech recognition is turned off in this browser’s settings.',
}

function blockedMessage(): string {
  const host = typeof window === 'undefined' ? 'this site' : window.location.host
  return `Microphone access is blocked for ${host}. Permission is per-site, so allowing it elsewhere does not count — open the icon at the left of the address bar, set Microphone to Allow, then reload.`
}

type VoiceState = 'idle' | 'listening' | 'processing'

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

  const recognitionRef = useRef<SpeechRecognizer | null>(null)
  /** Text already in the composer when the mic started; speech appends to it. */
  const baseRef = useRef('')
  const finalRef = useRef('')

  // Callbacks are bound once at start() and would otherwise close over stale
  // values, which is why these are refs rather than state.
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  useEffect(() => {
    onChangeRef.current = onChange
    valueRef.current = value
  }, [onChange, value])

  const supported = useSyncExternalStore(
    subscribeNever,
    () => getRecognizerCtor() !== null,
    () => false,
  )

  // Stop the microphone if the component goes away. Closing the assistant
  // unmounts this subtree, and a session left running keeps the browser's
  // recording indicator lit with no visible control to stop it.
  useEffect(() => {
    return () => {
      const r = recognitionRef.current
      recognitionRef.current = null
      r?.abort()
    }
  }, [])

  const stop = useCallback(() => {
    const r = recognitionRef.current
    if (!r) return
    setState('processing')
    // stop() lets the service return what it has already heard; abort() would
    // throw away the last few words.
    r.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor()
    if (!Ctor) return

    setError(null)

    // An insecure origin is refused and reported as `not-allowed`, which is
    // indistinguishable from a denial and unfixable from site settings. Worth
    // naming separately, or someone on a LAN address keeps granting a
    // permission that was never the problem.
    if (!window.isSecureContext) {
      setError(
        `Voice input needs a secure connection. ${window.location.host} is plain http — use https, or open the app on localhost.`,
      )
      return
    }

    const recognition = new Ctor()
    recognition.lang = LANGUAGE
    /**
     * Single-utterance, not continuous.
     *
     * Continuous is the fragile mode: Chrome ends the session itself after a
     * pause and, with no user gesture left to restart it, the button silently
     * flips back to idle having captured nothing — which is exactly the "it
     * does not work" failure. One question per tap matches how this is
     * actually used, and `onend` keeps whatever was transcribed.
     */
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    baseRef.current = valueRef.current.trim()
    finalRef.current = ''

    recognition.onstart = () => setState('listening')

    recognition.onresult = (event: SpeechResultEvent) => {
      let interim = ''
      // From resultIndex: the event carries only what is new, and re-reading
      // from zero would duplicate earlier phrases.
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
      if (event.error === 'not-allowed') {
        setError(blockedMessage())
        return
      }
      // The raw code is included for anything unmapped. A message naming the
      // failure can be acted on; "something went wrong" cannot.
      setError(ERROR_MESSAGES[event.error] ?? `Voice input stopped (${event.error}). Try again.`)
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setState('idle')
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      // Optimistic: onstart is authoritative but can lag behind the permission
      // prompt, and a button that looks dead for a second reads as broken.
      setState('listening')
    } catch {
      // start() throws if a session is somehow already running. Reset rather
      // than leave the button stuck in a state the user cannot clear.
      recognitionRef.current = null
      setState('idle')
      setError('Voice input could not start. Try again.')
    }
  }, [])

  // Nothing is known on the first client render, and Firefox has no
  // SpeechRecognition at all. A button that can only fail is worse than none.
  if (!supported) return null

  const listening = state === 'listening'
  const processing = state === 'processing'

  return (
    <>
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled || processing}
        aria-label={listening ? 'Stop recording' : 'Ask by voice'}
        aria-pressed={listening}
        className={`tap-target relative shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          listening
            ? 'bg-danger text-surface'
            : 'text-muted hover:bg-surface-muted hover:text-foreground'
        }`}
      >
        {/* The expanding ring is the "recording" signal. motion-safe, so anyone
            who asked for reduced motion still gets the solid fill and the
            swapped icon, which carry the same meaning without movement. */}
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

      {/* Announced rather than shown: the red button and ring already say
          "recording", and a visible label would shove the composer around every
          time the microphone is used. */}
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
