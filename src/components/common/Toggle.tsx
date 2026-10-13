import { useId } from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Accessible on/off switch with a label and optional description. */
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  const id = useId()
  return (
    <label className="switch" htmlFor={id}>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.88rem] font-semibold text-ink">{label}</span>
        {description && <span className="block text-[0.76rem] text-muted">{description}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        role="switch"
        aria-checked={checked}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
    </label>
  )
}
