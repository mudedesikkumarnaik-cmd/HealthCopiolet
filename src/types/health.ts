/**
 * Health domain models.
 *
 * All sample values are FICTIONAL. They are not readings from any
 * medical device and are not a diagnosis or clinical assessment.
 */

export type MetricKind = 'heartRate' | 'bloodPressure' | 'sleep' | 'steps' | 'weight'

export type TrendDirection = 'up' | 'down' | 'flat'

export interface HealthMetric {
  id: MetricKind
  label: string
  /** Primary value (for blood pressure this is the systolic value). */
  value: number
  unit: string
  /** Secondary value, e.g. diastolic blood pressure. */
  secondaryValue?: number
  secondaryUnit?: string
  precision: number
  /** Percentage change versus the previous comparison period. */
  changePct: number
  trend: TrendDirection
  /**
   * Which direction is generally considered favourable. Used only to colour a
   * trend chip — never to give medical advice.
   */
  goalDirection: 'higher-is-better' | 'lower-is-better' | 'neutral'
  description: string
  /** Short educational note about what the metric represents. */
  explanation: string
}

export interface DailySample {
  /** ISO date, yyyy-mm-dd */
  date: string
  heartRate: number
  systolic: number
  diastolic: number
  sleepHours: number
  steps: number
  weightKg: number
}

export type RecordCategory =
  | 'lab-report'
  | 'prescription'
  | 'discharge-summary'
  | 'imaging'
  | 'consultation-note'
  | 'vaccination'
  | 'other'

export type RecordFileType = 'pdf' | 'png' | 'jpeg'

export interface MedicalRecord {
  id: string
  title: string
  category: RecordCategory
  provider: string
  /** ISO date, yyyy-mm-dd */
  date: string
  fileType: RecordFileType
  fileName: string
  fileSizeKb: number
  notes?: string
  tags: string[]
  /**
   * Plain-language summary. For seeded sample records this is authored sample
   * copy. For user uploads nothing is analysed — `isDemoPreview` is true and
   * the UI labels it "metadata only".
   */
  summary?: string
  isDemoPreview: boolean
  createdAt: string
}

export type MedicationStatus = 'active' | 'completed' | 'paused'

export interface MedicationDoseLog {
  id: string
  takenAt: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescriber: string
  /** ISO date, yyyy-mm-dd */
  startDate: string
  endDate?: string
  status: MedicationStatus
  notes?: string
  takenToday: boolean
  lastTakenAt?: string
  history: MedicationDoseLog[]
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'
export type AppointmentMode = 'in-person' | 'video' | 'phone'

export interface Appointment {
  id: string
  title: string
  provider: string
  specialty: string
  /** ISO datetime */
  date: string
  durationMinutes: number
  mode: AppointmentMode
  location: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}

export type GoalKind = 'steps' | 'sleep' | 'hydration' | 'activity' | 'custom'

export interface WellnessGoal {
  id: string
  kind: GoalKind
  title: string
  unit: string
  target: number
  current: number
  period: 'daily' | 'weekly'
  isCustom: boolean
  createdAt: string
}

export interface Habit {
  id: string
  label: string
  /** Lucide icon name rendered by the habit tracker. */
  icon: string
  completedDates: string[]
}

export type NotificationKind = 'appointment' | 'medication' | 'wellness' | 'system'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  message: string
  createdAt: string
  read: boolean
  link?: string
}

export type ChatRole = 'user' | 'assistant'

/** A photo attached to a chat message (taken with the camera or picked from the gallery). */
export interface ChatAttachment {
  /** Compressed data-URL preview kept inside the conversation. */
  dataUrl: string
  /** Original file name when uploaded from the gallery. */
  name: string
  kind: 'camera' | 'photo'
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  /** True when the response came from the built-in assistant. */
  isDemo: boolean
  /** True while the assistant is "typing". */
  pending?: boolean
  /** True when generation failed. */
  error?: boolean
  /** Optional photo shared with the assistant. */
  attachment?: ChatAttachment
}

export interface ChatThread {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export type AnalyticsPeriod = 7 | 30 | 90
