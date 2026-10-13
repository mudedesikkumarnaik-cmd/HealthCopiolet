import type { AppPreferences, UserProfile } from '@/types/user'

/**
 * Seed profile for the built-in patient persona (patient@healthcopilot.app).
 * Other issued accounts keep their own profile details.
 */
export const DEMO_PROFILE: UserProfile = {
  id: 'user_sample_patient',
  fullName: 'Alex Morgan',
  email: 'patient@healthcopilot.app',
  phone: '+91 98765 43210',
  dateOfBirth: '1989-04-12',
  preferredLanguage: 'English (India)',
  timeZone: 'Asia/Kolkata',
  emergencyContactName: 'Jordan Morgan',
  emergencyContactPhone: '+91 98765 43211',
  avatarColor: '#0d9488',
  createdAt: '2024-01-08T09:00:00.000Z',
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'light',
  notifications: {
    appointmentReminders: true,
    medicationReminders: true,
    wellnessReminders: false,
    productAnnouncements: false,
  },
  health: {
    units: 'metric',
    language: 'English (India)',
    timeZone: 'Asia/Kolkata',
    trackWellness: true,
  },
  ai: {
    assistantEnabled: true,
    consentToExternalProcessing: false,
  },
  accessibility: {
    reduceMotion: false,
    largeText: false,
    highContrastLinks: false,
  },
}

export const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'English (India)',
  'Español',
  'Français',
  'Deutsch',
  'Português',
  'हिन्दी',
  'తెలుగు',
  'தமிழ்',
  '日本語',
] as const

export const TIME_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
] as const
