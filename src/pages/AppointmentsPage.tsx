import { useMemo, useState } from 'react'
import { CalendarClock, CalendarDays, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { SearchInput } from '@/components/common/PageHeading'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { filterAppointments, splitAppointments } from '@/services/appointmentsService'
import { requestsForPatient } from '@/services/appointmentRequestsService'
import type { Appointment, AppointmentMode, AppointmentStatus } from '@/types/health'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentRequestCard } from '@/components/appointments/AppointmentRequestCard'
import { RequestAppointmentForm } from '@/components/appointments/RequestAppointmentForm'

type Tab = 'upcoming' | 'history' | 'requests'
type StatusFilter = AppointmentStatus | 'all'
type ModeFilter = AppointmentMode | 'all'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const MODE_OPTIONS: Array<{ value: ModeFilter; label: string }> = [
  { value: 'all', label: 'Any mode' },
  { value: 'in-person', label: 'In person' },
  { value: 'video', label: 'Video' },
  { value: 'phone', label: 'Phone' },
]

export function AppointmentsPage() {
  const { appointments, appointmentRequests, cancelAppointment, removeAppointment, profile } =
    useAppData()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mode, setMode] = useState<ModeFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [deleting, setDeleting] = useState<Appointment | null>(null)

  const { upcoming, past } = useMemo(() => splitAppointments(appointments), [appointments])

  const myRequests = useMemo(
    () => requestsForPatient(appointmentRequests, profile.id),
    [appointmentRequests, profile.id],
  )
  const pendingRequests = myRequests.filter((request) => request.status === 'pending').length

  const base = tab === 'upcoming' ? upcoming : past
  const filtered = useMemo(
    () => filterAppointments(base, { search: query, status, mode }),
    [base, query, status, mode],
  )

  const confirmCancel = () => {
    if (!cancelling) return
    cancelAppointment(cancelling.id)
    toast.info('Appointment cancelled', `${cancelling.title} was moved to your history.`)
    setCancelling(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    removeAppointment(deleting.id)
    toast.success('Appointment removed', `${deleting.title} was deleted from your calendar.`)
    setDeleting(null)
  }

  return (
    <PageContainer>
      <PageHeading
        title="Appointments"
        eyebrow="Calendar"
        description="Upcoming visits and your appointment history. Nothing here is booked with a real clinic."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              leftIcon={<CalendarPlus className="size-4" />}
            >
              Add to calendar
            </Button>
            <Button
              onClick={() => setRequestOpen(true)}
              leftIcon={<CalendarClock className="size-4" />}
            >
              Request appointment
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader
          icon={tab === 'requests' ? <CalendarClock className="size-4" /> : <CalendarDays className="size-4" />}
          title={
            tab === 'upcoming'
              ? `${upcoming.length} upcoming`
              : tab === 'history'
                ? `${past.length} past visits`
                : `${myRequests.length} requests`
          }
          description={
            tab === 'upcoming'
              ? 'Scheduled visits in your calendar.'
              : tab === 'history'
                ? 'Completed and cancelled visits.'
                : 'Applications you sent to doctors, and their responses.'
          }
          action={
            <SegmentedControl
              ariaLabel="Appointment list"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'history', label: 'History' },
                {
                  value: 'requests',
                  label: pendingRequests > 0 ? `Requests (${pendingRequests})` : 'Requests',
                },
              ]}
            />
          }
        />
        <CardBody className="space-y-4">
          {tab === 'requests' ? (
            myRequests.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="size-5" />}
                title="No appointment requests yet"
                description="Apply to one or more doctors and their decisions will appear here."
                action={
                  <Button
                    size="sm"
                    onClick={() => setRequestOpen(true)}
                    leftIcon={<CalendarClock className="size-4" />}
                  >
                    Request appointment
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {myRequests.map((request) => (
                  <AppointmentRequestCard key={request.id} request={request} perspective="patient" />
                ))}
              </div>
            )
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <SearchInput
                  id="appointments-search"
                  label="Search appointments"
                  placeholder="Search title, provider, specialty…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as StatusFilter)}
                  className="hc-input md:w-44"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as ModeFilter)}
                  className="hc-input md:w-40"
                >
                  {MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="size-5" />}
                  title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
                  description={
                    tab === 'upcoming'
                      ? 'Add a visit to your calendar to see it here.'
                      : 'Completed and cancelled visits will appear here.'
                  }
                  action={
                    tab === 'upcoming' ? (
                      <Button size="sm" onClick={() => setFormOpen(true)} leftIcon={<CalendarPlus className="size-4" />}>
                        Add to calendar
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      canCancel={tab === 'upcoming'}
                      onEdit={(item) => {
                        setEditing(item)
                        setFormOpen(true)
                      }}
                      onCancel={setCancelling}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <AppointmentForm open={formOpen} onClose={() => setFormOpen(false)} appointment={editing} />
      <RequestAppointmentForm open={requestOpen} onClose={() => setRequestOpen(false)} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        onCancel={() => setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancel this visit?"
        description={
          <>
            “{cancelling?.title}” with {cancelling?.provider} will be marked as cancelled and moved to
            your history.
          </>
        }
        confirmLabel="Cancel visit"
        tone="primary"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this appointment?"
        description={
          <>
            “{deleting?.title}” will be permanently removed from your calendar.
          </>
        }
        confirmLabel="Delete appointment"
      />
    </PageContainer>
  )
}