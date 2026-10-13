import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CalendarDays, CheckCircle2, ClipboardList, FileUp, FolderOpen, Pill, Users, XCircle } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { currentDoctorFor } from '@/data/doctorsData'
import { appointmentRequestCounts, practiceRequestsFor } from '@/services/appointmentRequestsService'
import {
  acceptedRequestVisits,
  mergeDoctorVisits,
  type DoctorVisit,
} from '@/services/doctorScheduleService'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { formatDate, formatRelativeTime, formatTime, humanize, isSameDay } from '@/utils/formatters'

const MODE_TONES = { 'in-person': 'brand', video: 'info', phone: 'neutral' } as const

/**
 * A schedule row that links to the practice patient when the visit belongs to
 * a roster patient. Rows created from an accepted appointment request render
 * as plain rows — the requester is not part of the static roster.
 */
function Row({
  to,
  fromRequest,
  className,
  children,
}: {
  to: string
  fromRequest: boolean
  className: string
  children: ReactNode
}) {
  if (fromRequest) {
    return (
      <div className={className} title="Accepted appointment request">
        {children}
      </div>
    )
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

export function DoctorOverviewPage() {
  const { session } = useAuth()
  const patients = usePracticePatients()
  const { appointmentRequests, patientRecordShares } = useAppData()

  const today = useMemo(() => new Date(), [])

  const directoryDoctor = currentDoctorFor(session?.email)
  const requestCounts = useMemo(
    () => appointmentRequestCounts(practiceRequestsFor(appointmentRequests, directoryDoctor)),
    [appointmentRequests, directoryDoctor],
  )

  const requestVisits = useMemo(
    () => acceptedRequestVisits(appointmentRequests, directoryDoctor),
    [appointmentRequests, directoryDoctor],
  )

  /** Every calendar row — sample roster patients plus accepted requests. */
  const schedule = useMemo(() => {
    const roster: DoctorVisit[] = patients.flatMap((patient) =>
      patient.appointments.map((appointment) => ({
        patientId: patient.id,
        patientName: patient.fullName,
        avatarColor: patient.avatarColor,
        appointment: {
          id: appointment.id,
          title: appointment.title,
          date: appointment.date,
          mode: appointment.mode,
          status: appointment.status,
          location: appointment.location,
        },
        fromRequest: false,
      })),
    )
    return mergeDoctorVisits(roster, requestVisits)
  }, [patients, requestVisits])

  const todayAppointments = useMemo(
    () =>
      schedule.filter(
        (visit) =>
          visit.appointment.status === 'scheduled' && isSameDay(new Date(visit.appointment.date), today),
      ),
    [schedule, today],
  )

  const upcoming = useMemo(
    () =>
      schedule
        .filter(
          (visit) => visit.appointment.status === 'scheduled' && new Date(visit.appointment.date) >= today,
        )
        .sort((a, b) => new Date(a.appointment.date).getTime() - new Date(b.appointment.date).getTime())
        .slice(0, 5),
    [schedule, today],
  )

  const completed = useMemo(
    () => schedule.filter((visit) => visit.appointment.status === 'completed').length,
    [schedule],
  )

  const scheduledCount = useMemo(
    () => schedule.filter((visit) => visit.appointment.status === 'scheduled').length,
    [schedule],
  )

  const allRecords = useMemo(() => patients.flatMap((patient) => patient.records), [patients])

  const allMedications = useMemo(
    () => patients.flatMap((patient) => patient.medications),
    [patients],
  )

  const conditionList = useMemo(() => {
    const unique = new Set<string>()
    patients.forEach((patient) => patient.conditions.forEach((condition) => unique.add(condition)))
    return [...unique]
  }, [patients])

  const recentRecords = useMemo(
    () =>
      patients
        .flatMap((patient) => patient.records.map((record) => ({ patient, record })))
        .sort((a, b) => new Date(b.record.createdAt).getTime() - new Date(a.record.createdAt).getTime())
        .slice(0, 5),
    [patients],
  )

  // Reports patients have uploaded from their own accounts, newest first.
  const sharedReports = useMemo(
    () =>
      [...patientRecordShares].sort(
        (a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime(),
      ),
    [patientRecordShares],
  )
  const newSharedReports = useMemo(
    () => sharedReports.filter((share) => !share.reviewedAt),
    [sharedReports],
  )

  const firstName = session?.fullName.split(' ')[0] ?? 'doctor'
  // Names that already begin with "Dr." (or "Doctor") are used as-is so the
  // greeting never reads "Dr. Dr. …". Everything else gets the title added.
  const greetingName = /^(dr|doctor)\.?\s/i.test(session?.fullName ?? '')
    ? session!.fullName.trim()
    : `Dr. ${firstName}`

  const stats = [
    { label: 'Patients treated', value: patients.length, icon: Users },
    { label: 'Check-ups completed', value: completed, icon: CheckCircle2 },
    { label: "Today's appointments", value: todayAppointments.length, icon: CalendarDays },
    { label: 'Pending requests', value: requestCounts.pending, icon: ClipboardList },
  ]

  return (
    <PageContainer>
      <PageHeading
        title="Practice Overview"
        eyebrow="Doctor portal"
        description={`Welcome back, ${greetingName}. Here is what is happening in your practice.`}
      />

      {patients.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Users aria-hidden="true" className="size-6" />}
          title="Your practice is ready for its first patient"
          description="This account starts fresh. When patients are added, their records, medicines and appointments will appear here — every doctor sees only their own practice."
        />
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="flex items-center gap-3 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <stat.icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-xl font-bold text-ink">{stat.value}</span>
                  <span className="block text-xs text-muted">{stat.label}</span>
                </span>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader
              title="Your practice at a glance"
              description="What your practice has handled so far, drawn from the sample data in this app"
              icon={<Activity aria-hidden="true" className="size-4" />}
              action={<Badge tone="brand">{patients.length} patients</Badge>}
            />
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: 'Patients you treat', value: patients.length, icon: Users },
                  { label: 'Check-ups completed', value: completed, icon: CheckCircle2 },
                  { label: 'Upcoming visits', value: scheduledCount, icon: CalendarDays },
                  { label: 'Prescriptions on file', value: allMedications.length, icon: Pill },
                  { label: 'Reports reviewed', value: allRecords.length, icon: FolderOpen },
                  { label: 'Requests accepted', value: requestCounts.accepted, icon: CheckCircle2 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-line px-3 py-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <item.icon aria-hidden="true" className="size-4" />
                    </span>
                    <span>
                      <span className="block text-lg font-bold text-ink">{item.value}</span>
                      <span className="block text-xs text-muted">{item.label}</span>
                    </span>
                  </div>
                ))}
              </div>

              {conditionList.length > 0 ? (
                <div className="border-t border-line pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Conditions you manage ({conditionList.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {conditionList.map((condition) => (
                      <Badge key={condition} tone="neutral">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Appointment requests"
              description="Applications patients have sent to you"
              icon={<ClipboardList aria-hidden="true" className="size-4" />}
              action={
                <Link
                  to="/doctor/requests"
                  className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  Review requests
                </Link>
              }
            />
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pending', value: requestCounts.pending, icon: ClipboardList, tone: 'warning' },
                  { label: 'Accepted', value: requestCounts.accepted, icon: CheckCircle2, tone: 'success' },
                  { label: 'Cancelled', value: requestCounts.cancelled, icon: XCircle, tone: 'neutral' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1 rounded-xl border border-line px-3 py-3 text-center"
                  >
                    <span
                      className={
                        item.tone === 'warning'
                          ? 'grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          : item.tone === 'success'
                            ? 'grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'grid size-9 place-items-center rounded-lg bg-surface-2 text-muted'
                      }
                    >
                      <item.icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="text-lg font-bold text-ink">{item.value}</span>
                    <span className="text-xs text-muted">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Patient reports"
              description="Medical records patients have shared from their own accounts"
              icon={<FileUp aria-hidden="true" className="size-4" />}
              action={
                <Link
                  to="/doctor/reports"
                  className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  Review reports
                </Link>
              }
            />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={newSharedReports.length > 0 ? 'warning' : 'success'}>
                  {newSharedReports.length} awaiting review
                </Badge>
                <span className="text-xs text-muted">
                  {sharedReports.length} shared in total
                </span>
              </div>
              {newSharedReports.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing new to review. When a patient uploads a report it appears here and in the
                  patient&apos;s file.
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {newSharedReports.slice(0, 4).map((share) => (
                    <Link
                      key={share.id}
                      to="/doctor/reports"
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <Avatar name={share.patientName} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {share.record.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {share.patientName} · shared {formatRelativeTime(share.sharedAt)}
                        </span>
                      </span>
                      <Badge tone="warning">New</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Today's schedule"
                description={formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}
                action={<Badge tone="brand">{todayAppointments.length} visits</Badge>}
              />
              <CardBody className="space-y-1">
                {todayAppointments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No appointments scheduled today.</p>
                ) : (
                  todayAppointments.map((visit) => (
                    <Row
                      key={visit.appointment.id}
                      to={`/doctor/patients/${visit.patientId}`}
                      fromRequest={visit.fromRequest}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                    >
                      <span className="w-14 shrink-0 text-sm font-semibold text-ink">
                        {formatTime(visit.appointment.date)}
                      </span>
                      <Avatar name={visit.patientName} color={visit.avatarColor} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {visit.patientName}
                        </span>
                        <span className="block truncate text-xs text-muted">{visit.appointment.title}</span>
                      </span>
                      <Badge tone={MODE_TONES[visit.appointment.mode]}>{visit.appointment.mode}</Badge>
                    </Row>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Upcoming visits"
                description="The next few scheduled appointments"
                action={
                  <Link
                    to="/doctor/appointments"
                    className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  >
                    View schedule
                  </Link>
                }
              />
              <CardBody className="space-y-1">
                {upcoming.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">Nothing scheduled yet.</p>
                ) : (
                  upcoming.map((visit) => (
                    <Row
                      key={visit.appointment.id}
                      to={`/doctor/patients/${visit.patientId}`}
                      fromRequest={visit.fromRequest}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                    >
                      <Avatar name={visit.patientName} color={visit.avatarColor} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {visit.patientName}
                        </span>
                        <span className="block truncate text-xs text-muted">{visit.appointment.title}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-muted">
                        <span className="block font-semibold text-ink">
                          {formatDate(visit.appointment.date, { month: 'short', day: 'numeric' })}
                        </span>
                        <span>{formatTime(visit.appointment.date)}</span>
                      </span>
                    </Row>
                  ))
                )}
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Recent records"
                description="The latest documents added to the practice"
                icon={<FolderOpen aria-hidden="true" className="size-4" />}
              />
              <CardBody className="divide-y divide-line">
                {recentRecords.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No records yet.</p>
                ) : (
                  recentRecords.map(({ patient, record }) => (
                    <Link
                      key={record.id}
                      to={`/doctor/patients/${patient.id}`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <Avatar name={patient.fullName} color={patient.avatarColor} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{record.title}</span>
                        <span className="block truncate text-xs text-muted">
                          {patient.fullName} · {formatDate(record.date)}
                        </span>
                      </span>
                      <Badge tone="neutral">{humanize(record.category)}</Badge>
                    </Link>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}