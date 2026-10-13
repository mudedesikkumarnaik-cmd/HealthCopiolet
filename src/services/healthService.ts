import { buildDemoMetrics, demoDailySamples, demoMetrics, lastNSamples } from '@/data/demoHealthData'
import type { AnalyticsPeriod, DailySample, HealthMetric, MetricKind } from '@/types/health'
import { average, round, toISODate } from '@/utils/formatters'

/** Aggregated point used by the Recharts line/area charts. */
export interface TrendPoint {
  date: string
  label: string
  heartRate: number
  systolic: number
  diastolic: number
  sleepHours: number
  steps: number
  weightKg: number
}

export interface MetricSummary {
  id: MetricKind
  label: string
  unit: string
  current: number
  previous: number
  changePct: number
  precision: number
  description: string
}

function formatLabel(date: Date, period: AnalyticsPeriod): string {
  if (period === 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

/**
 * Clones the sample series with an optional edited current weight applied to
 * the most recent day. Leaves the module-level samples untouched so they can
 * be "reset to sample" later.
 */
function withWeightOverride(samples: DailySample[], weightKg?: number | null): DailySample[] {
  if (weightKg == null || samples.length === 0) return samples
  const copy = samples.slice()
  copy[copy.length - 1] = { ...copy[copy.length - 1], weightKg }
  return copy
}

export interface CurrentWeight {
  kg: number
  /** 'edited' when the user recorded their own reading; 'sample' otherwise. */
  source: 'edited' | 'sample'
  /** ISO date of the reading. */
  date: string
}

/** The weight shown as "current": the user's edited value when set, else the
 * newest generated sample reading. */
export function getCurrentWeight(weightKg?: number | null): CurrentWeight {
  const latest = demoDailySamples[demoDailySamples.length - 1]
  if (weightKg != null) {
    return { kg: weightKg, source: 'edited', date: latest.date }
  }
  return { kg: latest.weightKg, source: 'sample', date: latest.date }
}

/**
 * Buckets the daily sample values into chart-friendly points.
 * 7 & 30 days return daily points; 90 days returns weekly averages to keep the
 * chart readable. Values are averages within each bucket. An edited `weightKg`
 * replaces the most recent day's reading before bucketing.
 */
export function buildTrendPoints(
  period: AnalyticsPeriod,
  samples: DailySample[] = demoDailySamples,
  weightKg?: number | null,
): TrendPoint[] {
  const window = withWeightOverride(samples, weightKg).slice(Math.max(0, samples.length - period))
  if (window.length === 0) return []

  const bucketSize = period === 90 ? 7 : 1
  const points: TrendPoint[] = []

  for (let i = 0; i < window.length; i += bucketSize) {
    const bucket = window.slice(i, i + bucketSize)
    const anchor = bucket[bucket.length - 1]
    const [y, m, d] = anchor.date.split('-').map(Number)
    const date = new Date(y, (m ?? 1) - 1, d ?? 1)
    points.push({
      date: anchor.date,
      label: formatLabel(date, period),
      heartRate: Math.round(average(bucket.map((s) => s.heartRate))),
      systolic: Math.round(average(bucket.map((s) => s.systolic))),
      diastolic: Math.round(average(bucket.map((s) => s.diastolic))),
      sleepHours: round(average(bucket.map((s) => s.sleepHours)), 1),
      steps: Math.round(average(bucket.map((s) => s.steps))),
      weightKg: round(average(bucket.map((s) => s.weightKg)), 1),
    })
  }

  return points
}

function summarise(
  id: MetricKind,
  label: string,
  unit: string,
  precision: number,
  description: string,
  currentValues: number[],
  previousValues: number[],
): MetricSummary {
  const current = average(currentValues)
  const previous = average(previousValues)
  const changePct = previous ? ((current - previous) / previous) * 100 : 0
  return {
    id,
    label,
    unit,
    current: round(current, precision),
    previous: round(previous, precision),
    changePct: round(changePct, 1),
    precision,
    description,
  }
}

/** Summary cards for the analytics page, compared with the previous period. */
export function buildSummaries(
  period: AnalyticsPeriod,
  samples: DailySample[] = demoDailySamples,
): MetricSummary[] {
  const window = samples.slice(Math.max(0, samples.length - period))
  const previous = samples.slice(Math.max(0, samples.length - period * 2), Math.max(0, samples.length - period))

  const pick = (list: DailySample[], key: keyof DailySample) => list.map((s) => Number(s[key]))

  return [
    summarise(
      'heartRate',
      'Resting heart rate',
      'bpm',
      0,
      'Heart beats per minute while at rest. It varies widely between people.',
      pick(window, 'heartRate'),
      pick(previous, 'heartRate'),
    ),
    summarise(
      'bloodPressure',
      'Systolic pressure',
      'mmHg',
      0,
      'The upper blood-pressure number — the pressure when your heart contracts.',
      pick(window, 'systolic'),
      pick(previous, 'systolic'),
    ),
    summarise(
      'sleep',
      'Sleep',
      'h/night',
      1,
      'Average hours slept per night across the selected period.',
      pick(window, 'sleepHours'),
      pick(previous, 'sleepHours'),
    ),
    summarise(
      'steps',
      'Daily steps',
      'steps',
      0,
      'Average steps recorded per day across the selected period.',
      pick(window, 'steps'),
      pick(previous, 'steps'),
    ),
  ]
}

/** Latest metric cards (used by the dashboard). An edited weight replaces the
 * generated sample reading and is labelled "your edited reading". */
export function getMetrics(weightKg?: number | null): HealthMetric[] {
  if (weightKg == null) return demoMetrics
  const metrics = buildDemoMetrics(withWeightOverride(demoDailySamples, weightKg))
  return metrics.map((metric) =>
    metric.id === 'weight'
      ? { ...metric, description: 'Your edited reading.' }
      : metric,
  )
}

/** Last N daily samples, newest last. */
export function getSamples(days: number): DailySample[] {
  return lastNSamples(days)
}

export function getDailySamples(): DailySample[] {
  return demoDailySamples
}

/** Step-goal completion for the plausible "last 7 days" streak chart. */
export function getStepGoalSeries(goal: number): { label: string; steps: number; goal: number }[] {
  const week = lastNSamples(7)
  return week.map((sample) => {
    const [y, m, d] = sample.date.split('-').map(Number)
    return {
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
        new Date(y, (m ?? 1) - 1, d ?? 1),
      ),
      steps: sample.steps,
      goal,
    }
  })
}

/** 14-day sleep trend used on the dashboard. */
export function getSleepSeries(days = 14): { label: string; hours: number; target: number }[] {
  return lastNSamples(days).map((sample) => {
    const [y, m, d] = sample.date.split('-').map(Number)
    return {
      label: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
        new Date(y, (m ?? 1) - 1, d ?? 1),
      ),
      hours: sample.sleepHours,
      target: 7.5,
    }
  })
}

export function getTodaySample(): DailySample {
  return demoDailySamples[demoDailySamples.length - 1]
}

export function currentDateISO(): string {
  return toISODate(new Date())
}
