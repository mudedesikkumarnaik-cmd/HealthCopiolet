import type { AuthSession, UserRole } from '@/types/user'
import { doctors } from '@/data/doctorsData'
import { STORAGE_KEYS, storageService } from './storageService'
import {
  firebaseFetchRole,
  firebaseLogout,
  firebaseSaveRole,
  firebaseSendPasswordReset,
  firebaseSignIn,
  firebaseSignUp,
  isFirebaseConfigured,
} from './firebaseClient'

/**
 * Authentication service.
 *
 * When Firebase is configured (VITE_FIREBASE_API_KEY etc.) sign-in uses real
 * Firebase Authentication accounts. Anyone can create an account — patient or
 * doctor — from the sign-up page, and the account can be used from any
 * browser. Roles (patient/doctor) are stored in Firestore with a per-device
 * cache fallback.
 *
 * Each account is locked to ONE role: patient credentials can never open the
 * doctor side, and doctor credentials can never sign in as a patient.
 *
 * Without Firebase configuration the app degrades to local browser accounts so
 * it still works offline. Local mode is not secure and is only a fallback.
 */

export interface UserAccount {
  id: string
  fullName: string
  email: string
  role: UserRole
  createdAt: string
  /**
   * Lightweight password hash for the offline fallback only (never used in
   * Firebase mode). Optional so accounts created before this field still load.
   */
  passwordHash?: string
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const LATENCY_MS = 400

function delay(ms = LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The two built-in sample personae (one patient, one doctor) with seeded data. */
export const SAMPLE_ACCOUNTS: Record<UserRole, { email: string; password: string; fullName: string }> = {
  patient: { email: 'patient@healthcopilot.app', password: 'Health@2026', fullName: 'Alex Morgan' },
  doctor: { email: 'doctor@healthcopilot.app', password: 'Health@2026', fullName: 'Priya Raman' },
}

/**
 * Returns the built-in persona a session belongs to (if any). Only these two
 * accounts receive the seeded sample data — everyone else starts fresh.
 */
export function samplePersonaFor(email: string | null | undefined): UserRole | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (normalized === SAMPLE_ACCOUNTS.patient.email) return 'patient'
  if (normalized === SAMPLE_ACCOUNTS.doctor.email) return 'doctor'
  return null
}

/**
 * Every clinician in the sample directory has a real sign-in account. Signing
 * in with one opens the doctor side scoped to that clinician's directory
 * entry, so each doctor sees their own requests and practice view.
 *
 * These are sample accounts only — none of the clinicians are real people.
 * One shared password keeps the sample set easy to demonstrate.
 */
export const CLINICIAN_PASSWORD = 'Health@2026'

export interface ClinicianAccount {
  id: string
  name: string
  email: string
  specialty: string
  password: string
}

export const CLINICIAN_ACCOUNTS: ClinicianAccount[] = doctors.map((doctor) => ({
  id: doctor.id,
  name: doctor.name,
  email: doctor.email.trim().toLowerCase(),
  specialty: doctor.specialty,
  password: CLINICIAN_PASSWORD,
}))

/** Looks up a clinician account by email (case-insensitive). */
export function clinicianForEmail(email: string | null | undefined): ClinicianAccount | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return CLINICIAN_ACCOUNTS.find((account) => account.email === normalized) ?? null
}

/** True when an email belongs to a clinician in the sample directory. */
export function isClinicianEmail(email: string | null | undefined): boolean {
  return clinicianForEmail(email) !== null
}

/**
 * Rejects a sign-in when an account bound to one role is used with the other.
 * Accounts are locked to ONE role — patient credentials can never open the
 * doctor side, and vice versa.
 */
function ensureRoleMatches(chosen: UserRole, bound: UserRole): void {
  if (chosen === bound) return
  throw new AuthError(
    bound === 'doctor'
      ? 'This account is a doctor account. Choose “I am a doctor” to sign in — doctor credentials cannot be reused for patients.'
      : 'This account is a patient account. Choose “I am a patient” to sign in — patient credentials cannot be reused for doctors.',
  )
}

/* --------------------------- local account store -------------------------- */

function readAccounts(): UserAccount[] {
  return storageService.readJSON<UserAccount[]>(
    STORAGE_KEYS.accounts,
    [],
    (value): value is UserAccount[] => Array.isArray(value),
  )
}

function writeAccounts(accounts: UserAccount[]): void {
  storageService.writeJSON(STORAGE_KEYS.accounts, accounts)
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Lightweight, non-cryptographic password hash used ONLY by the offline local
 * fallback (localStorage is not a secure store — see the module note above).
 * It exists so that a local account cannot be opened with an arbitrary password.
 */
function hashPassword(password: string, salt: string): string {
  const input = `${salt}\u0000${password}`
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

/* ----------------------------- role resolution --------------------------- */

function readRoleCache(): Record<string, UserRole> {
  return storageService.readJSON<Record<string, UserRole>>(
    STORAGE_KEYS.userRoles,
    {},
    (value): value is Record<string, UserRole> =>
      typeof value === 'object' && value !== null && !Array.isArray(value),
  )
}

function cacheRole(uid: string, role: UserRole): void {
  storageService.writeJSON(STORAGE_KEYS.userRoles, { ...readRoleCache(), [uid]: role })
}

function isRole(value: unknown): value is UserRole {
  return value === 'patient' || value === 'doctor'
}

function localRoleForUid(uid: string): UserRole | null {
  const cached = readRoleCache()[uid]
  return isRole(cached) ? cached : null
}

/**
 * Resolves a Firebase user's role: Firestore record first (source of truth),
 * then the local cache, then the role the person chose on the login screen.
 * Also returns a stored display name when available.
 */
async function resolveFirebaseProfile(
  uid: string,
  email: string,
  preferred: UserRole,
): Promise<{ role: UserRole; fullName: string | null }> {
  // The built-in personae have a fixed role that cannot be changed, whatever
  // was picked on the login screen — the caller checks the match afterwards.
  // A role is only pushed to Firestore when it is newly determined on this
  // device; re-syncing an unchanged role on every sign-in is redundant and, on
  // projects with restrictive rules, just produces avoidable failed requests.
  const persona = samplePersonaFor(email)
  if (persona) {
    if (localRoleForUid(uid) !== persona) {
      void firebaseSaveRole(uid, persona, SAMPLE_ACCOUNTS[persona].fullName, email)
    }
    cacheRole(uid, persona)
    return { role: persona, fullName: SAMPLE_ACCOUNTS[persona].fullName }
  }

  // Directory clinicians are always doctors, whatever was chosen on the login
  // screen — the role cannot be changed.
  const clinician = clinicianForEmail(email)
  if (clinician) {
    if (localRoleForUid(uid) !== 'doctor') {
      void firebaseSaveRole(uid, 'doctor', clinician.name, email)
    }
    cacheRole(uid, 'doctor')
    return { role: 'doctor', fullName: clinician.name }
  }

  const record = await firebaseFetchRole(uid)
  if (record?.role) {
    cacheRole(uid, record.role)
    return { role: record.role, fullName: record.fullName?.trim() || null }
  }
  const cached = localRoleForUid(uid)
  if (cached) {
    // Already bound on this device — nothing new to sync.
    return { role: cached, fullName: null }
  }
  // First sign-in for this account: bind the chosen role. Everyone — patient
  // or doctor — picks their role once, and it is then locked to the account.
  cacheRole(uid, preferred)
  void firebaseSaveRole(uid, preferred, email, email)
  return { role: preferred, fullName: null }
}

/* -------------------------------- sessions ------------------------------- */

function createSession(
  account: { id: string; fullName: string; email: string; role: UserRole },
  provider: 'firebase' | 'local',
  rememberMe = true,
): AuthSession {
  const session: AuthSession = {
    userId: account.id,
    fullName: account.fullName,
    email: account.email,
    role: account.role,
    provider,
    startedAt: new Date().toISOString(),
  }
  writeSession(session, rememberMe)
  return session
}

/**
 * Persists the session in localStorage when "Remember me" is on, or in
 * sessionStorage (cleared when the tab closes) when it is off.
 */
function writeSession(session: AuthSession, rememberMe: boolean): void {
  if (rememberMe) {
    storageService.writeJSON(STORAGE_KEYS.session, session)
    try {
      window.sessionStorage.removeItem(STORAGE_KEYS.session)
    } catch {
      /* ignore */
    }
    return
  }
  storageService.remove(STORAGE_KEYS.session)
  try {
    window.sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

/** Reads a session persisted for this tab only (when "Remember me" was off). */
function readTabSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.session)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

function clearSession(): void {
  storageService.remove(STORAGE_KEYS.session)
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.session)
  } catch {
    /* ignore */
  }
}

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AuthSession>
  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.email === 'string' &&
    isRole(candidate.role) &&
    (candidate.provider === 'firebase' || candidate.provider === 'local')
  )
}

function findLocalAccount(email: string): UserAccount | undefined {
  return readAccounts().find((account) => account.email.trim().toLowerCase() === email)
}

/** Returns the local account for a built-in persona, creating it on first use. */
function ensurePersonaLocalAccount(role: UserRole): UserAccount {
  const sample = SAMPLE_ACCOUNTS[role]
  const existing = findLocalAccount(sample.email)
  if (existing) return existing
  const account: UserAccount = {
    id: `user_sample_${role}`,
    fullName: sample.fullName,
    email: sample.email,
    role,
    createdAt: new Date().toISOString(),
  }
  writeAccounts([...readAccounts(), account])
  return account
}

/** Returns the local account for a clinician in the sample directory. */
function ensureClinicianLocalAccount(clinician: ClinicianAccount): UserAccount {
  const existing = findLocalAccount(clinician.email)
  if (existing) return existing
  const account: UserAccount = {
    id: `user_${clinician.id}`,
    fullName: clinician.name,
    email: clinician.email,
    role: 'doctor',
    createdAt: new Date().toISOString(),
  }
  writeAccounts([...readAccounts(), account])
  return account
}

export const authService = {
  getSession(): AuthSession | null {
    const remembered = storageService.readJSON<AuthSession | null>(
      STORAGE_KEYS.session,
      null,
      (value): value is AuthSession | null => value === null || isValidSession(value),
    )
    return remembered ?? readTabSession()
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null
  },

  /** Signs in with email/password, using the role chosen on the login screen. */
  async login(input: {
    email: string
    password: string
    role: UserRole
    rememberMe?: boolean
  }): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase()
    const password = input.password
    await delay()

    if (!email || !password) {
      throw new AuthError('Enter both your email and password.')
    }

    if (isFirebaseConfigured()) {
      try {
        const tokens = await firebaseSignIn({ email, password })
        const { role, fullName: storedName } = await resolveFirebaseProfile(
          tokens.uid,
          tokens.email,
          input.role,
        )
        ensureRoleMatches(input.role, role)
        const fullName = storedName?.trim() || email.split('@')[0]
        return createSession(
          { id: tokens.uid, fullName, email: tokens.email, role },
          'firebase',
          input.rememberMe ?? true,
        )
      } catch (error) {
        throw new AuthError(error instanceof Error ? error.message : 'Unable to sign in.')
      }
    }

    // Local fallback: the two built-in personae, then directory clinicians, then
    // self-registered accounts (patients and doctors) on this device.
    const persona = samplePersonaFor(email)
    if (persona) {
      const sample = SAMPLE_ACCOUNTS[persona]
      if (password !== sample.password) {
        throw new AuthError(`The password for the ${persona} account is incorrect.`)
      }
      ensureRoleMatches(input.role, persona)
      return createSession(ensurePersonaLocalAccount(persona), 'local', input.rememberMe ?? true)
    }

    // Directory clinicians sign in with their own account and always get the
    // doctor role.
    const clinician = clinicianForEmail(email)
    if (clinician) {
      if (password !== clinician.password) {
        throw new AuthError('The password for this clinician account is incorrect.')
      }
      ensureRoleMatches(input.role, 'doctor')
      return createSession(ensureClinicianLocalAccount(clinician), 'local', input.rememberMe ?? true)
    }

    const existing = findLocalAccount(email)
    if (!existing) {
      throw new AuthError('No account found with this email. Create a free account first — or sign in with a sample account.')
    }
    ensureRoleMatches(input.role, existing.role)
    if (existing.passwordHash) {
      if (existing.passwordHash !== hashPassword(password, email)) {
        throw new AuthError('The password for this account is incorrect.')
      }
    } else {
      // Legacy local account created before password storage existed — bind the
      // supplied password now so it is protected from here on.
      writeAccounts(
        readAccounts().map((account) =>
          account.email.trim().toLowerCase() === email
            ? { ...account, passwordHash: hashPassword(password, email) }
            : account,
        ),
      )
    }
    return createSession(existing, 'local', input.rememberMe ?? true)
  },

  /** Registers a real (Firebase) or local account and signs the user in. */
  async signup(input: {
    fullName: string
    email: string
    password: string
    role: UserRole
  }): Promise<AuthSession> {
    const fullName = input.fullName.trim()
    const email = input.email.trim().toLowerCase()
    await delay()

    if (fullName.length < 2) throw new AuthError('Enter your full name.')
    if (!email) throw new AuthError('Enter your email address.')
    if (input.password.length < 8) {
      throw new AuthError('Choose a password with at least 8 characters.')
    }
    // Sample personae and directory clinicians have built-in accounts; a new
    // sign-up with one of those emails would create a shadowed duplicate.
    if (samplePersonaFor(email) || clinicianForEmail(email)) {
      throw new AuthError(
        'That email belongs to a built-in sample account. Sign in with it instead, or use a different email.',
      )
    }

    if (isFirebaseConfigured()) {
      try {
        const tokens = await firebaseSignUp({ email, password: input.password, fullName })
        const role = input.role
        cacheRole(tokens.uid, role)
        void firebaseSaveRole(tokens.uid, role, fullName, tokens.email)
        return createSession({ id: tokens.uid, fullName, email: tokens.email, role }, 'firebase')
      } catch (error) {
        throw new AuthError(error instanceof Error ? error.message : 'Unable to create the account.')
      }
    }

    const existing = findLocalAccount(email)
    if (existing) {
      throw new AuthError('An account with this email already exists. Try signing in instead.')
    }
    const account: UserAccount = {
      id: makeId('user'),
      fullName,
      email,
      role: input.role,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password, email),
    }
    writeAccounts([...readAccounts(), account])
    return createSession(account, 'local')
  },

  /** Sends a real password-reset email when Firebase is configured. */
  async forgotPassword(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase()
    if (!normalized) throw new AuthError('Enter the email for your account.')
    if (!isFirebaseConfigured()) {
      throw new AuthError('Password reset needs a connected authentication backend. Use a sample account to explore.')
    }
    try {
      await firebaseSendPasswordReset(normalized)
    } catch (error) {
      throw new AuthError(error instanceof Error ? error.message : 'Unable to send a reset link.')
    }
  },

  logout(): void {
    firebaseLogout()
    clearSession()
  },
}