import { Link } from 'react-router-dom'
import { ArrowRight, Bot, Sparkles } from 'lucide-react'
import { ActivityGoalChart } from '@/components/dashboard/ActivityGoalChart'
import { HealthMetricCard } from '@/components/dashboard/HealthMetricCard'
import { HealthTrendsChart } from '@/components/dashboard/HealthTrendsChart'
import { MedicationSummary } from '@/components/dashboard/MedicationSummary'
import { RecentRecords } from '@/components/dashboard/RecentRecords'
import { SleepTrendChart } from '@/components/dashboard/SleepTrendChart'
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { WellnessProgress } from '@/components/dashboard/WellnessProgress'
import { Card, CardBody } from '@/components/common/Card'
import { useAppData } from '@/context/DataContext'
import { getMetrics } from '@/services/healthService'
import type { MetricKind } from '@/types/health'

const DASHBOARD_METRICS: MetricKind[] = ['heartRate', 'bloodPressure', 'sleep', 'steps']

function AssistantQuickAccess() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1 bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 p-5 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"
        />
        <span className="grid size-11 place-items-center rounded-xl bg-white/15">
          <Bot aria-hidden="true" className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Ask your health assistant</h2>
        <p className="mt-1 text-sm text-white/85">
          Plain-language help with records, terms and preparing for your next visit. Assistant replies
          are clearly labelled.
        </p>
        <div className="mt-4 space-y-2">
          <Link
            to="/assistant"
            state={{ prompt: 'Explain my latest health report in simple language.' }}
            className="block rounded-xl bg-white/15 px-3.5 py-2.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
          >
            Explain my latest health report…
          </Link>
          <Link
            to="/assistant"
            state={{ prompt: 'Help me prepare questions for my next doctor visit.' }}
            className="block rounded-xl bg-white/15 px-3.5 py-2.5 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
          >
            Prepare questions for my next visit…
          </Link>
        </div>
        <Link
          to="/assistant"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          Open assistant
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { goals } = useAppData()
  const metrics = getMetrics().filter((metric) => DASHBOARD_METRICS.includes(metric.id))
  const stepsGoal = goals.find((goal) => goal.kind === 'steps')?.target ?? 8000

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <WelcomeBanner />

      <section aria-label="Key health metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {metrics.map((metric) => (
          <HealthMetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HealthTrendsChart />
        </div>
        <AssistantQuickAccess />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActivityGoalChart goal={stepsGoal} />
        <SleepTrendChart />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <UpcomingAppointments />
        <RecentRecords />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MedicationSummary />
        <WellnessProgress />
      </div>

      <Card>
        <CardBody className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted">
            <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-brand-600 dark:text-brand-300" />
            All dashboard metrics are fictional sample data. They are not readings from any
            medical device and are not a diagnosis.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}