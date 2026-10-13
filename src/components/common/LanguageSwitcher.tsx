import { Languages } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import { SUPPORTED_LANGUAGES } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'
import { cn } from '@/utils/cn'

/**
 * Compact language picker.
 *
 * Renders on the public auth screens (`tone="dark"`, over the aurora) and in
 * the signed-in app header (`tone="surface"`), so the app language can be
 * changed before or after signing in. The choice is persisted by the I18n
 * provider and updates every translated surface instantly.
 */
export function LanguageSwitcher({
  tone = 'surface',
  className,
}: {
  tone?: 'surface' | 'dark'
  className?: string
}) {
  const { locale, setLocale, t } = useI18n()

  return (
    <label className={cn('relative inline-flex items-center', className)}>
      <span className="sr-only">{t('Language')}</span>
      <Languages
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-2.5 size-4',
          tone === 'dark' ? 'text-white/80' : 'text-muted',
        )}
      />
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t('Language')}
        className={cn(
          'h-10 cursor-pointer appearance-none rounded-xl border py-0 pl-8 pr-7 text-sm font-medium transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
          tone === 'dark'
            ? 'border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20'
            : 'border-line bg-surface-2 text-ink hover:border-line-strong',
        )}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'pointer-events-none absolute right-2 size-3.5',
          tone === 'dark' ? 'text-white/80' : 'text-muted',
        )}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  )
}
