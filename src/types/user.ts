/**
 * User, profile and preference models.
 *
 * NOTE: this is a frontend application. Nothing in these types should be used
 * for confidential production medical data — see README for security notes.
 */

export type UserRole = 'patient' | 'doctor'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  /** ISO date (yyyy-mm-dd). Optional — never required. */
  dateOfBirth?: string
  preferredLanguage: string
  timeZone: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  /** Deterministic avatar tint, used when no image is present. */
  avatarColor: string
  createdAt: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface NotificationPreferences {
  appointmentReminders: boolean
  medicationReminders: boolean
  wellnessReminders: boolean
  productAnnouncements: boolean
}

export interface HealthPreferences {
  units: 'metric' | 'imperial'
  language: string
  timeZone: string
  trackWellness: boolean
}

export interface AiPreferences {
  assistantEnabled: boolean
  /** Explicit consent flag before any future external AI processing. */
  consentToExternalProcessing: boolean
}

export interface AccessibilityPreferences {
  reduceMotion: boolean
  largeText: boolean
  highContrastLinks: boolean
}

export interface AppPreferences {
  theme: ThemePreference
  notifications: NotificationPreferences
  health: HealthPreferences
  ai: AiPreferences
  accessibility: AccessibilityPreferences
}

export interface AuthSession {
  userId: string
  fullName: string
  email: string
  /** Whether the account belongs to a patient or a clinician. */
  role: UserRole
  /** 'firebase' when backed by Firebase Authentication, 'local' otherwise. */
  provider: 'firebase' | 'local'
  startedAt: string
}
