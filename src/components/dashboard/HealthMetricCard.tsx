import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, HeartPulse, Minus, Moon, Footprints, Activity, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { HealthMetric } from '@/types/health'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const METRIC_ICONS: Record<HealthMetric['id'], LucideIcon> = {
  heartRate: HeartPulse,
  bloodPressure: Activity,
  sleep: Moon,
  steps: Footprints,
  weight: Scale,
}

/** Where each summary card should lead. */
const METRIC_LINKS: Record<HealthMetric['id'], string> = {
  heartRate: '/analytics',
  bloodPressure: '/analytics',
  sleep: '/analytics',
  steps: '/wellness',
  weight: '/wellness',
}

export function HealthMetricCard({ metric }: { metric: HealthMetric }) {
  const Icon = METRIC_ICONS[metric.id]
  const value = metric.secondaryValue !== undefined
    ? `${formatNumber(metric.value, metric.precision)}/${formatNumber(metric.secondaryValue, metric.precision)}`
    : formatNumber(metric.value, metric.precision)

  const isGoodTrend =
    metric.goalDirection === 'higher-is-better'
      ? metric.changePct > 0
      : metric.goalDirection === 'lower-is-better'
        ? metric.changePct < 0
        : Math.abs(metric.changePct) < 2

  const TrendIcon = metric.changePct > 0.4 ? ArrowUpRight : metric.changePct < -0.4 ? ArrowDownRight : Minus

  return (
    <Link
      to={METRIC_LINKS[metric.id]}
      className="card group relative flex flex-col gap-3 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:p-5"
      aria-label={`${metric.label}: ${value} ${metric.unit}. ${metric.description} Open details.`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
            isGoodTrend
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : metric.goalDirection === 'neutral'
                ? 'bg-surface-2 text-muted'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
          )}
          title="Change versus the previous 7 days"
        >
          <TrendIcon aria-hidden="true" className="size-3.5" />
          {formatPercent(metric.changePct, 1)}
        </span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{metric.label}</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-ink">{value}</span>
          <span className="text-xs font-medium text-muted">{metric.unit}</span>
        </p>
        <p className="mt-1.5 text-xs text-muted">{metric.description}</p>
      </div>

      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-brand-300">
        View details
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </span>
    </Link>
  )
}

/** Renders a compact text-only metric (used by the wellness page header). */
export function MetricValue({ metric }: { metric: HealthMetric }) {
  const value =
    metric.secondaryValue !== undefined
      ? `${formatNumber(metric.value, metric.precision)}/${formatNumber(metric.secondaryValue, metric.precision)}`
      : formatNumber(metric.value, metric.precision)
  return (
    <p className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-ink">{value}</span>
      <span className="text-xs font-medium text-muted">{metric.unit}</span>
    </p>
  )
}