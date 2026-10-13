import { Link } from 'react-router-dom'
import { LifeBuoy, LogOut, Settings, UserRound } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { cn } from '@/utils/cn'

const LINKS = [
  { to: '/profile', label: 'Profile', icon: UserRound, description: 'Your details and preferences' },
  { to: '/settings', label: 'Settings', icon: Settings, description: 'Appearance, privacy and AI' },
  { to: '/help', label: 'Help & Support', icon: LifeBuoy, description: 'FAQs and about the app' },
] as const

export function UserMenu({ onNavigate }: { onNavigate: () => void }) {
  const { logout, session } = useAuth()
  const { profile } = useAppData()
  const roleLabel = session?.role === 'doctor' ? 'Doctor' : 'Patient'

  return (
    <div className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <Avatar name={profile.fullName} color={profile.avatarColor} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{profile.fullName}</p>
          <p className="truncate text-xs text-muted">{profile.email}</p>
          <Badge tone="brand" className="mt-1">
            {roleLabel}
          </Badge>
        </div>
      </div>

      <nav aria-label="Account menu" className="p-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={cn(
              'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
            )}
          >
            <link.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{link.label}</span>
              <span className="block text-xs text-muted">{link.description}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={() => {
            onNavigate()
            logout()
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
