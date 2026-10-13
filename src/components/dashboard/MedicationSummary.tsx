import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Pill } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppData } from '@/context/DataContext'

export function MedicationSummary() {
  const { medications } = useAppData()
  const active = medications.filter((medication) => medication.status === 'active')
  const shown = active.slice(0, 4)

  return (
    <Card className="h-full">
      <CardHeader
        title="Active medications"
        description="What you have on file"
        icon={<Pill aria-hidden="true" className="size-4" />}
        action={
          <Link
            to="/prescriptions"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            View all <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        }
      />
      <CardBody>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Pill aria-hidden="true" className="size-5" />}
            title="No active medications"
            description="Add medicines on the Prescriptions page."
          />
        ) : (
          <ul className="space-y-2.5">
            {shown.map((medication) => (
              <li key={medication.id} className="flex items-start gap-3">
                <span
                  className={
                    medication.takenToday
                      ? 'mt-0.5 grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'mt-0.5 grid size-8 place-items-center rounded-lg bg-surface-2 text-muted'
                  }
                >
                  {medication.takenToday ? (
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                  ) : (
                    <Pill aria-hidden="true" className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{medication.name}</span>
                    <Badge tone={medication.takenToday ? 'success' : 'neutral'} className="shrink-0">
                      {medication.takenToday ? 'Taken' : 'Today'}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {medication.dosage} · {medication.frequency}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}