import type { Appointment, AppNotification } from '@/types/health'
import type { AppointmentRequest, AppointmentRequestStatus } from '@/types/practice'
import { demoAppointments } from '@/data/demoAppointments'
import { demoNotifications } from '@/data/demoNotifications'
import { samplePersonaFor } from '@/services/authService'
import { STORAGE_KEYS, storageService } from '@/services/storageService'
import { uid } from '@/utils/formatters'

/**
 * Delivers the result of a doctor's decision to the patient's own account.
 *
 * Data on this device is stored per account (`appointments:<userId>`,
 * `notifications:<userId>`), so when a doctor accepts or cancels a request the
 * patient's keys are updated directly. The patient sees the change the next
 * time their workspace loads.
 *
 * When a key does not exist yet we fall back to the same seeded sample data
 * the patient would otherwise start with, so an early decision never wipes the
 * sample appointments or notifications.
 */

const isArray = <T,>(value: unknown): value is T[] => Array.isArray(value)

function appointmentsKey(patientId: string): string {
  return `${STORAGE_KEYS.appointments}:${patientId}`
}

function notificationsKey(patientId: string): string {
  return `${STORAGE_KEYS.notifications}:${patientId}`
}

function seedAppointments(patientEmail: string): Appointment[] {
  return samplePersonaFor(patientEmail) === 'patient' ? demoAppointments : []
}

function seedNotifications(patientEmail: string): AppNotification[] {
  return samplePersonaFor(patientEmail) === 'patient' ? demoNotifications : []
}

/** Turns an accepted request into a scheduled appointment for the patient. */
export function buildAppointmentFromRequest(request: AppointmentRequest): Appointment {
  return {
    id: uid('apt'),
    title: request.title,
    provider: request.doctorName,
    specialty: request.specialty,
    date: request.date,
    durationMinutes: request.durationMinutes,
    mode: request.mode,
    location: request.location,
    status: 'scheduled',
    notes: request.notes,
    createdAt: new Date().toISOString(),
  }
}

function buildDecisionNotification(
  request: AppointmentRequest,
  decision: Extract<AppointmentRequestStatus, 'accepted' | 'cancelled'>,
): AppNotification {
  const when = new Date(request.date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return decision === 'accepted'
    ? {
        id: uid('notif'),
        kind: 'appointment',
        title: `Appointment confirmed — ${request.doctorName}`,
        message: `${request.title} is booked for ${when}.`,
        createdAt: new Date().toISOString(),
        read: false,
        link: '/appointments',
      }
    : {
        id: uid('notif'),
        kind: 'appointment',
        title: `Request cancelled — ${request.doctorName}`,
        message: `${request.title} for ${when} could not be accepted.${
          request.decisionNote ? ` ${request.decisionNote}` : ''
        }`,
        createdAt: new Date().toISOString(),
        read: false,
        link: '/appointments',
      }
}

export interface DeliveryResult {
  /** The appointment added to the patient's calendar (accepted requests only). */
  appointment?: Appointment
  notification: AppNotification
}

/**
 * Writes the outcome of a decision into the patient's account: an appointment
 * (when accepted) and an in-app notification. Returns what was created so the
 * caller can link the request to its appointment.
 */
export function deliverDecisionToPatient(
  request: AppointmentRequest,
  decision: Extract<AppointmentRequestStatus, 'accepted' | 'cancelled'>,
): DeliveryResult {
  let appointment: Appointment | undefined

  if (decision === 'accepted') {
    appointment = buildAppointmentFromRequest(request)
    const key = appointmentsKey(request.patientId)
    const existing = storageService.readJSON<Appointment[]>(key, seedAppointments(request.patientEmail), isArray<Appointment>)
    storageService.writeJSON(key, [appointment, ...existing])
  }

  const notification = buildDecisionNotification(request, decision)
  const key = notificationsKey(request.patientId)
  const existing = storageService.readJSON<AppNotification[]>(
    key,
    seedNotifications(request.patientEmail),
    isArray<AppNotification>,
  )
  storageService.writeJSON(key, [notification, ...existing])

  return { appointment, notification }
}
