import { NavLink } from 'react-router-dom'
import { LogOut, Sparkles, Stethoscope, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BRAND_ICON, DOCTOR_NAV, PRIMARY_NAV, SECONDARY_NAV } from './navItems'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { useI18n } from '@/context/I18nContext'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { currentDoctorFor } from '@/data/doctorsData'
import { formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

function navRowClasses(isActive: boolean): string {
  return cn(
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
  )
}

function NavRow({
  to,
  icon: Icon,
  label,
  onNavigate,
  end,
}: {
  to: string
  icon: LucideIcon
  label: string
  onNavigate?: () => void
  end?: boolean
}) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => navRowClasses(isActive)}>
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className={cn(
              'size-[1.15rem] shrink-0',
              isActive ? 'text-brand-600 dark:text-brand-300' : 'text-muted',
            )}
          />
          <span className="truncate">{label}</span>
          {isActive ? (
            <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export interface SidebarProps {
  onNavigate?: () => void
  onClose?: () => void
  /** Shows a close button — used by the mobile drawer. */
  prominentClose?: boolean
}

export function Sidebar({ onNavigate, onClose, prominentClose = false }: SidebarProps) {
  const { logout, session } = useAuth()
  const { unreadCount, appointments, appointmentRequests } = useAppData()
  const { t } = useI18n()
  const practice = usePracticePatients()

  const role = session?.role ?? 'patient'
  const isDoctor = role === 'doctor'
  const homePath = isDoctor ? '/doctor' : '/'

  const upcoming =
    appointments.filter((appointment) => appointment.status === 'scheduled').length

  const directoryDoctor = currentDoctorFor(session?.email)
  const pendingRequests = appointmentRequests.filter(
    (request) => request.doctorId === directoryDoctor?.id && request.status === 'pending',
  ).length

  const stats = isDoctor
    ? [
        { label: 'Patients', value: practice.length },
        { label: 'Pending', value: pendingRequests },
      ]
    : [
        { label: 'Unread', value: unreadCount },
        { label: 'Visits', value: upcoming },
      ]

  return (
    <div className="flex h-full flex-col gap-4 bg-surface/80 px-3.5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 px-1.5">
        <NavLink
          to={homePath}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white shadow-card">
            <BRAND_ICON aria-hidden="true" className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-ink">Health Copilot</span>
            <span className="block text-[0.68rem] font-medium uppercase tracking-wide text-muted">
              {t(isDoctor ? 'Practice portal' : 'Personal health')}
            </span>
          </span>
        </NavLink>
        {prominentClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close navigation')}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3 dark:border-brand-500/25 dark:bg-brand-500/10">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800 dark:text-brand-200">
          {isDoctor ? (
            <Stethoscope aria-hidden="true" className="size-3.5" />
          ) : (
            <Sparkles aria-hidden="true" className="size-3.5" />
          )}
          {t(isDoctor ? 'Your practice' : 'Your health space')}
        </p>
        <p className="mt-1 text-[0.7rem] leading-snug text-brand-800/80 dark:text-brand-200/80">
          {isDoctor
            ? t('Patients, records and visits for your practice — private to your account.')
            : t('Your records, medicines and routines stay private to your account.')}
        </p>
      </div>

      <nav aria-label={t('Main navigation')} className="hc-scroll flex-1 space-y-1 overflow-y-auto">
        {(isDoctor ? DOCTOR_NAV : PRIMARY_NAV).map((item) => (
          <NavRow
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={t(item.label)}
            onNavigate={onNavigate}
            end={item.path === homePath}
          />
        ))}

        <div className="px-3 pb-1 pt-4 text-[0.68rem] font-semibold uppercase tracking-wide text-muted">
          {t('Account')}
        </div>
        {SECONDARY_NAV.map((item) => (
          <NavRow
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={t(item.label)}
            onNavigate={onNavigate}
          />
        ))}

        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            logout()
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        >
          <LogOut aria-hidden="true" className="size-[1.15rem] shrink-0 text-muted" />
          {t('Logout')}
        </button>
      </nav>

      <div className="rounded-xl border border-line bg-surface-2 p-3">
        <dl className="grid grid-cols-2 gap-2 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[0.68rem] font-medium uppercase tracking-wide text-muted">{t(stat.label)}</dt>
              <dd className="text-sm font-bold text-ink">{formatNumber(stat.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}