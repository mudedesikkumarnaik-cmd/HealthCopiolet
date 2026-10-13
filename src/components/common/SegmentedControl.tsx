import type { LucideIcon } from 'lucide-react'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
  icon?: LucideIcon
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? 'active' : ''}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
