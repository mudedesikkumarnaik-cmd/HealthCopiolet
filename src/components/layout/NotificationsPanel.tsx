import { Link } from 'react-router-dom'
import { BellOff, CalendarDays, Info, Pill, CheckCheck, Trash2 } from 'lucide-react'
import type { AppNotification, NotificationKind } from '@/types/health'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppData } from '@/context/DataContext'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const KIND_META: Record<NotificationKind, { icon: typeof Info; tone: 'brand' | 'success' | 'warning' | 'info' }> = {
  appointment: { icon: CalendarDays, tone: 'brand' },
  medication: { icon: Pill, tone: 'success' },
  wellness: { icon: Info, tone: 'warning' },
  system: { icon: Info, tone: 'info' },
}

function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: AppNotification
  onRead: (id: string) => void
  onNavigate: () => void
}) {
  const meta = KIND_META[notification.kind]
  const Icon = meta.icon
  const body = (
    <>
      <span
        className={cn(
          'mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg',
          notification.read
            ? 'bg-surface-2 text-muted'
            : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('text-sm', notification.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink')}>
            {notification.title}
          </span>
          {!notification.read ? (
            <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted">{notification.message}</span>
        <span className="mt-1 block text-[0.7rem] text-muted">{formatRelativeTime(notification.createdAt)}</span>
      </span>
    </>
  )

  const className = cn(
    'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2',
    !notification.read && 'bg-brand-50/50 dark:bg-brand-500/5',
  )

  if (notification.link) {
    return (
      <Link to={notification.link} onClick={() => { onRead(notification.id); onNavigate() }} className={className}>
        {body}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => onRead(notification.id)} className={className}>
      {body}
    </button>
  )
}

export function NotificationsPanel({ onNavigate }: { onNavigate: () => void }) {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } =
    useAppData()

  return (
    <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-ink">Notifications</h2>
          {unreadCount > 0 ? <Badge tone="brand">{unreadCount} new</Badge> : null}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <CheckCheck aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={clearNotifications}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              aria-label="Clear all notifications"
              title="Clear all"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="hc-scroll max-h-[22rem] overflow-y-auto p-2">
        {notifications.length === 0 ? (
          <EmptyState
            className="border-none py-8"
            icon={<BellOff aria-hidden="true" className="size-5" />}
            title="No notifications"
            description="Sample reminders about appointments, medicines and wellness goals appear here."
          />
        ) : (
          <ul className="space-y-1">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationRow
                  notification={notification}
                  onRead={markNotificationRead}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-4 py-2.5">
        <p className="text-[0.7rem] text-muted">
          In-app notifications only — no email, SMS or push messages are sent.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 px-0 text-brand-700 hover:bg-transparent dark:text-brand-300"
          onClick={onNavigate}
        >
          Manage in Settings
        </Button>
      </div>
    </div>
  )
}
