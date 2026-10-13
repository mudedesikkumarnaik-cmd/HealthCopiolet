import { initials } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const SIZES = {
  sm: 'size-8 text-[0.7rem]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const

export function Avatar({
  name,
  color = '#0d9488',
  size = 'md',
  className,
}: {
  name: string
  color?: string
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white/70 dark:ring-white/10',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  )
}
