/** Minimal typing for the Web Speech API (SpeechRecognition) without a DOM lib. */

export interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

/** True when the browser supports speech-to-text (Chrome/Edge/Safari). */
export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/** Creates a speech recognizer, or null when the browser does not support it. */
export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (!speechRecognitionAvailable()) return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}