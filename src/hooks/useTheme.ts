import { useCallback, useEffect, useState } from 'react'
import { usePreferences } from '@/context/PreferencesContext'
import type { ThemePreference } from '@/types/user'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

export interface UseThemeResult {
  theme: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

/**
 * Reads and updates the persisted theme preference.
 * Document-level class changes are handled by <AppearanceEffects />.
 */
export function useTheme(): UseThemeResult {
  const { preferences, updatePreferences } = usePreferences()
  const theme = preferences.theme
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(MEDIA_QUERY).matches : false,
  )

  useEffect(() => {
    const query = window.matchMedia(MEDIA_QUERY)
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const setTheme = useCallback(
    (next: ThemePreference) => updatePreferences({ theme: next }),
    [updatePreferences],
  )

  const toggleTheme = useCallback(
    () => updatePreferences({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' }),
    [updatePreferences, resolvedTheme],
  )

  return { theme, resolvedTheme, setTheme, toggleTheme }
}
