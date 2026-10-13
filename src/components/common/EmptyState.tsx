import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
