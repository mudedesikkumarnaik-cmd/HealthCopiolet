import type { DailySample, HealthMetric } from '@/types/health'
import { addDays, average, percentChange, round } from '@/utils/formatters'

/**
 * Deterministic, FICTIONAL health sample data.
 *
 * These numbers are generated from a fixed seed so the app looks identical on
 * every load. They do NOT come from any medical device, wearable or clinic.
 */

export const DEMO_HISTORY_DAYS = 90

/** Small deterministic PRNG (mulberry32) so sample data never changes between loads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildDailySamples(): DailySample[] {
  const rand = mulberry32(0x5eed_1234)
  const samples: DailySample[] = []

  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = addDays(end, -(DEMO_HISTORY_DAYS - 1))

  for (let i = 0; i < DEMO_HISTORY_DAYS; i += 1) {
    const date = addDays(start, i)
    const weekday = date.getDay()
    const isWeekend = weekday === 0 || weekday === 6
    // Gentle improvement over the 90-day window plus weekly rhythm.
    const progress = i / DEMO_HISTORY_DAYS
    const wave = Math.sin(i / 8.5)
    const noise = rand() - 0.5

    const heartRate = Math.round(clamp(72 - progress * 6 + wave * 2.4 + noise * 5, 54, 88))
    const systolic = Math.round(clamp(126 - progress * 8 + wave * 3 + noise * 7, 104, 142))
    const diastolic = Math.round(clamp(80 - progress * 5 + wave * 2 + noise * 5, 62, 94))
    const sleepHours = round(
      clamp(6.4 + progress * 1.2 + wave * 0.5 + noise * 1.4 + (isWeekend ? 0.6 : 0), 4.4, 9.4),
      1,
    )
    const steps = Math.round(
      clamp(6800 + progress * 3200 + wave * 1100 + (isWeekend ? 1500 : -400) + noise * 3200, 2100, 17800),
    )
    const weightKg = round(clamp(77.4 - progress * 2.3 + wave * 0.35 + noise * 0.6, 71, 82), 1)

    samples.push({
      date: `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`,
      heartRate,
      systolic,
      diastolic,
      sleepHours,
      steps,
      weightKg,
    })
  }

  return samples
}

export const demoDailySamples: DailySample[] = buildDailySamples()

export function lastNSamples(days: number, samples: DailySample[] = demoDailySamples): DailySample[] {
  return samples.slice(Math.max(0, samples.length - days))
}

export function previousNSamples(
  days: number,
  samples: DailySample[] = demoDailySamples,
): DailySample[] {
  const end = samples.length - days
  return samples.slice(Math.max(0, end - days), Math.max(0, end))
}

function trendOf(change: number): HealthMetric['trend'] {
  if (change > 0.6) return 'up'
  if (change < -0.6) return 'down'
  return 'flat'
}

/** Builds the summary metric cards shown on the dashboard. */
export function buildDemoMetrics(samples: DailySample[] = demoDailySamples): HealthMetric[] {
  const current = lastNSamples(7, samples)
  const previous = previousNSamples(7, samples)

  const hrNow = average(current.map((s) => s.heartRate))
  const hrBefore = average(previous.map((s) => s.heartRate))

  const sysNow = average(current.map((s) => s.systolic))
  const sysBefore = average(previous.map((s) => s.systolic))

  const sleepNow = average(current.map((s) => s.sleepHours))
  const sleepBefore = average(previous.map((s) => s.sleepHours))

  const stepsNow = average(current.map((s) => s.steps))
  const stepsBefore = average(previous.map((s) => s.steps))

  const weightNow = current[current.length - 1]?.weightKg ?? 0
  const weightBefore = previous[previous.length - 1]?.weightKg ?? weightNow

  const hrChange = percentChange(hrNow, hrBefore)
  const bpChange = percentChange(sysNow, sysBefore)
  const sleepChange = percentChange(sleepNow, sleepBefore)
  const stepsChange = percentChange(stepsNow, stepsBefore)
  const weightChange = percentChange(weightNow, weightBefore)

  return [
    {
      id: 'heartRate',
      label: 'Resting heart rate',
      value: Math.round(hrNow),
      unit: 'bpm',
      precision: 0,
      changePct: round(hrChange, 1),
      trend: trendOf(hrChange),
      goalDirection: 'lower-is-better',
      description: '7-day average from your connected sample data.',
      explanation:
        'Resting heart rate is how many times your heart beats per minute while you are at rest. It varies a lot between people.',
    },
    {
      id: 'bloodPressure',
      label: 'Blood pressure',
      value: Math.round(sysNow),
      secondaryValue: Math.round(average(current.map((s) => s.diastolic))),
      unit: 'mmHg',
      secondaryUnit: 'mmHg',
      precision: 0,
      changePct: round(bpChange, 1),
      trend: trendOf(bpChange),
      goalDirection: 'lower-is-better',
      description: '7-day average (systolic / diastolic).',
      explanation:
        'Blood pressure is written as systolic over diastolic — the pressure when your heart beats, then rests between beats.',
    },
    {
      id: 'sleep',
      label: 'Sleep',
      value: round(sleepNow, 1),
      unit: 'h',
      precision: 1,
      changePct: round(sleepChange, 1),
      trend: trendOf(sleepChange),
      goalDirection: 'higher-is-better',
      description: 'Average hours per night this week.',
      explanation:
        'Sleep duration is the number of hours slept per night. Most adults are advised to aim for a consistent routine.',
    },
    {
      id: 'steps',
      label: 'Daily steps',
      value: Math.round(stepsNow),
      unit: 'steps',
      precision: 0,
      changePct: round(stepsChange, 1),
      trend: trendOf(stepsChange),
      goalDirection: 'higher-is-better',
      description: 'Daily average over the last 7 days.',
      explanation:
        'Step count is a simple activity measure. Any increase from your usual baseline can be a positive change.',
    },
    {
      id: 'weight',
      label: 'Weight',
      value: round(weightNow, 1),
      unit: 'kg',
      precision: 1,
      changePct: round(weightChange, 1),
      trend: trendOf(weightChange),
      goalDirection: 'neutral',
      description: 'Most recent sample reading.',
      explanation:
        'Body weight fluctuates naturally day to day. Trends over weeks are usually more meaningful than single readings.',
    },
  ]
}

export const demoMetrics: HealthMetric[] = buildDemoMetrics()
