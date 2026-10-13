import { CalendarX2, MapPin, Pencil, Phone, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import type { BadgeTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardFooter } from '@/components/common/Card'
import type { Appointment, AppointmentMode, AppointmentStatus } from '@/types/health'
import { formatDateTime, formatDuration, formatRelativeDay, humanize } from '@/utils/formatters'

const MODE_ICONS: Record<AppointmentMode, typeof MapPin> = {
  'in-person': MapPin,
  video: Video,
  phone: Phone,
}

const STATUS_TONES: Record<AppointmentStatus, BadgeTone> = {
  scheduled: 'brand',
  completed: 'success',
  cancelled: 'neutral',
}

function ModeBadge({ mode }: { mode: AppointmentMode }) {
  const Icon = MODE_ICONS[mode]
  return (
    <Badge tone="info" icon={<Icon aria-hidden="true" className="size-3" />}>
      {mode === 'in-person' ? 'In person' : mode === 'video' ? 'Video' : 'Phone'}
    </Badge>
  )
}

export function AppointmentCard({
  appointment,
  canCancel,
  onEdit,
  onCancel,
  onDelete,
}: {
  appointment: Appointment
  canCancel: boolean
  onEdit: (appointment: Appointment) => void
  onCancel: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}) {
  const isScheduled = appointment.status === 'scheduled'

  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-semibold text-ink">{appointment.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {appointment.provider} · {appointment.specialty}
            </p>
          </div>
          <Badge tone={STATUS_TONES[appointment.status]}>{humanize(appointment.status)}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={appointment.mode} />
          <Badge tone="neutral">{formatDuration(appointment.durationMinutes)}</Badge>
        </div>

        <dl className="mt-1 space-y-1.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted">When</dt>
            <dd className="text-right text-ink-soft">
              {formatDateTime(appointment.date)}
              {isScheduled ? (
                <span className="block text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {formatRelativeDay(appointment.date)}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted">Where</dt>
            <dd className="max-w-[70%] text-right text-ink-soft">{appointment.location || '—'}</dd>
          </div>
          {appointment.notes ? (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
              {appointment.notes}
            </p>
          ) : null}
        </dl>
      </CardBody>

      <CardFooter className="gap-2">
        {canCancel && isScheduled ? (
          <Button variant="outline" size="sm" onClick={() => onCancel(appointment)} leftIcon={<CalendarX2 className="size-4" />}>
            Cancel visit
          </Button>
        ) : (
          <span className="text-xs text-muted">
            {appointment.status === 'cancelled' ? 'Cancelled — no action needed' : 'Completed visit'}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={`Edit ${appointment.title}`} onClick={() => onEdit(appointment)}>
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${appointment.title}`}
            onClick={() => onDelete(appointment)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}