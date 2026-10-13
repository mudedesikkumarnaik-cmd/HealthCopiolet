import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useAppData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useTheme } from '@/hooks/useTheme'
import { useDismissable } from '@/hooks/useDismissable'
import { findNavItem } from './navItems'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsPanel } from './NotificationsPanel'
import { UserMenu } from './UserMenu'
import { cn } from '@/utils/cn'

export function Header({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const location = useLocation()
  const { profile, unreadCount } = useAppData()
  const { session } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { t } = useI18n()

  const [searchOpen, setSearchOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<'none' | 'notifications' | 'user'>('none')
  const actionsRef = useRef<HTMLDivElement>(null)

  useDismissable(actionsRef, openMenu !== 'none', () => setOpenMenu('none'))

  const role = session?.role ?? 'patient'
  const isDoctor = role === 'doctor'
  const homePath = isDoctor ? '/doctor' : '/'
  const canSearch = !isDoctor

  // Ctrl/⌘ + K opens global search from anywhere in the app shell.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!canSearch) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canSearch])

  // Close any open dropdown when the route changes. Comparing the previous
  // pathname during render is React's recommended way to reset state when a
  // prop changes, without an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpenMenu('none')
  }

  const navItem = findNavItem(location.pathname)
  const title = t(navItem?.label ?? 'Health Copilot')
  const roleLabel = isDoctor ? t('Doctor') : t('Patient')
  const themeActionLabel = t(
    resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  )
  const notificationsLabel =
    unreadCount > 0 ? `${t('Notifications')} · ${unreadCount} ${t('Unread')}` : t('Notifications')

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenMobileNav}
            aria-label={t('Open navigation menu')}
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <nav aria-label={t('Breadcrumb')} className="hidden items-center gap-1 text-xs text-muted sm:flex">
              <Link to={homePath} className="transition-colors hover:text-ink">
                {isDoctor ? t('Practice') : 'Health Copilot'}
              </Link>
              <ChevronRight aria-hidden="true" className="size-3" />
              <span className="font-medium text-ink-soft">{title}</span>
            </nav>
            <p className="truncate text-sm font-semibold text-ink sm:hidden">{title}</p>
          </div>

          <div ref={actionsRef} className="flex items-center gap-1.5">
            {canSearch ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink sm:min-w-56"
                aria-label={t('Open search (Control K)')}
              >
                <Search aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">{t('Search…')}</span>
                <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted sm:inline">
                  Ctrl K
                </kbd>
              </button>
            ) : null}

            <span className="hidden sm:block">
              <LanguageSwitcher />
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={themeActionLabel}
              title={themeActionLabel}
            >
              {resolvedTheme === 'dark' ? (
                <Sun aria-hidden="true" className="size-5" />
              ) : (
                <Moon aria-hidden="true" className="size-5" />
              )}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenMenu((menu) => (menu === 'notifications' ? 'none' : 'notifications'))}
                aria-label={notificationsLabel}
                aria-expanded={openMenu === 'notifications'}
                aria-haspopup="dialog"
              >
                <Bell aria-hidden="true" className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Button>

              {openMenu === 'notifications' ? (
                <div className="absolute right-0 top-12 z-40 animate-fade-in rounded-2xl border border-line bg-surface shadow-pop">
                  <NotificationsPanel onNavigate={() => setOpenMenu('none')} />
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setOpenMenu((menu) => (menu === 'user' ? 'none' : 'user'))}
              aria-label={t('Open account menu')}
              aria-expanded={openMenu === 'user'}
              aria-haspopup="menu"
              className={cn(
                'flex items-center gap-2 rounded-xl p-1 pl-2 transition-colors hover:bg-surface-2',
                openMenu === 'user' && 'bg-surface-2',
              )}
            >
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-xs font-semibold text-ink">{profile.fullName}</span>
                <span className="block text-[0.68rem] text-muted">{roleLabel}</span>
              </span>
              <Avatar name={profile.fullName} color={profile.avatarColor} />
            </button>

            {openMenu === 'user' ? (
              <div className="absolute right-2 top-16 z-40 animate-fade-in rounded-2xl border border-line bg-surface shadow-pop">
                <UserMenu onNavigate={() => setOpenMenu('none')} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {canSearch ? <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  )
}