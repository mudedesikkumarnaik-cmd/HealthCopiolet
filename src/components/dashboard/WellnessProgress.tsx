import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Circle, Target } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppData } from '@/context/DataContext'
import { todayISO, clampPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export function WellnessProgress() {
  const { goals, habits } = useAppData()
  const today = todayISO()
  const completedToday = habits.filter((habit) => habit.completedDates.includes(today)).length

  const overall =
    goals.length > 0
      ? Math.round(
          (goals.reduce((sum, goal) => sum + clampPercent((goal.current / goal.target) * 100), 0) /
            goals.length) *
            100,
        ) / 100
      : 0

  return (
    <Card className="h-full">
      <CardHeader
        title="Wellness progress"
        description={`${completedToday} of ${habits.length} habits done today`}
        icon={<Target aria-hidden="true" className="size-4" />}
        action={
          <Link
            to="/wellness"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Manage goals <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        }
      />
      <CardBody>
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target aria-hidden="true" className="size-5" />}
            title="No active goals"
            description="Set a personal target on the Wellness page."
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div
                role="progressbar"
                aria-valuenow={Math.round(overall)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall goal progress"
                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, overall)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-ink">{Math.round(overall)}%</span>
            </div>

            <ul className="mt-4 space-y-3">
              {goals.slice(0, 4).map((goal) => {
                const progress = clampPercent((goal.current / goal.target) * 100)
                const reached = goal.current >= goal.target
                return (
                  <li key={goal.id}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-ink-soft">
                        {reached ? (
                          <CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-500" />
                        ) : (
                          <Circle aria-hidden="true" className="size-3.5 text-muted" />
                        )}
                        {goal.title}
                      </span>
                      <span className="text-muted">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          reached ? 'bg-emerald-500' : 'bg-brand-500',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  )
}