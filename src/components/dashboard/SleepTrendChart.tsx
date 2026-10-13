import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Moon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ChartTooltip } from '@/components/common/ChartTooltip'
import { getSleepSeries } from '@/services/healthService'

export function SleepTrendChart() {
  const data = getSleepSeries(14)

  return (
    <Card className="h-full">
      <CardHeader
        title="Sleep trend"
        description="14 nights of sample data"
        icon={<Moon aria-hidden="true" className="size-4" />}
      />
      <CardBody>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="sleepDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
            <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} width={40} />
            <Tooltip content={<ChartTooltip unit="h" />} />
            <ReferenceLine
              y={7.5}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: '7.5h', fill: 'var(--muted)', fontSize: 11, position: 'insideBottomLeft' }}
            />
            <Area type="monotone" dataKey="hours" name="Sleep" stroke="#6366f1" strokeWidth={2.5} fill="url(#sleepDash)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  )
}