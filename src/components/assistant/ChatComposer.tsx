import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Mic, Paperclip, SendHorizontal, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { CameraCapture } from './CameraCapture'
import { useDismissable } from '@/hooks/useDismissable'
import { fileToChatAttachment } from '@/utils/imageCapture'
import { createSpeechRecognition, speechRecognitionAvailable } from '@/utils/speech'
import type { ChatAttachment } from '@/types/health'
import { cn } from '@/utils/cn'

export function ChatComposer({
  onSend,
  disabled,
  placeholder = 'Ask about your health records, medicines, or routines…',
  autoFocusText = '',
}: {
  onSend: (text: string, attachment?: ChatAttachment) => void
  disabled?: boolean
  placeholder?: string
  /** Initial text inserted when the composer first mounts (e.g. a quick action). */
  autoFocusText?: string
}) {
  const [value, setValue] = useState(() => autoFocusText || '')
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(() => speechRecognitionAvailable())

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null)

  useDismissable(menuRef, attachMenuOpen, () => setAttachMenuOpen(false))

  // Focus the composer when a quick-action prompt was prefilled on mount.
  useEffect(() => {
    if (autoFocusText) {
      textareaRef.current?.focus()
    }
  }, [autoFocusText])

  // Stop any in-flight speech recognition when the component unmounts.
  useEffect(
    () => () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    },
    [],
  )

  const canSend = (value.trim().length > 0 || attachment !== null) && !disabled

  const submit = () => {
    const text = value.trim()
    if (disabled) return
    if (!text && !attachment) return
    onSend(text, attachment ?? undefined)
    setValue('')
    setAttachment(null)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setAttachment(await fileToChatAttachment(file))
    } catch {
      // Unsupported file types are simply ignored, so the composer stays usable.
    }
  }

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    if (!speechRecognitionAvailable()) {
      setVoiceSupported(false)
      return
    }
    const recognition = createSpeechRecognition()
    if (!recognition) {
      setVoiceSupported(false)
      return
    }
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      if (transcript.trim()) {
        setValue((current) => (current ? `${current.trim()} ${transcript.trim()}` : transcript.trim()))
      }
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
    }
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div>
      {attachment ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2 pl-3">
          <img
            src={attachment.dataUrl}
            alt={attachment.name || 'Photo attached to your message'}
            className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-line"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-muted">
            {attachment.kind === 'camera' ? 'Photo from your camera' : attachment.name || 'Selected photo'}
          </p>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Remove photo"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card transition-colors focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20">
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAttachMenuOpen((open) => !open)}
            disabled={disabled || attachMenuOpen}
            aria-label="Attach a photo"
            aria-expanded={attachMenuOpen}
            aria-haspopup="menu"
            className="shrink-0 rounded-xl text-muted"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
          </Button>

          {attachMenuOpen ? (
            <div className="absolute bottom-12 left-0 z-20 w-60 animate-fade-in rounded-xl border border-line bg-surface p-1 shadow-pop">
              <button
                type="button"
                onClick={() => {
                  setAttachMenuOpen(false)
                  setCameraOpen(true)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <Camera aria-hidden="true" className="size-4 shrink-0 text-muted" />
                <span>
                  <span className="block text-sm font-medium text-ink">Take a photo</span>
                  <span className="block text-xs text-muted">Use the camera to show the problem</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttachMenuOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <Paperclip aria-hidden="true" className="size-4 shrink-0 text-muted" />
                <span>
                  <span className="block text-sm font-medium text-ink">Choose a photo</span>
                  <span className="block text-xs text-muted">Pick an image from your device</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <label htmlFor="assistant-composer" className="sr-only">
          Message the health assistant
        </label>
        <textarea
          id="assistant-composer"
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          rows={2}
          maxLength={2000}
          disabled={disabled}
          placeholder={placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVoice}
          disabled={disabled || !voiceSupported}
          aria-label={listening ? 'Stop voice input' : 'Speak your question'}
          title={voiceSupported ? (listening ? 'Stop voice input' : 'Speak your question') : 'Voice input is not supported in this browser'}
          className={cn('shrink-0 rounded-xl', listening && 'animate-pulse-soft text-rose-600')}
        >
          <Mic aria-hidden="true" className="size-5" />
        </Button>

        <Button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          leftIcon={<SendHorizontal aria-hidden="true" className="size-4" />}
          className="shrink-0"
        >
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <p className="mt-2 text-[0.68rem] text-muted">
        Enter to send · Shift+Enter for a new line · You can speak, type or attach a photo.{' '}
        {!voiceSupported ? 'Voice input needs Chrome, Edge or Safari.' : ''}
      </p>

      {cameraOpen ? (
        <CameraCapture
          onCapture={(dataUrl) => {
            setAttachment({ dataUrl, name: 'camera-photo.jpg', kind: 'camera' })
            setCameraOpen(false)
          }}
          onClose={() => setCameraOpen(false)}
        />
      ) : null}
    </div>
  )
}