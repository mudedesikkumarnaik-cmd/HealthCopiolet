import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { buildTrendPoints } from '@/services/healthService'
import type { AnalyticsPeriod } from '@/types/health'
import { formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

type ChartKind = 'heartRate' | 'bloodPressure' | 'sleep' | 'steps'
type ChartPeriod = 7 | 30 | 90

const TABS: Array<{ id: ChartKind; label: string }> = [
  { id: 'heartRate', label: 'Heart rate' },
  { id: 'bloodPressure', label: 'Blood pressure' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'steps', label: 'Steps' },
]

const PERIODS: Array<{ value: ChartPeriod; label: string }> = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

function chartConfig(kind: ChartKind, period: ChartPeriod) {
  const data = buildTrendPoints(period as AnalyticsPeriod)
  return { data, kind, period }
}

export function HealthTrendsChart() {
  const [kind, setKind] = useState<ChartKind>('heartRate')
  const [period, setPeriod] = useState<ChartPeriod>(7)
  const { data } = useMemo(() => chartConfig(kind, period), [kind, period])

  const sleepUnit = 'h'

  const renderChart = () => {
    const common = {
      data,
      margin: { top: 8, right: 8, left: -12, bottom: 0 },
    }

    if (kind === 'steps') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart {...common}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
            <Tooltip content={<ChartTooltip unit="steps" />} cursor={{ fill: 'var(--line)', opacity: 0.5 }} />
            <Bar dataKey="steps" name="Steps" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (kind === 'bloodPressure') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis domain={['dataMin - 8', 'dataMax + 8']} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
            <Tooltip content={<ChartTooltip unit="mmHg" />} />
            <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0d9488" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (kind === 'sleep') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart {...common}>
            <defs>
              <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
            <Tooltip content={<ChartTooltip unit={sleepUnit} />} />
            <Area type="monotone" dataKey="sleepHours" name="Sleep" stroke="#0d9488" strokeWidth={2.5} fill="url(#sleepFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart {...common}>
          <defs>
            <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <YAxis domain={['dataMin - 6', 'dataMax + 6']} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
          <Tooltip content={<ChartTooltip unit="bpm" />} />
          <Area type="monotone" dataKey="heartRate" name="Heart rate" stroke="#0d9488" strokeWidth={2.5} fill="url(#hrFill)" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  const latest = data[data.length - 1]
  const changeLabel =
    kind === 'steps'
      ? formatNumber(latest?.steps ?? 0)
      : kind === 'bloodPressure'
        ? `${latest?.systolic}/${latest?.diastolic}`
        : kind === 'sleep'
          ? `${formatNumber(latest?.sleepHours ?? 0, 1)}h`
          : `${formatNumber(latest?.heartRate ?? 0)} bpm`

  return (
    <Card>
      <CardHeader
        title="Health trends"
        description="Fictional sample data from the last few weeks"
        icon={<TrendingUp aria-hidden="true" className="size-4" />}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center rounded-lg border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Chart period">
              {PERIODS.map((periodOption) => (
                <button
                  key={periodOption.value}
                  type="button"
                  role="tab"
                  aria-selected={period === periodOption.value}
                  onClick={() => setPeriod(periodOption.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    period === periodOption.value
                      ? 'bg-surface text-ink shadow-card'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {periodOption.label}
                </button>
              ))}
            </div>
          </div>
        }
      />
      <CardBody>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Chart metric">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={kind === tab.id}
              onClick={() => setKind(tab.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                kind === tab.id
                  ? 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
            <span className="font-semibold text-ink">{changeLabel}</span>
            latest
          </span>
        </div>

        <div className="mt-4">{renderChart()}</div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <p>
            {kind === 'steps'
              ? 'Average daily steps per bucket.'
              : kind === 'bloodPressure'
                ? 'Systolic and diastolic pressures in mmHg.'
                : kind === 'sleep'
                  ? 'Average hours of sleep per night.'
                  : 'Average resting heart rate in beats per minute.'}
          </p>
          <Link to="/analytics" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Full analytics <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}