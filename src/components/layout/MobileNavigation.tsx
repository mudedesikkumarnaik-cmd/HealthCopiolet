import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { useI18n } from '@/context/I18nContext'
import { cn } from '@/utils/cn'

export interface MobileNavigationProps {
  open: boolean
  onClose: () => void
}

/** Slide-in navigation drawer for tablet and mobile screens. */
export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', !open && 'pointer-events-none')}
      aria-hidden={!open}
      // Keep the off-screen drawer out of the keyboard tab order and the
      // accessibility tree when it is closed.
      inert={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-slate-950/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('Navigation')}
        className={cn(
          'absolute inset-y-0 left-0 w-[17.5rem] max-w-[85vw] border-r border-line shadow-pop',
          'transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar prominentClose onClose={onClose} onNavigate={onClose} />
      </aside>
    </div>
  )
}
