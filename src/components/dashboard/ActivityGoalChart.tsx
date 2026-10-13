import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { getStepGoalSeries, getTodaySample } from '@/services/healthService'
import { formatCompactNumber } from '@/utils/formatters'

/** Weekly steps vs the user's configured goal (from Wellness & Goals). */
export function ActivityGoalChart({ goal }: { goal: number }) {
  const data = getStepGoalSeries(goal)
  const today = getTodaySample()
  const done = today.steps >= goal
  const progress = Math.min(100, Math.round((today.steps / goal) * 100))

  return (
    <Card className="h-full">
      <CardHeader
        title="Steps vs goal"
        description="Last 7 days of sample activity"
        action={
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {done ? 'Goal reached today' : `${progress}% today`}
          </span>
        }
      />
      <CardBody>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              tickFormatter={(value: number) => formatCompactNumber(value)}
              width={44}
            />
            <Tooltip content={<ChartTooltip unit="steps" />} cursor={{ fill: 'var(--line)', opacity: 0.5 }} />
            <ReferenceLine
              y={goal}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: `goal ${formatCompactNumber(goal)}`, fill: 'var(--muted)', fontSize: 11, position: 'insideTopRight' }}
            />
            <Bar dataKey="steps" name="Steps" fill="#0d9488" radius={[5, 5, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-3 text-xs text-muted">
          Sample data only — these figures are generated, not measured by a device.
        </p>
      </CardBody>
    </Card>
  )
}