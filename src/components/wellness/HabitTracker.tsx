import { Activity, Circle, Droplets, Footprints, Moon, Sparkles, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import type { Habit } from '@/types/health'
import { toISODate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const HABIT_ICONS: Record<string, LucideIcon> = {
  Droplets,
  Footprints,
  Moon,
  Activity,
  Sparkles,
  Target,
}

interface DayCell {
  iso: string
  weekday: string
  isToday: boolean
}

/** Builds the last seven days, oldest first, ending today. */
function lastSevenDays(): DayCell[] {
  const days: DayCell[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    days.push({
      iso: toISODate(date),
      weekday: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date),
      isToday: offset === 0,
    })
  }
  return days
}

export function HabitTracker({
  habits,
  onToggle,
}: {
  habits: Habit[]
  onToggle: (id: string, date: string) => void
}) {
  const days = lastSevenDays()

  if (habits.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="py-6 text-center text-sm text-muted">
            No habits yet. Add recurring habits to build a simple seven-day checklist.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Seven-day habits"
        description="Tap a circle to log (or un-log) that day for that habit."
      />
      <CardBody className="hc-scroll overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <caption className="sr-only">Daily habit checklist for the last seven days</caption>
          <thead>
            <tr>
              <th scope="col" className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Habit
              </th>
              {days.map((day) => (
                <th
                  key={day.iso}
                  scope="col"
                  className={cn('pb-2 text-center text-xs font-semibold', day.isToday ? 'text-brand-700 dark:text-brand-300' : 'text-muted')}
                >
                  {day.isToday ? 'Today' : day.weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const Icon = HABIT_ICONS[habit.icon] ?? Circle
              const doneCount = habit.completedDates.filter((date) =>
                days.some((day) => day.iso === date),
              ).length
              return (
                <tr key={habit.id} className="border-t border-line">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{habit.label}</span>
                        <span className="block text-[0.68rem] text-muted">
                          {doneCount}/{days.length} this week
                        </span>
                      </span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const done = habit.completedDates.includes(day.iso)
                    return (
                      <td key={day.iso} className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onToggle(habit.id, day.iso)}
                          aria-label={`${habit.label} ${done ? 'completed on' : 'not completed on'} ${
                            day.isToday ? 'today' : day.weekday
                          }. ${done ? 'Tap to undo.' : 'Tap to log.'}`}
                          aria-pressed={done}
                          className={cn(
                            'mx-auto grid size-8 place-items-center rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                            done
                              ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-brand-950'
                              : 'border-line-strong bg-surface text-muted hover:border-brand-300 hover:text-brand-600',
                          )}
                        >
                          {done ? <Sparkles aria-hidden="true" className="size-3.5" /> : null}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  )
}