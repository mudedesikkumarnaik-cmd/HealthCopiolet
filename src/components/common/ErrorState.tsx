import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  action,
  className,
}: {
  title?: string
  message: ReactNode
  onRetry?: () => void
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="alert"
      className={
        className ??
        'flex flex-col items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
      }
    >
      <div className="flex items-start gap-2">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <div className="mt-0.5">{message}</div>
        </div>
      </div>
      {onRetry || action ? (
        <div className="flex items-center gap-2 pl-6">
          {onRetry ? (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}
