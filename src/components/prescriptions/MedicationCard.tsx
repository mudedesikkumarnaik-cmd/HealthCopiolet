import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import type { BadgeTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardFooter } from '@/components/common/Card'
import type { Medication, MedicationStatus } from '@/types/health'
import { formatDate, formatTime } from '@/utils/formatters'

const STATUS_TONES: Record<MedicationStatus, BadgeTone> = {
  active: 'success',
  paused: 'warning',
  completed: 'neutral',
}

const STATUS_LABELS: Record<MedicationStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
}

export function MedicationCard({
  medication,
  onToggleTaken,
  onEdit,
  onDelete,
}: {
  medication: Medication
  onToggleTaken: (medication: Medication) => void
  /** Omit to render a read-only card (e.g. the patient's own list). */
  onEdit?: (medication: Medication) => void
  onDelete?: (medication: Medication) => void
}) {
  const isActive = medication.status === 'active'
  const canManage = Boolean(onEdit || onDelete)

  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-semibold text-ink">{medication.name}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {medication.dosage} · {medication.frequency}
            </p>
          </div>
          <Badge tone={STATUS_TONES[medication.status]}>{STATUS_LABELS[medication.status]}</Badge>
        </div>

        <dl className="mt-1 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Prescriber</dt>
            <dd className="text-right text-ink-soft">{medication.prescriber}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Started</dt>
            <dd className="text-right text-ink-soft">{formatDate(medication.startDate)}</dd>
          </div>
          {medication.endDate ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">End date</dt>
              <dd className="text-right text-ink-soft">{formatDate(medication.endDate)}</dd>
            </div>
          ) : null}
          {medication.lastTakenAt ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Last taken</dt>
              <dd className="text-right text-ink-soft">{formatTime(medication.lastTakenAt)}</dd>
            </div>
          ) : null}
          {medication.notes ? (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
              {medication.notes}
            </p>
          ) : null}
        </dl>
      </CardBody>

      <CardFooter className="gap-2">
        {isActive ? (
          <Button
            variant={medication.takenToday ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onToggleTaken(medication)}
            leftIcon={
              medication.takenToday ? (
                <CheckCircle2 aria-hidden="true" className="size-4" />
              ) : (
                <Circle aria-hidden="true" className="size-4" />
              )
            }
          >
            {medication.takenToday ? 'Taken today' : 'Mark taken'}
          </Button>
        ) : (
          <span className="text-xs text-muted">No daily tracker for this status</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {canManage ? (
            <>
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${medication.name}`}
                  onClick={() => onEdit(medication)}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${medication.name}`}
                  onClick={() => onDelete(medication)}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-muted">Prescribed by your care team</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}