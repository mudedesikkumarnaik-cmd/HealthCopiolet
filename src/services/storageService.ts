/**
 * Thin, fault-tolerant wrapper around window.localStorage.
 *
 * The app intentionally stores ONLY non-sensitive sample data and preferences.
 * Do not treat browser storage as a secure database — see README and the
 * Settings → Privacy section for the full explanation.
 */

const NAMESPACE = 'health-copilot'

export const STORAGE_KEYS = {
  dataVersion: `${NAMESPACE}:data-version`,
  session: `${NAMESPACE}:session`,
  profile: `${NAMESPACE}:profile`,
  preferences: `${NAMESPACE}:preferences`,
  records: `${NAMESPACE}:records`,
  medications: `${NAMESPACE}:medications`,
  appointments: `${NAMESPACE}:appointments`,
  goals: `${NAMESPACE}:goals`,
  habits: `${NAMESPACE}:habits`,
  notifications: `${NAMESPACE}:notifications`,
  /**
   * A user-edited current weight (kg), scoped per account. When set, it
   * replaces the generated sample reading on the analytics page.
   */
  weightKg: `${NAMESPACE}:weight-kg`,
  /**
   * Appointment requests are intentionally a single shared collection (not
   * scoped per account) so a doctor on this device can see the requests a
   * patient submitted to them, and vice versa.
   */
  appointmentRequests: `${NAMESPACE}:appointment-requests`,
  /**
   * Feedback is deliberately another shared collection (not scoped per
   * account): the board shows every patient and doctor on this device the
   * same notes, as if posted to a common wall.
   */
  feedback: `${NAMESPACE}:feedback`,
  /**
   * Patient-uploaded records, shared so a clinician can review what a patient
   * has added. Scoped records live under `records:<userId>`; this collection
   * carries a labelled copy for the care team inbox.
   */
  patientRecords: `${NAMESPACE}:patient-records`,
  /**
   * Prescriptions written by clinicians. Shared so the doctor side can list
   * what was prescribed; each one is delivered into one patient's own
   * medication list when it is issued.
   */
  prescriptions: `${NAMESPACE}:prescriptions`,
  chatThreads: `${NAMESPACE}:chat-threads`,
  accounts: `${NAMESPACE}:accounts`,
  /** uid -> 'patient' | 'doctor' cache so roles survive offline sign-ins. */
  userRoles: `${NAMESPACE}:user-roles`,
  /** Firebase Auth REST tokens (id token + refresh token). */
  firebaseTokens: `${NAMESPACE}:firebase-tokens`,
} as const

/** Bump when the shape of stored data changes, to force a clean reseed. */
export const DATA_VERSION = '4'

/** In-memory fallback so the app still works when storage is blocked/private. */
const memoryFallback = new Map<string, string>()
/** Keys whose last write fell back to memory (e.g. quota error), so reads stay consistent. */
const fallbackKeys = new Set<string>()

function canUseStorage(): boolean {
  try {
    const probe = `${NAMESPACE}:__probe__`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const storageAvailable = typeof window !== 'undefined' && canUseStorage()

function getRaw(key: string): string | null {
  try {
    if (storageAvailable && !fallbackKeys.has(key)) return window.localStorage.getItem(key)
    return memoryFallback.get(key) ?? null
  } catch {
    return memoryFallback.get(key) ?? null
  }
}

function setRaw(key: string, value: string): void {
  try {
    if (storageAvailable) {
      window.localStorage.setItem(key, value)
      // Written to real storage — drop any stale memory fallback for this key.
      fallbackKeys.delete(key)
      memoryFallback.delete(key)
    } else {
      memoryFallback.set(key, value)
    }
  } catch {
    // Quota or disabled storage — fall back to memory so the UI keeps working.
    memoryFallback.set(key, value)
    fallbackKeys.add(key)
  }
}

function removeRaw(key: string): void {
  try {
    if (storageAvailable) window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  memoryFallback.delete(key)
  fallbackKeys.delete(key)
}

/**
 * Reads JSON with a validator. Malformed or stale data is discarded (and the
 * bad key removed) instead of crashing the app.
 */
function readJSON<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  const raw = getRaw(key)
  if (raw == null) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) {
      removeRaw(key)
      return fallback
    }
    return parsed as T
  } catch {
    removeRaw(key)
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    setRaw(key, JSON.stringify(value))
  } catch {
    /* serialisation failure should never crash the UI */
  }
}

export const storageService = {
  isAvailable: storageAvailable,
  readJSON,
  writeJSON,
  remove: removeRaw,
  readString(key: string): string | null {
    return getRaw(key)
  },
  writeString(key: string, value: string): void {
    setRaw(key, value)
  },
  /** Removes every Health Copilot key, leaving other sites' data untouched. */
  clearAll(): void {
    // Exact app keys (login, patient collections...).
    Object.values(STORAGE_KEYS).forEach((key) => removeRaw(key))
    // Per-user scoped keys such as profile:<uid>, records:<uid>, notifications:<uid>
    // must be swept too, otherwise a schema migration would keep reading stale data.
    try {
      if (storageAvailable) {
        for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
          const key = window.localStorage.key(i)
          if (key?.startsWith(`${NAMESPACE}:`)) removeRaw(key)
        }
      }
    } catch {
      /* ignore */
    }
    memoryFallback.forEach((_, key) => {
      if (key.startsWith(`${NAMESPACE}:`)) removeRaw(key)
    })
  },
  /**
   * Resets the sample dataset (records, medicines, appointments, goals,
   * habits, notifications and chat) while keeping the signed-in session, the
   * account list, roles, tokens and appearance preferences intact.
   */
  clearDemoData(): void {
    const keep = new Set<string>([
      STORAGE_KEYS.session,
      STORAGE_KEYS.accounts,
      STORAGE_KEYS.userRoles,
      STORAGE_KEYS.firebaseTokens,
      STORAGE_KEYS.preferences,
      STORAGE_KEYS.dataVersion,
    ])
    const removeIfMatching = (key: string): void => {
      if (!key.startsWith(`${NAMESPACE}:`)) return
      if (keep.has(key)) return
      removeRaw(key)
    }
    // Exact app keys (login, patient collections...).
    Object.values(STORAGE_KEYS).forEach(removeIfMatching)
    // Per-user scoped keys such as profile:<uid> and records:<uid>.
    try {
      if (storageAvailable) {
        for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
          const key = window.localStorage.key(i)
          if (key) removeIfMatching(key)
        }
      }
    } catch {
      /* ignore */
    }
    memoryFallback.forEach((_, key) => removeIfMatching(key))
  },
  /** True when stored data was written by a different schema version. */
  needsReseed(): boolean {
    return getRaw(STORAGE_KEYS.dataVersion) !== DATA_VERSION
  },
  markSeeded(): void {
    setRaw(STORAGE_KEYS.dataVersion, DATA_VERSION)
  },
  /**
   * Called once before the app renders. If the stored schema version differs
   * (or this is a first run), the stored payload is discarded and reseeded so
   * the UI never receives data it cannot understand.
   */
  ensureVersion(): void {
    if (this.needsReseed()) {
      this.clearAll()
      this.markSeeded()
    }
  },
  /** Rough byte size of the stored data, shown in Settings → Privacy. */
  estimateSizeKb(): number {
    let total = 0
    const seen = new Set<string>()
    const add = (key: string): void => {
      if (seen.has(key)) return
      seen.add(key)
      const raw = getRaw(key)
      if (raw) total += raw.length * 2
    }
    Object.values(STORAGE_KEYS).forEach(add)
    memoryFallback.forEach((_, key) => add(key))
    try {
      if (storageAvailable) {
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i)
          if (key && key.startsWith(`${NAMESPACE}:`)) add(key)
        }
      }
    } catch {
      /* ignore */
    }
    return Math.round((total / 1024) * 10) / 10
  },
}

/** Generic array guard used by the data provider for stored collections. */
export function isArrayOf<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}
