import { useMemo, useState } from 'react'
import { Plus, Sparkles, Target, Trophy } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody } from '@/components/common/Card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import type { WellnessGoal } from '@/types/health'
import { GoalCard } from '@/components/wellness/GoalCard'
import { GoalForm } from '@/components/wellness/GoalForm'
import { HabitTracker } from '@/components/wellness/HabitTracker'
import { clampPercent, formatNumber } from '@/utils/formatters'
import { todayISO } from '@/utils/formatters'

function encouragement(percent: number, habitPercent: number): string {
  if (percent >= 90 && habitPercent >= 80)
    return 'Excellent consistency — keep doing what works for you.'
  if (percent >= 60) return 'Great progress. Small, steady steps add up.'
  if (habitPercent >= 50) return 'Your habit streak is building nicely. Keep a steady rhythm.'
  return 'Every day is a fresh start. Pick one small goal to focus on.'
}

export function WellnessPage() {
  const { goals, updateGoal, removeGoal, habits, toggleHabit } = useAppData()
  const toast = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WellnessGoal | null>(null)
  const [deleting, setDeleting] = useState<WellnessGoal | null>(null)

  const overallPercent = useMemo(() => {
    if (goals.length === 0) return 0
    const total = goals.reduce((sum, goal) => sum + clampPercent((goal.current / goal.target) * 100), 0)
    return Math.round(total / goals.length)
  }, [goals])

  const habitPercent = useMemo(() => {
    if (habits.length === 0) return 0
    const today = todayISO()
    const done = habits.filter((habit) => habit.completedDates.includes(today)).length
    return Math.round((done / habits.length) * 100)
  }, [habits])

  const handleDeleteGoal = () => {
    if (!deleting) return
    removeGoal(deleting.id)
    toast.success('Goal removed', `${deleting.title} was deleted from your board.`)
    setDeleting(null)
  }

  return (
    <PageContainer>
      <PageHeading
        title="Wellness & Goals"
        eyebrow="Tracking"
        description="Personal targets and simple daily habits. These are tracking tools, not medical prescriptions."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            leftIcon={<Plus className="size-4" />}
          >
            Add goal
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Trophy aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">Overall goal progress</p>
                <p className="text-lg font-bold text-ink">{formatNumber(overallPercent)}%</p>
              </div>
              <div
                role="progressbar"
                aria-valuenow={overallPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall goal progress"
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">{encouragement(overallPercent, habitPercent)}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <Sparkles aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Habits completed today</p>
              <p className="text-lg font-bold text-ink">
                {formatNumber(habitPercent)}%
                <span className="ml-1 text-xs font-medium text-muted">
                  ({habits.filter((habit) => habit.completedDates.includes(todayISO())).length}/{habits.length} habit
                  {habits.length === 1 ? '' : 's'})
                </span>
              </p>
              <p className="mt-2 text-xs text-muted">
                Tap the day circles below to keep your seven-day streak alive.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Target aria-hidden="true" className="size-4 text-brand-600 dark:text-brand-300" />
            Your goals
          </h2>
        </div>
        {goals.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<Target className="size-5" />}
                title="No goals yet"
                description="Add a personal target for steps, sleep, hydration, activity or anything else."
                action={
                  <Button size="sm" onClick={() => setFormOpen(true)} leftIcon={<Plus className="size-4" />}>
                    Add goal
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={updateGoal}
                onEdit={(item) => {
                  setEditing(item)
                  setFormOpen(true)
                }}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      <HabitTracker
        habits={habits}
        onToggle={(id, date) => {
          toggleHabit(id, date)
          const habit = habits.find((item) => item.id === id)
          if (habit) {
            const wasDone = habit.completedDates.includes(date)
            toast.success(
              wasDone ? 'Day un-logged' : 'Day logged',
              `${habit.label} — ${wasDone ? 'removed' : 'added'} for ${date}.`,
            )
          }
        }}
      />

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} goal={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDeleteGoal}
        title="Remove this goal?"
        description={
          <>
            “{deleting?.title}” will be removed from your wellness board. Progress data for it is not
            kept.
          </>
        }
        confirmLabel="Remove goal"
      />
    </PageContainer>
  )
}