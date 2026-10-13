import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { compressImageDataUrl } from '@/utils/imageCapture'

/**
 * Full-screen camera viewfinder backed by getUserMedia. The captured frame is
 * downscaled before it is handed back, so chat threads stay small.
 */
export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        if (!cancelled) {
          setError(
            'The camera could not be opened. Check your browser’s permission prompt or use “Choose photo” instead.',
          )
        }
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || busy) return
    setBusy(true)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setBusy(false)
      onClose()
      return
    }
    ctx.drawImage(video, 0, 0)
    const raw = canvas.toDataURL('image/jpeg', 0.9)
    void compressImageDataUrl(raw).then(
      (dataUrl) => {
        onCapture(dataUrl)
        setBusy(false)
      },
      () => {
        setBusy(false)
        onClose()
      },
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Camera aria-hidden="true" className="size-4" />
          Take a photo
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="grid size-9 place-items-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 size-full object-cover"
        />
        {error ? (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <p className="text-sm text-white/90">{error}</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-5">
        <Button variant="secondary" onClick={onClose} className="min-w-28">
          Cancel
        </Button>
        <Button
          onClick={capture}
          disabled={Boolean(error) || busy}
          leftIcon={<Camera aria-hidden="true" className="size-4" />}
          className="min-w-28"
        >
          {busy ? 'Preparing…' : 'Capture'}
        </Button>
      </div>
    </div>
  )
}