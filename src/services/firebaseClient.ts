/**
 * Minimal Firebase integration via the public REST APIs (Identity Toolkit +
 * Firestore). Avoids shipping the Firebase SDK so the bundle stays small and
 * there are no secret keys in the client — the API key is a public web-app
 * key by design.
 *
 * Configuration comes from VITE_FIREBASE_* environment variables (see
 * .env.example). Everything degrades gracefully: if no API key is configured,
 * the app falls back to local browser accounts via authService.
 */

import { STORAGE_KEYS, storageService } from './storageService'
import type { UserRole } from '@/types/user'

interface FirebaseConfig {
  apiKey: string
  projectId: string | null
}

interface FirebaseTokens {
  idToken: string
  refreshToken: string
  /** Epoch ms after which the id token should be treated as expired. */
  expiresAt: number
  uid: string
  email: string
}

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1'
const TOKEN_BASE = 'https://securetoken.googleapis.com/v1'
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1'

const env = import.meta.env

export function getFirebaseConfig(): FirebaseConfig | null {
  const apiKey = (env.VITE_FIREBASE_API_KEY as string | undefined)?.trim()
  if (!apiKey) return null
  return {
    apiKey,
    projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() || null,
  }
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null
}

/* ------------------------------ token store ------------------------------ */

let tokenCache: FirebaseTokens | null = null

function readTokens(): FirebaseTokens | null {
  if (tokenCache) return tokenCache
  tokenCache = storageService.readJSON<FirebaseTokens | null>(
    STORAGE_KEYS.firebaseTokens,
    null,
    (value): value is FirebaseTokens | null =>
      value === null ||
      (typeof value === 'object' &&
        typeof (value as FirebaseTokens).idToken === 'string' &&
        typeof (value as FirebaseTokens).refreshToken === 'string'),
  )
  return tokenCache
}

function writeTokens(tokens: FirebaseTokens | null): void {
  tokenCache = tokens
  if (tokens) storageService.writeJSON(STORAGE_KEYS.firebaseTokens, tokens)
  else storageService.remove(STORAGE_KEYS.firebaseTokens)
}

function isExpired(tokens: FirebaseTokens): boolean {
  return Date.now() >= tokens.expiresAt - 5 * 60_000
}

/** Posts a JSON payload and throws a friendly AuthError on failure. */
async function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20_000)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    window.clearTimeout(timer)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The authentication service timed out. Please try again.', { cause: error })
    }
    throw new Error('Could not reach the authentication service. Check your connection.', {
      cause: error,
    })
  }
  window.clearTimeout(timer)

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const code = (data?.error?.message as string | undefined) ?? `HTTP ${response.status}`
    const error = new Error(translateAuthError(code)) as Error & { code?: string }
    error.code = code
    throw error
  }
  return data as T
}

/**
 * Maps Firebase Identity Toolkit error codes to plain-language messages.
 * See https://firebase.google.com/docs/reference/rest/auth for codes.
 */
export function translateAuthError(code: string): string {
  switch (code) {
    case 'EMAIL_EXISTS':
      return 'An account with this email already exists. Try signing in instead.'
    case 'EMAIL_NOT_FOUND':
      return 'No account found with this email. Create an account first.'
    case 'INVALID_PASSWORD':
      return 'Incorrect password. Please try again.'
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'Incorrect email or password. Please try again.'
    case 'INVALID_EMAIL':
      return 'Enter a valid email address.'
    case 'WEAK_PASSWORD':
      return 'Choose a stronger password (at least 8 characters).'
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'USER_DISABLED':
      return 'This account has been disabled.'
    case 'OPERATION_NOT_ALLOWED':
      return 'Email/password sign-in is not enabled for this project yet.'
    default:
      return code
  }
}

/* ------------------------------- sign in -------------------------------- */

export async function firebaseSignUp(input: {
  email: string
  password: string
  fullName: string
}): Promise<FirebaseTokens> {
  const config = getFirebaseConfig()
  if (!config) throw new Error('Firebase is not configured.')
  const result = await postJson<{
    idToken: string
    refreshToken: string
    localId: string
    email: string
  }>(`${AUTH_BASE}/accounts:signUp?key=${encodeURIComponent(config.apiKey)}`, {
    email: input.email,
    password: input.password,
    displayName: input.fullName,
    returnSecureToken: true,
  })
  const tokens = {
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    expiresAt: Date.now() + 3600_000,
    uid: result.localId,
    email: result.email,
  }
  writeTokens(tokens)
  return tokens
}

export async function firebaseSignIn(input: {
  email: string
  password: string
}): Promise<FirebaseTokens> {
  const config = getFirebaseConfig()
  if (!config) throw new Error('Firebase is not configured.')
  const result = await postJson<{
    idToken: string
    refreshToken: string
    localId: string
    email: string
  }>(`${AUTH_BASE}/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`, {
    email: input.email,
    password: input.password,
    returnSecureToken: true,
  })
  const tokens = {
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    expiresAt: Date.now() + 3600_000,
    uid: result.localId,
    email: result.email,
  }
  writeTokens(tokens)
  return tokens
}

/** Refreshes the stored id token if it has expired (or is close to expiring). */
export async function refreshTokensIfNeeded(): Promise<FirebaseTokens | null> {
  const config = getFirebaseConfig()
  const tokens = readTokens()
  if (!config || !tokens || !isExpired(tokens)) return tokens
  try {
    const result = await postJson<{ id_token: string; refresh_token: string; expires_in: string }>(
      `${TOKEN_BASE}/token?key=${encodeURIComponent(config.apiKey)}`,
      { grant_type: 'refresh_token', refresh_token: tokens.refreshToken },
    )
    const next = {
      idToken: result.id_token,
      refreshToken: result.refresh_token || tokens.refreshToken,
      expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000,
      uid: tokens.uid,
      email: tokens.email,
    }
    writeTokens(next)
    return next
  } catch {
    return tokens
  }
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  const config = getFirebaseConfig()
  if (!config) throw new Error('Firebase is not configured.')
  await postJson<unknown>(`${AUTH_BASE}/accounts:sendOobCode?key=${encodeURIComponent(config.apiKey)}`, {
    requestType: 'PASSWORD_RESET',
    email,
  })
}

export function firebaseLogout(): void {
  writeTokens(null)
}

export function getStoredFirebaseTokens(): FirebaseTokens | null {
  return readTokens()
}

/* -------------------------------- roles --------------------------------- */
/* The user's role (patient/doctor) is kept in a Firestore document when the
 * project has Firestore enabled. When it does not, we fall back to a local
 * per-device cache keyed by uid so the app still behaves correctly. */

export interface FirebaseUserRecord {
  role: UserRole | null
  fullName: string | null
}

export async function firebaseFetchRole(uid: string): Promise<FirebaseUserRecord | null> {
  const config = getFirebaseConfig()
  const tokens = await refreshTokensIfNeeded()
  if (!config?.projectId || !tokens) return null
  try {
    const url = `${FIRESTORE_BASE}/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}?key=${encodeURIComponent(config.apiKey)}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.idToken}` },
    })
    if (!response.ok) return null
    const data = (await response.json()) as {
      fields?: { role?: { stringValue?: string }; fullName?: { stringValue?: string } }
    }
    const role = data.fields?.role?.stringValue
    const fullName = data.fields?.fullName?.stringValue ?? null
    return {
      role: role === 'doctor' || role === 'patient' ? role : null,
      fullName,
    }
  } catch {
    return null
  }
}

export async function firebaseSaveRole(
  uid: string,
  role: UserRole,
  fullName: string,
  email: string,
): Promise<boolean> {
  const config = getFirebaseConfig()
  const tokens = await refreshTokensIfNeeded()
  if (!config?.projectId || !tokens) return false
  try {
    const base = `${FIRESTORE_BASE}/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`
    const url = `${base}?key=${encodeURIComponent(config.apiKey)}&updateMask.fieldPaths=role&updateMask.fieldPaths=fullName&updateMask.fieldPaths=email`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          role: { stringValue: role },
          fullName: { stringValue: fullName },
          email: { stringValue: email },
        },
      }),
    })
    return response.ok
  } catch {
    return false
  }
}