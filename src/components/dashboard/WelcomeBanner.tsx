import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, Sparkles } from 'lucide-react'
import { useAppData } from '@/context/DataContext'
import { greetingForHour } from '@/utils/formatters'

export function WelcomeBanner() {
  const { profile, unreadCount, appointments } = useAppData()
  const firstName = profile.fullName.split(' ')[0] || 'friend'
  const greeting = greetingForHour(new Date().getHours())

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  const upcomingToday = appointments.filter((appointment) => {
    const date = new Date(appointment.date)
    const now = new Date()
    return (
      appointment.status === 'scheduled' &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  })

  return (
    <section className="card relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-500/10"
      />
      <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{today}</p>
          <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Here is a calm overview of your health data — trends, upcoming visits and the week
            ahead at a glance.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/assistant"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
            >
              <Sparkles aria-hidden="true" className="size-4" />
              Ask the AI assistant
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              to="/analytics"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              View health analytics
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <div className="flex min-w-36 items-center gap-3 rounded-xl border border-line bg-surface-2/70 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <CalendarDays aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">
                {upcomingToday.length === 0
                  ? 'None today'
                  : `${upcomingToday.length} today`}
              </span>
              <span className="block text-[0.7rem] text-muted">
                {upcomingToday.length === 0
                  ? 'appointments'
                  : upcomingToday.length === 1
                    ? upcomingToday[0].title
                    : `${upcomingToday.length} appointments`}
              </span>
            </span>
          </div>
          <div className="flex min-w-36 items-center gap-3 rounded-xl border border-line bg-surface-2/70 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <Bell aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">{unreadCount}</span>
              <span className="block text-[0.7rem] text-muted">unread alerts</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}