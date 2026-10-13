import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Info, Pencil, RotateCcw, Save, Scale } from 'lucide-react'
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
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { TextField } from '@/components/common/FormControls'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { buildSummaries, buildTrendPoints, getCurrentWeight } from '@/services/healthService'
import type { AnalyticsPeriod } from '@/types/health'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

type PeriodKey = '7' | '30' | '90'

const PERIODS: Array<{ value: PeriodKey; label: string }> = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

function SummaryCard({
  label,
  unit,
  value,
  precision,
  changePct,
  description,
}: {
  label: string
  unit: string
  value: number
  precision: number
  changePct: number
  description: string
}) {
  const improving = changePct >= 0
  const flat = Math.abs(changePct) < 0.05
  return (
    <Card>
      <CardBody className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink">
          {formatNumber(value, precision)}
          {unit && unit !== 'steps' && unit !== 'h/night' ? (
            <span className="ml-1 text-sm font-medium text-muted">{unit}</span>
          ) : null}
        </p>
        <span className="flex items-center gap-1">
          <Badge
            tone={flat ? 'neutral' : 'success'}
            icon={
              flat ? null : improving ? (
                <ArrowUpRight aria-hidden="true" className="size-3" />
              ) : (
                <ArrowDownRight aria-hidden="true" className="size-3" />
              )
            }
          >
            {formatPercent(changePct)} vs previous period
          </Badge>
        </span>
        <p className="text-xs leading-relaxed text-muted">{description}</p>
      </CardBody>
    </Card>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader title={title} description={subtitle} />
      <CardBody>{children}</CardBody>
    </Card>
  )
}

export function AnalyticsPage() {
  const { weightKg, updateWeight, clearWeight } = useAppData()
  const toast = useToast()
  const [periodKey, setPeriodKey] = useState<PeriodKey>('30')
  const [editingWeight, setEditingWeight] = useState(false)
  const [weightDraft, setWeightDraft] = useState('')
  const period = Number(periodKey) as AnalyticsPeriod

  const summaries = useMemo(() => buildSummaries(period), [period])
  const points = useMemo(() => buildTrendPoints(period, undefined, weightKg), [period, weightKg])
  const currentWeight = useMemo(() => getCurrentWeight(weightKg), [weightKg])

  const bucketLabel = period === 90 ? 'Weekly averages' : 'Daily points'
  const chartMargin = { top: 8, right: 8, left: -12, bottom: 0 }

  const startWeightEdit = () => {
    setWeightDraft(String(currentWeight.kg))
    setEditingWeight(true)
  }

  const handleWeightSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const kg = Number(weightDraft.trim().replace(',', '.'))
    if (!Number.isFinite(kg) || kg < 30 || kg > 600) {
      toast.error('Invalid weight', 'Enter a weight between 30 and 600 kg.')
      return
    }
    const rounded = Math.round(kg * 10) / 10
    updateWeight(rounded)
    setEditingWeight(false)
    toast.success('Weight updated', `Your current weight is now ${formatNumber(rounded, 1)} kg.`)
  }

  const handleWeightReset = () => {
    clearWeight()
    toast.success('Weight reset', 'Showing the generated sample reading again.')
  }

  return (
    <PageContainer>
      <PageHeading
        title="Health Analytics"
        eyebrow="Trends"
        description="Averaged trends from your fictional sample data — not readings from any medical device."
        actions={
          <SegmentedControl
            ariaLabel="Analytics period"
            value={periodKey}
            onChange={setPeriodKey}
            options={PERIODS}
          />
        }
      />

      <section aria-label="Metric summaries" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map((summary) => (
          <SummaryCard
            key={summary.id}
            label={summary.label}
            unit={summary.unit}
            value={summary.current}
            precision={summary.precision}
            changePct={summary.changePct}
            description={summary.description}
          />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Resting heart rate" subtitle={`${bucketLabel}, beats per minute`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={chartMargin}>
              <defs>
                <linearGradient id="an-hr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis domain={['dataMin - 6', 'dataMax + 6']} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
              <Tooltip content={<ChartTooltip unit="bpm" />} />
              <Area type="monotone" dataKey="heartRate" name="Heart rate" stroke="#0d9488" strokeWidth={2.5} fill="url(#an-hr)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Blood pressure" subtitle={`${bucketLabel}, systolic & diastolic mmHg`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis domain={['dataMin - 8', 'dataMax + 8']} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
              <Tooltip content={<ChartTooltip unit="mmHg" />} />
              <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0d9488" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sleep" subtitle={`${bucketLabel}, hours per night`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={chartMargin}>
              <defs>
                <linearGradient id="an-sleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
              <Tooltip content={<ChartTooltip unit="h" formatter={(value) => `${formatNumber(value, 1)} h`} />} />
              <Area type="monotone" dataKey="sleepHours" name="Sleep" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#an-sleep)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily steps" subtitle={`${bucketLabel}, steps per day`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={points} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
              <Tooltip content={<ChartTooltip unit="steps" />} cursor={{ fill: 'var(--line)', opacity: 0.5 }} />
              <Bar dataKey="steps" name="Steps" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card>
        <CardHeader
          icon={<Scale className="size-4" />}
          title="Weight"
          description={`${bucketLabel}, kilograms — ${
            currentWeight.source === 'edited'
              ? 'showing your edited reading'
              : 'latest reading from your sample data'
          }`}
          action={
            editingWeight ? null : (
              <Button size="sm" variant="secondary" leftIcon={<Pencil className="size-3.5" />} onClick={startWeightEdit}>
                Edit weight
              </Button>
            )
          }
        />
        <CardBody>
          {editingWeight ? (
            <form
              onSubmit={handleWeightSave}
              className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4 sm:flex-row sm:items-end"
            >
              <TextField
                label="Current weight (kg)"
                type="number"
                min={30}
                max={600}
                step={0.1}
                value={weightDraft}
                onChange={(event) => setWeightDraft(event.target.value)}
                className="sm:w-48"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" leftIcon={<Save className="size-3.5" />}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingWeight(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-muted">
                Current
                <span className="text-2xl font-bold text-ink">
                  {formatNumber(currentWeight.kg, 1)}
                  <span className="ml-1 text-sm font-medium text-muted">kg</span>
                </span>
                <span className="text-xs text-muted">
                  {currentWeight.source === 'edited' ? '· your edited reading' : '· from your sample data'}
                </span>
              </p>
              {currentWeight.source === 'edited' ? (
                <button
                  type="button"
                  onClick={handleWeightReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  <RotateCcw aria-hidden="true" className="size-3" />
                  Reset to sample
                </button>
              ) : null}
            </div>
          )}
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis domain={['dataMin - 1.5', 'dataMax + 1.5']} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={42} />
              <Tooltip content={<ChartTooltip unit="kg" formatter={(value) => `${formatNumber(value, 1)} kg`} />} />
              <Line type="monotone" dataKey="weightKg" name="Weight" stroke="#0f766e" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<Info className="size-4" />}
          title="About this data"
          description="Where the numbers come from, how realistic they are, and how the details are shown."
        />
        <CardBody>
          <dl className="grid gap-x-6 gap-y-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">Where the data comes from</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                Every reading is fictional. Ninety days of daily samples are generated in your
                browser from a fixed seed, so the charts look the same on each load. No medical
                device, wearable or clinic is connected.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">How realistic is it?</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                Values sit in plausible adult ranges — resting heart rate 54–88&nbsp;bpm, blood
                pressure 104–142/62–94&nbsp;mmHg, sleep 4.4–9.4&nbsp;h, steps 2,100–17,800 and
                weight 71–82&nbsp;kg — with day-to-day fluctuation and a gentle improving trend.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">How the details are shown</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                Summary cards average the selected window and compare it with the previous window
                of equal length (the change badge). Charts plot one point per day in the 7- and
                30-day views, and weekly averages in the 90-day view.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Editing your weight</dt>
              <dd className="mt-1 leading-relaxed text-muted">
                Use Edit&nbsp;weight on the Weight chart to record your own reading — it replaces
                the sample for your account in this browser, and Reset&nbsp;to&nbsp;sample brings
                the generated value back. None of this is a medical measurement.
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card className={cn('border-line bg-surface-2/60')}>
        <CardBody className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
          <p>
            Trend summaries compare the selected window with the previous window of equal length.
            All values are generated sample data — they are not a diagnosis and
            should not influence real decisions without your clinician.
          </p>
        </CardBody>
      </Card>
    </PageContainer>
  )
}