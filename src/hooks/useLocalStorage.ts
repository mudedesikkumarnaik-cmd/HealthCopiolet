import { useCallback, useState } from 'react'
import { storageService } from '@/services/storageService'

/**
 * Persists a value in localStorage with graceful handling of malformed data.
 * The optional `validate` guard rejects stale or corrupted payloads.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T,
): [T, (next: T | ((previous: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() =>
    storageService.readJSON<T>(key, initialValue, validate),
  )

  const set = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved =
          typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
        storageService.writeJSON(key, resolved)
        return resolved
      })
    },
    [key],
  )

  const reset = useCallback(() => {
    storageService.remove(key)
    setValue(initialValue)
  }, [key, initialValue])

  return [value, set, reset]
}
