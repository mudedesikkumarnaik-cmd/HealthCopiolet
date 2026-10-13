import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Consistent responsive content container used by every page. */
export function PageContainer({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'wide'
}) {
  const maxWidth =
    size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-[1600px]' : 'max-w-[1400px]'
  return (
    <div className={cn('mx-auto w-full space-y-5', maxWidth, className)}>{children}</div>
  )
}
