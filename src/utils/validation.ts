import { z } from 'zod'

/**
 * Shared Zod schemas. Kept framework-agnostic so they can be reused by forms
 * (via @hookform/resolvers) and by service-layer guards.
 */

// A deliberately simple, version-agnostic email check (Zod v4 deprecates
// `z.string().email()`, and this avoids the deprecation warning entirely).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address')

const strongEnoughPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Password is too long')

export const loginSchema = z.object({
  role: z.enum(['patient', 'doctor'], { message: 'Choose whether you are a patient or a doctor' }),
  email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    email,
    password: strongEnoughPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(['patient', 'doctor'], { message: 'Choose whether you are a patient or a doctor' }),
    acceptTerms: z
      .boolean()
      .refine((value) => value === true, 'You must agree to the Terms of Service to continue'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type SignupValues = z.infer<typeof signupSchema>

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  email,
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .regex(/^[+()\-\s\d]*$/, 'Use digits, spaces and + ( ) - only')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || new Date(value) <= new Date(), 'Date of birth cannot be in the future'),
  preferredLanguage: z.string().min(1, 'Choose a language'),
  timeZone: z.string().min(1, 'Choose a time zone'),
  emergencyContactName: z.string().trim().max(80).optional().or(z.literal('')),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+()\-\s\d]*$/, 'Use digits, spaces and + ( ) - only')
    .optional()
    .or(z.literal('')),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const appointmentSchema = z.object({
  title: z.string().trim().min(2, 'Give the appointment a title').max(90),
  doctorId: z.string().optional(),
  provider: z.string().trim().min(2, 'Enter the provider name').max(80),
  specialty: z.string().trim().min(2, 'Enter a specialty').max(60),
  date: z.string().min(1, 'Pick a date and time'),
  durationMinutes: z
    .number()
    .int('Use whole minutes')
    .min(10, 'At least 10 minutes')
    .max(240, 'At most 240 minutes'),
  mode: z.enum(['in-person', 'video', 'phone']),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})
export type AppointmentValues = z.infer<typeof appointmentSchema>
export type AppointmentInput = z.input<typeof appointmentSchema>

export const appointmentRequestSchema = z.object({
  title: z.string().trim().min(2, 'Give the appointment a title').max(90),
  date: z.string().min(1, 'Pick a date and time'),
  durationMinutes: z
    .number()
    .int('Use whole minutes')
    .min(10, 'At least 10 minutes')
    .max(240, 'At most 240 minutes'),
  mode: z.enum(['in-person', 'video', 'phone']),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  doctorIds: z.array(z.string()).min(1, 'Choose at least one doctor'),
})
export type AppointmentRequestValues = z.infer<typeof appointmentRequestSchema>
export type AppointmentRequestFormInput = z.input<typeof appointmentRequestSchema>

export const medicationSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter the medication name').max(80),
    dosage: z.string().trim().min(1, 'Enter the dosage as prescribed').max(40),
    frequency: z.string().trim().min(1, 'Enter the frequency').max(60),
    prescriber: z.string().trim().min(2, 'Enter the prescribing clinician').max(80),
    startDate: z.string().min(1, 'Choose a start date'),
    endDate: z.string().optional().or(z.literal('')),
    status: z.enum(['active', 'completed', 'paused']),
    notes: z.string().trim().max(300).optional().or(z.literal('')),
  })
  .refine(
    (values) => !values.endDate || !values.startDate || values.endDate >= values.startDate,
    { message: 'End date must be after the start date', path: ['endDate'] },
  )
export type MedicationValues = z.infer<typeof medicationSchema>

/**
 * A clinician writing a prescription for one of their patients. The patient is
 * chosen from a dropdown; medication details mirror the patient-facing fields.
 */
export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Choose a patient'),
  name: z.string().trim().min(2, 'Enter the medication name').max(80),
  dosage: z.string().trim().min(1, 'Enter the dosage as prescribed').max(40),
  frequency: z.string().trim().min(1, 'Enter the frequency').max(60),
  startDate: z.string().min(1, 'Choose a start date'),
  status: z.enum(['active', 'completed', 'paused']),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
})
export type PrescriptionValues = z.infer<typeof prescriptionSchema>

export const goalSchema = z.object({
  title: z.string().trim().min(2, 'Give the goal a name').max(60),
  kind: z.enum(['steps', 'sleep', 'hydration', 'activity', 'custom']),
  unit: z.string().trim().min(1, 'Add a unit').max(20),
  target: z.number().positive('Target must be greater than zero').max(1_000_000),
  current: z.number().min(0, 'Progress cannot be negative').max(1_000_000),
  period: z.enum(['daily', 'weekly']),
})
export type GoalValues = z.infer<typeof goalSchema>
export type GoalInput = z.input<typeof goalSchema>

export const uploadMetadataSchema = z.object({
  title: z.string().trim().min(2, 'Give the record a title').max(90),
  category: z.enum([
    'lab-report',
    'prescription',
    'discharge-summary',
    'imaging',
    'consultation-note',
    'vaccination',
    'other',
  ]),
  provider: z.string().trim().min(2, 'Enter the provider or facility').max(90),
  date: z.string().min(1, 'Choose the record date'),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
})
export type UploadMetadataValues = z.infer<typeof uploadMetadataSchema>
