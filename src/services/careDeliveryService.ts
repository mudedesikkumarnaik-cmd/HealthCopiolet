import type { AppNotification, Medication } from '@/types/health'
import type { PatientRecordShare, Prescription } from '@/types/practice'
import { createMedication } from '@/services/appointmentsService'
import type { NewMedicationInput } from '@/services/appointmentsService'
import { demoMedications } from '@/data/demoAppointments'
import { demoNotifications } from '@/data/demoNotifications'
import { samplePersonaFor } from '@/services/authService'
import { STORAGE_KEYS, storageService } from '@/services/storageService'
import { uid } from '@/utils/formatters'

/**
 * Delivery from the doctor side into a patient's own account.
 *
 * Like appointment decisions, this data is stored per account
 * (`medications:<userId>`, `notifications:<userId>`), so when a clinician
 * issues a prescription or reviews a report the patient's keys are updated
 * directly. The patient sees the change the next time their workspace loads.
 *
 * When a key does not exist yet we fall back to the same seeded sample data
 * the patient would otherwise start with, so early delivery never wipes the
 * sample medicines or notifications.
 */

const isArray = <T,>(value: unknown): value is T[] => Array.isArray(value)

function scopedKey(key: string, patientId: string): string {
  return `${key}:${patientId}`
}

function seedMedicationsFor(patientEmail: string): Medication[] {
  return samplePersonaFor(patientEmail) === 'patient' ? demoMedications : []
}

function seedNotificationsFor(patientEmail: string): AppNotification[] {
  return samplePersonaFor(patientEmail) === 'patient' ? demoNotifications : []
}

/** Appends one notification to a patient's account. */
function deliverNotification(patientId: string, patientEmail: string, notification: AppNotification): void {
  const key = scopedKey(STORAGE_KEYS.notifications, patientId)
  const existing = storageService.readJSON<AppNotification[]>(
    key,
    seedNotificationsFor(patientEmail),
    isArray<AppNotification>,
  )
  storageService.writeJSON(key, [notification, ...existing])
}

export interface PrescribeInput {
  /** Storage scope id of the patient whose list the medication lands in. */
  patientId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  medication: NewMedicationInput
}

/** Builds the prescription record from a doctor's form submission. */
export function buildPrescription(input: PrescribeInput): Prescription {
  return {
    id: uid('rx'),
    patientId: input.patientId,
    patientName: input.patientName,
    patientEmail: input.patientEmail,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    specialty: input.specialty,
    medication: createMedication(input.medication),
    issuedAt: new Date().toISOString(),
  }
}

/**
 * Writes a prescription into the patient's own medicine list and notifies
 * them. Returns the notification that was delivered.
 */
export function deliverPrescriptionToPatient(prescription: Prescription): AppNotification {
  const medKey = scopedKey(STORAGE_KEYS.medications, prescription.patientId)
  const existingMeds = storageService.readJSON<Medication[]>(
    medKey,
    seedMedicationsFor(prescription.patientEmail),
    isArray<Medication>,
  )
  storageService.writeJSON(medKey, [prescription.medication, ...existingMeds])

  const notification: AppNotification = {
    id: uid('notif'),
    kind: 'medication',
    title: `New prescription from ${prescription.doctorName}`,
    message: `${prescription.medication.name} ${prescription.medication.dosage} — ${prescription.medication.frequency}.`,
    createdAt: new Date().toISOString(),
    read: false,
    link: '/prescriptions',
  }
  deliverNotification(prescription.patientId, prescription.patientEmail, notification)
  return notification
}

/**
 * Tells a patient their uploaded report has been reviewed by a clinician.
 * Returns the notification that was delivered.
 */
export function deliverRecordSeenToPatient(
  share: PatientRecordShare,
  doctorName: string,
): AppNotification {
  const notification: AppNotification = {
    id: uid('notif'),
    kind: 'system',
    title: `Your report was reviewed by ${doctorName}`,
    message: `“${share.record.title}” has been seen by your care team.`,
    createdAt: new Date().toISOString(),
    read: false,
    link: '/records',
  }
  deliverNotification(share.patientId, share.patientEmail, notification)
  return notification
}
