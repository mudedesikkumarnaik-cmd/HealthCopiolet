import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_PREFERENCES } from '@/data/demoUser'
import { STORAGE_KEYS, storageService } from '@/services/storageService'
import type { AppPreferences } from '@/types/user'

interface PreferencesContextValue {
  preferences: AppPreferences
  updatePreferences: (patch: Partial<AppPreferences>) => void
  updateNested: <K extends NestedPreferenceSection>(
    section: K,
    patch: Partial<AppPreferences[K]>,
  ) => void
  resetPreferences: () => void
}

/** Preference sections that are nested objects (theme is a plain string union). */
type NestedPreferenceSection = 'notifications' | 'health' | 'ai' | 'accessibility'

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function isPreferences(value: unknown): value is AppPreferences {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppPreferences>
  return typeof candidate.theme === 'string' && typeof candidate.notifications === 'object'
}

/**
 * Merges stored preferences with the defaults so new preference keys always
 * exist, even for users who stored preferences with an older schema.
 */
function mergePreferences(stored: AppPreferences): AppPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...stored,
    notifications: { ...DEFAULT_PREFERENCES.notifications, ...stored.notifications },
    health: { ...DEFAULT_PREFERENCES.health, ...stored.health },
    ai: { ...DEFAULT_PREFERENCES.ai, ...stored.ai },
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, ...stored.accessibility },
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(() =>
    mergePreferences(
      storageService.readJSON<AppPreferences>(
        STORAGE_KEYS.preferences,
        DEFAULT_PREFERENCES,
        isPreferences,
      ),
    ),
  )

  const persist = useCallback((next: AppPreferences) => {
    setPreferences(next)
    storageService.writeJSON(STORAGE_KEYS.preferences, next)
  }, [])

  const updatePreferences = useCallback(
    (patch: Partial<AppPreferences>) => {
      setPreferences((previous) => {
        const next = mergePreferences({ ...previous, ...patch })
        storageService.writeJSON(STORAGE_KEYS.preferences, next)
        return next
      })
    },
    [],
  )

  const updateNested = useCallback(
    <K extends NestedPreferenceSection>(section: K, patch: Partial<AppPreferences[K]>) => {
      setPreferences((previous) => {
        const next = mergePreferences({
          ...previous,
          [section]: {
            ...(previous[section] as unknown as Record<string, unknown>),
            ...(patch as Record<string, unknown>),
          },
        } as AppPreferences)
        storageService.writeJSON(STORAGE_KEYS.preferences, next)
        return next
      })
    },
    [],
  )

  const resetPreferences = useCallback(() => {
    persist({ ...DEFAULT_PREFERENCES })
  }, [persist])

  const value = useMemo(
    () => ({ preferences, updatePreferences, updateNested, resetPreferences }),
    [preferences, updatePreferences, updateNested, resetPreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used inside a PreferencesProvider')
  return context
}

/**
 * Applies theme + accessibility preferences to the document root.
 * Rendered once near the app root so every page (including login) is themed.
 */
export function AppearanceEffects() {
  const { preferences } = usePreferences()
  const { theme, accessibility } = preferences
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [resolved])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('reduce-motion', accessibility.reduceMotion)
    root.classList.toggle('large-text', accessibility.largeText)
    root.classList.toggle('hc-links', accessibility.highContrastLinks)
  }, [accessibility.reduceMotion, accessibility.largeText, accessibility.highContrastLinks])

  return null
}
