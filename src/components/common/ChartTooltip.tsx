import type { TooltipProps } from 'recharts'
import type { ReactNode } from 'react'
import { formatNumber } from '@/utils/formatters'

export interface TooltipLine {
  name: string
  value: number
  color?: string
  precision?: number
  unit?: string
}

/**
 * Shared, slightly customised tooltip for Recharts.
 * Accepts either raw Recharts payloads or simple line descriptors.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name?: string | number; value?: number | string; color?: string; payload?: unknown }>
  label?: string | number
  unit?: string
  formatter?: (value: number, name: string | number | undefined) => ReactNode
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      role="status"
      className="min-w-36 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-raised"
    >
      {label !== undefined && label !== '' ? (
        <p className="mb-1.5 font-semibold text-ink">{label}</p>
      ) : null}
      <dl className="space-y-1">
        {payload.map((entry, index) => {
          const value = typeof entry.value === 'number' ? entry.value : Number(entry.value)
          const name = entry.name
          return (
            <div key={`${String(entry.name ?? index)}-${index}`} className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-1.5 text-muted">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: entry.color ?? '#14b8a6' }}
                />
                {name}
              </dt>
              <dd className="font-semibold text-ink">
                {formatter ? formatter(value, name) : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/** Type-only re-export so chart components can stay generic if needed. */
export type { TooltipProps }