import { Link } from 'react-router-dom'
import { Compass, Home, LayoutDashboard } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer size="narrow" className="py-10">
      <div className="card flex flex-col items-center gap-5 px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <Compass aria-hidden="true" className="size-7" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            404
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">We couldn’t find that page</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The page you were looking for doesn’t exist in this app. It may have moved, or the link
            could be out of date.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
          >
            <LayoutDashboard aria-hidden="true" className="size-4" />
            Go to dashboard
          </Link>
          <Link
            to="/help"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <Home aria-hidden="true" className="size-4" />
            Help &amp; support
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
