import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { useI18n } from '@/context/I18nContext'
import { ToastProvider } from '@/context/ToastContext'

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className="relative min-h-dvh">
      {/* Decorative aurora background — echoes the sign-in screen across the app */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#edfdf2] via-[#eafbf1] to-[#f1fbe9] dark:from-[#04140a] dark:via-[#06301c] dark:to-[#04140a]" />
        <div className="animate-aurora absolute -left-32 -top-32 size-[26rem] rounded-full bg-emerald-400/30 blur-[130px] dark:bg-emerald-500/35" />
        <div className="animate-aurora absolute -right-28 top-1/4 size-[24rem] rounded-full bg-green-400/25 blur-[130px] [animation-delay:-6s] dark:bg-green-500/30" />
        <div className="animate-aurora absolute -bottom-40 left-1/3 size-[30rem] rounded-full bg-lime-300/25 blur-[140px] [animation-delay:-12s] dark:bg-lime-500/20" />
        <div className="animate-aurora absolute -bottom-32 right-1/4 size-[22rem] rounded-full bg-teal-300/20 blur-[130px] [animation-delay:-3s] dark:bg-teal-500/20" />
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t('Skip to main content')}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line lg:block">
        <div className="hc-scroll h-dvh overflow-y-auto">
          <Sidebar />
        </div>
      </aside>

      <div className="relative z-10 flex min-h-dvh flex-col lg:pl-[264px]">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main id="main-content" className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </main>

        <footer className="border-t border-line px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Health Copilot keeps your health details organised in one place. Everything you add is
              stored privately in this browser, associated with your account.
            </p>
            <p>
              Educational information only — not a diagnosis, treatment or substitute for professional
              medical care.
            </p>
          </div>
        </footer>
      </div>

      <MobileNavigation open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  )
}
