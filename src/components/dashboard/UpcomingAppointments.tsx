import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Video } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppData } from '@/context/DataContext'
import { splitAppointments } from '@/services/appointmentsService'
import { formatDateTime, formatRelativeDay, formatTime } from '@/utils/formatters'

const MODE_LABEL = { 'in-person': 'In person', video: 'Video', phone: 'Phone' } as const

export function UpcomingAppointments() {
  const { appointments } = useAppData()
  const { upcoming } = splitAppointments(appointments)
  const nextThree = upcoming.slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader
        title="Upcoming appointments"
        description="Next visits in your calendar"
        icon={<CalendarDays aria-hidden="true" className="size-4" />}
        action={
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            View all <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        }
      />
      <CardBody>
        {nextThree.length === 0 ? (
          <EmptyState
            icon={<CalendarDays aria-hidden="true" className="size-5" />}
            title="No upcoming appointments"
            description="Schedule one on the Appointments page."
            action={
              <Link
                to="/appointments"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950"
              >
                Add appointment
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {nextThree.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  to="/appointments"
                  className="group flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3 transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-center leading-tight dark:bg-brand-500/15">
                    <span>
                      <span className="block text-[0.65rem] font-bold uppercase text-brand-700 dark:text-brand-300">
                        {formatRelativeDay(appointment.date) === 'Today' || formatRelativeDay(appointment.date) === 'Tomorrow' ? formatRelativeDay(appointment.date) : new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(appointment.date))}
                      </span>
                      <span className="block text-base font-bold text-ink">
                        {new Date(appointment.date).getDate()}
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{appointment.title}</span>
                      <Badge tone="brand" className="hidden sm:inline-flex">
                        {formatRelativeDay(appointment.date)}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {appointment.provider} · {appointment.specialty}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {formatDateTime(appointment.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {appointment.mode === 'video' ? <Video aria-hidden="true" className="size-3.5" /> : <MapPin aria-hidden="true" className="size-3.5" />}
                        {appointment.mode === 'video' ? MODE_LABEL.video : appointment.mode === 'phone' ? MODE_LABEL.phone : formatTime(appointment.date)}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}