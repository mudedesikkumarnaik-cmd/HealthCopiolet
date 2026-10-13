import type { ReactNode } from 'react'
import { CalendarClock, MapPin, Phone, Video } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import type { BadgeTone } from '@/components/common/Badge'
import { Card, CardBody } from '@/components/common/Card'
import type { AppointmentMode } from '@/types/health'
import type { AppointmentRequest, AppointmentRequestStatus } from '@/types/practice'
import { formatDateTime, formatDuration, formatRelativeDay, formatRelativeTime } from '@/utils/formatters'

const MODE_ICONS: Record<AppointmentMode, typeof MapPin> = {
  'in-person': MapPin,
  video: Video,
  phone: Phone,
}

const MODE_LABELS: Record<AppointmentMode, string> = {
  'in-person': 'In person',
  video: 'Video',
  phone: 'Phone',
}

export const REQUEST_STATUS_TONES: Record<AppointmentRequestStatus, BadgeTone> = {
  pending: 'warning',
  accepted: 'success',
  cancelled: 'neutral',
}

const STATUS_LABELS: Record<AppointmentRequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
}

export function RequestStatusBadge({ status }: { status: AppointmentRequestStatus }) {
  return <Badge tone={REQUEST_STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
}

function ModeBadge({ mode }: { mode: AppointmentMode }) {
  const Icon = MODE_ICONS[mode]
  return (
    <Badge tone="info" icon={<Icon aria-hidden="true" className="size-3" />}>
      {MODE_LABELS[mode]}
    </Badge>
  )
}

export function AppointmentRequestCard({
  request,
  perspective,
  actions,
}: {
  request: AppointmentRequest
  /** Whether the viewer is the patient who applied or the doctor who decides. */
  perspective: 'patient' | 'doctor'
  /** Optional action buttons rendered in the footer. */
  actions?: ReactNode
}) {
  const counterparty = perspective === 'patient' ? request.doctorName : request.patientName
  const counterpartyDetail = perspective === 'patient' ? request.specialty : request.patientEmail

  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] font-semibold text-ink">{request.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {counterparty}
              {counterpartyDetail ? ` · ${counterpartyDetail}` : ''}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={request.mode} />
          <Badge tone="neutral">{formatDuration(request.durationMinutes)}</Badge>
        </div>

        <dl className="mt-1 space-y-1.5 text-sm">
          {perspective === 'doctor' ? (
            <div className="flex items-start justify-between gap-2">
              <dt className="text-muted">Applied to</dt>
              <dd className="max-w-[70%] text-right text-ink-soft">
                {request.doctorName}
                <span className="block text-xs text-muted">{request.specialty}</span>
              </dd>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted">Requested for</dt>
            <dd className="text-right text-ink-soft">
              {formatDateTime(request.date)}
              <span className="block text-xs font-semibold text-brand-700 dark:text-brand-300">
                {formatRelativeDay(request.date)}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted">Where</dt>
            <dd className="max-w-[70%] text-right text-ink-soft">{request.location || '—'}</dd>
          </div>
          {request.notes ? (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed text-muted">
              {request.notes}
            </p>
          ) : null}
        </dl>

        <p className="mt-auto flex items-center gap-1.5 pt-1 text-[0.7rem] text-muted">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          {request.status === 'pending'
            ? `Applied ${formatRelativeTime(request.createdAt)}`
            : `Decided ${formatRelativeTime(request.decidedAt ?? request.createdAt)}`}
        </p>

        {request.decisionNote ? (
          <p className="rounded-lg border border-line px-3 py-2 text-xs leading-relaxed text-ink-soft">
            <span className="font-semibold">Note from the doctor: </span>
            {request.decisionNote}
          </p>
        ) : null}
      </CardBody>

      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
          {actions}
        </div>
      ) : null}
    </Card>
  )
}
