import { Star } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * 1–5 star rating. Renders interactive buttons when `onChange` is provided
 * (feedback form) and a read-only row of stars otherwise (feedback board).
 */
export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
}) {
  const shape = size === 'sm' ? 'size-4' : 'size-6'
  const interactive = Boolean(onChange)

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? 'Rating' : `Rated ${value} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        const starElement = (
          <Star
            aria-hidden="true"
            className={cn(shape, filled ? 'fill-amber-400 text-amber-400' : 'text-muted')}
          />
        )

        if (!interactive) {
          return (
            <span key={star} className={shape}>
              {starElement}
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            aria-pressed={star === value}
            className={cn(shape, 'cursor-pointer transition-transform hover:scale-110')}
          >
            {starElement}
          </button>
        )
      })}
    </div>
  )
}