import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Inbox,
  X,
  XCircle,
} from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import {
  AppointmentRequestCard,
  RequestStatusBadge,
} from '@/components/appointments/AppointmentRequestCard'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { currentDoctorFor } from '@/data/doctorsData'
import { appointmentRequestCounts, practiceRequestsFor } from '@/services/appointmentRequestsService'
import type { AppointmentRequest, AppointmentRequestStatus } from '@/types/practice'
import { formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

type RequestFilter = Extract<AppointmentRequestStatus, 'pending' | 'accepted' | 'cancelled'>

const FILTER_META: Record<
  RequestFilter,
  { title: string; description: string; emptyTitle: string; emptyDescription: string }
> = {
  pending: {
    title: 'Pending requests',
    description: 'Accept to confirm the visit, or cancel to decline it.',
    emptyTitle: 'No pending requests',
    emptyDescription:
      'New applications from patients will appear here for you to accept or cancel.',
  },
  accepted: {
    title: 'Accepted requests',
    description:
      'Requests you accepted — the patient was notified and the visit was added to their calendar.',
    emptyTitle: 'No accepted requests',
    emptyDescription:
      'Accept a pending request and it will move here as a confirmed visit.',
  },
  cancelled: {
    title: 'Cancelled requests',
    description: 'Requests you declined — the patient was notified of the decision.',
    emptyTitle: 'No cancelled requests',
    emptyDescription: 'Requests you cancel with a note will appear here.',
  },
}

export function DoctorRequestsPage() {
  const { session } = useAuth()
  const { appointmentRequests, decideAppointmentRequest } = useAppData()
  const toast = useToast()

  const [accepting, setAccepting] = useState<AppointmentRequest | null>(null)
  const [cancelling, setCancelling] = useState<AppointmentRequest | null>(null)
  const [filter, setFilter] = useState<RequestFilter>('pending')

  const doctor = currentDoctorFor(session?.email)

  // The shared request pool IS the practice inbox for a directory clinician, so
  // requests patients send always show up here — including ones aimed at other
  // directory doctors (each card says who applied to whom).
  const requests = useMemo(
    () => practiceRequestsFor(appointmentRequests, doctor),
    [appointmentRequests, doctor],
  )
  const counts = useMemo(() => appointmentRequestCounts(requests), [requests])

  const filtered = useMemo(() => {
    if (filter === 'pending') {
      return requests
        .filter((request) => request.status === 'pending')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
    return requests
      .filter((request) => request.status === filter)
      .sort(
        (a, b) =>
          new Date(b.decidedAt ?? b.createdAt).getTime() -
          new Date(a.decidedAt ?? a.createdAt).getTime(),
      )
  }, [requests, filter])

  const stats = [
    { key: 'pending' as const, label: 'Pending', value: counts.pending, tone: 'warning' as const, icon: ClipboardList },
    { key: 'accepted' as const, label: 'Accepted', value: counts.accepted, tone: 'success' as const, icon: CheckCircle2 },
    { key: 'cancelled' as const, label: 'Cancelled', value: counts.cancelled, tone: 'neutral' as const, icon: XCircle },
  ]

  const statIconClasses: Record<RequestFilter, string> = {
    pending: 'grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    accepted:
      'grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    cancelled: 'grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted',
  }

  const statActiveClasses: Record<RequestFilter, string> = {
    pending: 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10',
    accepted:
      'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10',
    cancelled: 'border-line-strong bg-surface-2/70 dark:bg-surface-2',
  }

  const confirmAccept = () => {
    if (!accepting) return
    decideAppointmentRequest(accepting.id, 'accepted')
    toast.success('Request accepted', `${accepting.patientName} will see the confirmed visit.`)
    setAccepting(null)
  }

  const confirmCancel = () => {
    if (!cancelling) return
    decideAppointmentRequest(cancelling.id, 'cancelled')
    toast.info('Request cancelled', `${cancelling.patientName} will be notified.`)
    setCancelling(null)
  }

  const meta = FILTER_META[filter]

  return (
    <PageContainer>
      <PageHeading
        title="Appointment requests"
        eyebrow="Doctor portal"
        description="Patients who have applied for a visit with you. Click a status to see who is in it — accept a request to add it to their calendar, or cancel and let them know."
      />

      {!doctor ? (
        <EmptyState
          className="mt-6"
          icon={<ClipboardList aria-hidden="true" className="size-6" />}
          title="No appointment requests yet"
          description="Patients apply to doctors listed in the practice directory. This account isn't listed there yet, so there are no applications to review — new doctors start fresh."
        />
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => {
              const active = filter === stat.key
              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => setFilter(stat.key)}
                  aria-pressed={active}
                  title={`Show ${stat.label.toLowerCase()} requests`}
                  className={cn(
                    'card flex items-center gap-3 p-4 text-left transition-colors',
                    active && statActiveClasses[stat.key],
                  )}
                >
                  <span className={statIconClasses[stat.key]}>
                    <stat.icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-bold leading-tight text-ink">{stat.value}</span>
                    <span className="block truncate text-xs text-muted">{stat.label} requests</span>
                  </span>
                  {active ? (
                    <span className="grid size-2 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <Card>
            <CardHeader
              title={meta.title}
              description={meta.description}
              icon={<ClipboardList aria-hidden="true" className="size-4" />}
              action={
                <Badge tone={filter === 'pending' ? 'warning' : filter === 'accepted' ? 'success' : 'neutral'}>
                  {filtered.length} {filter}
                </Badge>
              }
            />
            <CardBody>
              {filtered.length === 0 ? (
                <EmptyState
                  className="border-none"
                  icon={<Inbox aria-hidden="true" className="size-5" />}
                  title={meta.emptyTitle}
                  description={meta.emptyDescription}
                />
              ) : filter === 'pending' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filtered.map((request) => (
                    <AppointmentRequestCard
                      key={request.id}
                      request={request}
                      perspective="doctor"
                      actions={
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setCancelling(request)}
                            leftIcon={<X className="size-4" />}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setAccepting(request)}
                            leftIcon={<Check className="size-4" />}
                          >
                            Accept
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filtered.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 py-3">
                      <Avatar name={request.patientName} color="#64748b" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{request.patientName}</p>
                        <p className="truncate text-xs text-muted">
                          {request.title} · applied to {request.doctorName} · {formatDateTime(request.date)}
                        </p>
                        {request.decisionNote ? (
                          <p className="mt-0.5 truncate text-xs text-muted">{request.decisionNote}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <RequestStatusBadge status={request.status} />
                        <span className="text-xs text-muted">
                          Decided {formatDateTime(request.decidedAt ?? request.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(accepting)}
        onCancel={() => setAccepting(null)}
        onConfirm={confirmAccept}
        title="Accept this request?"
        description={
          <>
            “{accepting?.title}” for {accepting?.patientName} on{' '}
            {formatDateTime(accepting?.date)} will be added to their calendar and they will be
            notified.
          </>
        }
        confirmLabel="Accept request"
        tone="primary"
      />

      <ConfirmDialog
        open={Boolean(cancelling)}
        onCancel={() => setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancel this request?"
        description={
          <>
            “{cancelling?.title}” for {cancelling?.patientName} will be declined and they will be
            notified. This cannot be undone.
          </>
        }
        confirmLabel="Cancel request"
      />
    </PageContainer>
  )
}