import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { usePreferences } from '@/context/PreferencesContext'
import { languageLabel, resolveLocale, translate } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'

interface I18nContextValue {
  /** Active locale, resolved from the saved language preference. */
  locale: Locale
  /** Translates an English source string into the active locale. */
  t: (key: string, vars?: Record<string, string | number>) => string
  /** Switches the app language and persists the choice. */
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

/**
 * Provides translations for the whole app. The active locale is derived from
 * the saved `health.language` preference, so changing it in Settings updates
 * every translated surface — for patients and doctors alike.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { preferences, updateNested } = usePreferences()
  const locale = resolveLocale(preferences.health.language)

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const setLocale = useCallback(
    (next: Locale) => updateNested('health', { language: languageLabel(next) }),
    [updateNested],
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}
