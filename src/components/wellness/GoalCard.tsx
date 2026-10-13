import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Droplets, Footprints, Moon, Target, Timer } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardFooter } from '@/components/common/Card'
import type { GoalKind, WellnessGoal } from '@/types/health'
import { clampPercent, formatNumber } from '@/utils/formatters'

const KIND_ICONS: Record<GoalKind, LucideIcon> = {
  steps: Footprints,
  sleep: Moon,
  hydration: Droplets,
  activity: Timer,
  custom: Target,
}

const STEP_RANGE: Record<GoalKind, number> = {
  steps: 500,
  sleep: 0.5,
  hydration: 1,
  activity: 5,
  custom: 1,
}

export function GoalCard({
  goal,
  onUpdate,
  onEdit,
  onDelete,
}: {
  goal: WellnessGoal
  onUpdate: (id: string, patch: Partial<WellnessGoal>) => void
  onEdit: (goal: WellnessGoal) => void
  onDelete: (goal: WellnessGoal) => void
}) {
  const Icon = KIND_ICONS[goal.kind]
  const percent = clampPercent((goal.current / goal.target) * 100)
  const step = STEP_RANGE[goal.kind]

  const bump = (direction: 1 | -1) => {
    const next = Math.max(0, Math.round((goal.current + direction * step) * 10) / 10)
    onUpdate(goal.id, { current: next })
  }

  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink">{goal.title}</h3>
              <p className="text-xs text-muted">
                {goal.period === 'daily' ? 'Daily' : 'Weekly'} target
              </p>
            </div>
          </div>
          <Badge tone={percent >= 100 ? 'success' : percent >= 60 ? 'brand' : 'neutral'}>
            {formatNumber(percent)}%
          </Badge>
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} progress`}
          className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-sm text-ink-soft">
          <span className="font-bold text-ink">{formatNumber(goal.current, goal.target % 1 ? 1 : 0)}</span>
          <span className="text-muted"> / {formatNumber(goal.target, goal.target % 1 ? 1 : 0)} {goal.unit}</span>
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => bump(-1)}
            aria-label={`Decrease ${goal.title} progress`}
            leftIcon={<Minus className="size-4" />}
          />
          <p className="text-[0.68rem] text-muted">
            Adjust progress by {formatNumber(step, step % 1 ? 1 : 0)} {goal.unit}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => bump(1)}
            aria-label={`Increase ${goal.title} progress`}
            leftIcon={<Plus className="size-4" />}
          />
        </div>
      </CardBody>

      <CardFooter className="justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(goal)} leftIcon={<Pencil className="size-3.5" />}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(goal)}
          leftIcon={<Trash2 className="size-3.5" />}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          Remove
        </Button>
      </CardFooter>
    </Card>
  )
}