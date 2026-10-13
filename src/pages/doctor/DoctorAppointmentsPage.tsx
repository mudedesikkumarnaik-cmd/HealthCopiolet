import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeading } from '@/components/common/PageHeading'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { currentDoctorFor } from '@/data/doctorsData'
import { formatDate, formatTime, isSameDay } from '@/utils/formatters'
import {
  acceptedRequestVisits,
  mergeDoctorVisits,
  type DoctorVisit,
} from '@/services/doctorScheduleService'

const MODE_TONES = { 'in-person': 'brand', video: 'info', phone: 'neutral' } as const

export function DoctorAppointmentsPage() {
  const { session } = useAuth()
  const { appointmentRequests } = useAppData()
  const patients = usePracticePatients()

  const directoryDoctor = currentDoctorFor(session?.email)
  const requestVisits = acceptedRequestVisits(appointmentRequests, directoryDoctor)

  const { today, upcoming, past } = useMemo(() => {
    const now = new Date()
    const rosterVisits: DoctorVisit[] = patients.flatMap((patient) =>
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
    const visits = mergeDoctorVisits(rosterVisits, requestVisits)
    const sorted = [...visits].sort(
      (a, b) => new Date(a.appointment.date).getTime() - new Date(b.appointment.date).getTime(),
    )
    const isToday = (date: Date) => isSameDay(date, now)
    return {
      // The three buckets are mutually exclusive and cover every visit: a
      // scheduled visit for today appears once (in Today), a scheduled visit in
      // the future appears once (in Upcoming), and every other visit — including
      // a scheduled visit whose date has passed — lands in Past.
      today: sorted.filter(
        (visit) => visit.appointment.status === 'scheduled' && isToday(new Date(visit.appointment.date)),
      ),
      upcoming: sorted.filter((visit) => {
        const date = new Date(visit.appointment.date)
        return visit.appointment.status === 'scheduled' && !isToday(date) && date > now
      }),
      past: sorted.filter((visit) => {
        const date = new Date(visit.appointment.date)
        return visit.appointment.status !== 'scheduled' || (!isToday(date) && date <= now)
      }),
    }
  }, [patients, requestVisits])

  const renderVisit = (visit: DoctorVisit) => (
    <span key={visit.appointment.id} className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar name={visit.patientName} color={visit.avatarColor} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{visit.patientName}</span>
        <span className="block truncate text-xs text-muted">{visit.appointment.title}</span>
      </span>
      <span className="hidden shrink-0 text-xs text-muted sm:block">
        {visit.appointment.location || visit.appointment.mode}
      </span>
      <Badge tone={MODE_TONES[visit.appointment.mode]}>{visit.appointment.mode}</Badge>
    </span>
  )

  const renderRow = (visit: DoctorVisit) => {
    const body = renderVisit(visit)
    return visit.fromRequest ? (
      <div key={visit.appointment.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5" title="Accepted appointment request">
        {body}
      </div>
    ) : (
      <Link
        key={visit.appointment.id}
        to={`/doctor/patients/${visit.patientId}`}
        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2"
      >
        {body}
      </Link>
    )
  }

  if (patients.length === 0) {
    return (
      <PageContainer>
        <PageHeading
          title="Appointments"
          eyebrow="Doctor portal"
          description="The full visit calendar for your practice."
        />
        <EmptyState
          className="mt-6"
          icon={<CalendarDays aria-hidden="true" className="size-6" />}
          title="No appointments yet"
          description="Once patients are part of your practice, their scheduled and past visits will be listed here."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeading
        title="Appointments"
        eyebrow="Doctor portal"
        description="The full visit calendar for your practice."
      />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader
            title="Today"
            description={formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
            action={<Badge tone="brand">{today.length} visits</Badge>}
          />
          <CardBody className="space-y-1">
            {today.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No visits scheduled for today.</p>
            ) : (
              today.map((visit) => (
                <div key={visit.appointment.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                  <span className="w-14 shrink-0 text-sm font-semibold text-ink">
                    {formatTime(visit.appointment.date)}
                  </span>
                  {renderRow(visit)}
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming" action={<Badge tone="neutral">{upcoming.length} visits</Badge>} />
          <CardBody>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Nothing upcoming.</p>
            ) : (
              <div className="grid gap-x-8 gap-y-1 lg:grid-cols-2">
                {upcoming.map((visit) => (
                  <div key={visit.appointment.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                    <span className="w-24 shrink-0 text-right text-xs text-muted">
                      <span className="block font-semibold text-ink">
                        {formatDate(visit.appointment.date, { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{formatTime(visit.appointment.date)}</span>
                    </span>
                    {renderRow(visit)}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Past visits" action={<Badge tone="neutral">{past.length} visits</Badge>} />
          <CardBody>
            {past.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No past visits on file.</p>
            ) : (
              <div className="grid gap-x-8 gap-y-1 lg:grid-cols-2">
                {past.map((visit) => (
                  <div key={visit.appointment.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                    <span className="w-24 shrink-0 text-right text-xs text-muted">
                      <span className="block font-semibold text-ink">
                        {formatDate(visit.appointment.date, { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{formatTime(visit.appointment.date)}</span>
                    </span>
                    <Avatar name={visit.patientName} color={visit.avatarColor} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{visit.patientName}</span>
                      <span className="block truncate text-xs text-muted">{visit.appointment.title}</span>
                    </span>
                    <Badge tone={visit.appointment.status === 'completed' ? 'success' : 'neutral'}>
                      {visit.appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}