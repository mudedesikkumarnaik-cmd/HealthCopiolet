import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Set<number>())

  // Clear any pending auto-dismiss timers when the provider unmounts.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    }
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++counter
      setToasts((prev) => [...prev, { id, type, title, message }])
      const timer = window.setTimeout(() => {
        timers.current.delete(timer)
        dismiss(id)
      }, 4500)
      timers.current.add(timer)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[200] flex w-[min(360px,calc(100vw-40px))] flex-col gap-2.5"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info
          const color = t.type === 'success' ? 'var(--ok)' : t.type === 'error' ? 'var(--danger)' : 'var(--info)'
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role="status">
              <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-[0.85rem] font-bold">{t.title}</div>
                {t.message && <div className="text-[0.78rem] text-muted">{t.message}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-md border-0 bg-transparent p-1 text-muted hover:bg-surface-2"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
