/**
 * Practice (doctor-side) domain model.
 *
 * A practice is the fictional group of patients a doctor account sees in the
 * portal. All data here is fictional sample data — it is not real patient
 * information.
 */

import type { Appointment, AppointmentMode, MedicalRecord, Medication } from './health'

export interface PracticePatient {
  id: string
  fullName: string
  email: string
  /** ISO date, yyyy-mm-dd */
  dateOfBirth: string
  phone: string
  bloodType: string
  avatarColor: string
  /** Active medical conditions, in plain language. */
  conditions: string[]
  allergies: string[]
  /** Primary point of contact for this patient. */
  primaryPhysician: string
  /** ISO date, yyyy-mm-dd — most recent visit. */
  lastVisit: string
  records: MedicalRecord[]
  medications: Medication[]
  appointments: Appointment[]
}

/**
 * A clinician a patient can send an appointment request to. This is a
 * fictional directory used by the demo — not a register of real doctors.
 */
export interface Doctor {
  id: string
  name: string
  specialty: string
  email: string
  location: string
  avatarColor: string
  /** Short plain-language description shown when choosing a doctor. */
  bio: string
}

/**
 * A medical record a patient has uploaded and made visible to their care
 * team. Records are scoped to the patient's own library, so a copy is kept in
 * the shared care collection for clinicians to review. When a clinician marks
 * it reviewed, the patient is notified.
 */
export interface PatientRecordShare {
  id: string
  record: MedicalRecord
  /** Storage scope id of the patient's own collections (the key we notify). */
  patientId: string
  patientName: string
  patientEmail: string
  sharedAt: string
  reviewedAt?: string
  /** Display name of the clinician who reviewed it. */
  reviewedBy?: string
}

/**
 * A prescription written by a clinician for one of their patients. Unlike a
 * patient's own medicine list, prescriptions can only be created on the doctor
 * side, then delivered into the patient's list.
 */
export interface Prescription {
  id: string
  /** Storage scope id of the patient's own collections. */
  patientId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  medication: Medication
  issuedAt: string
}

export type AppointmentRequestStatus = 'pending' | 'accepted' | 'cancelled'

/**
 * A patient's application for an appointment with a specific doctor.
 *
 * One application is created per selected doctor, so a patient who applies to
 * three doctors generates three requests. A doctor can accept or cancel each
 * request, and the decision is delivered to the patient as a notification.
 */
export interface AppointmentRequest {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  title: string
  /** ISO datetime the patient asked for. */
  date: string
  durationMinutes: number
  mode: AppointmentMode
  location: string
  notes?: string
  status: AppointmentRequestStatus
  createdAt: string
  /** When the doctor accepted or cancelled the request. */
  decidedAt?: string
  /** Optional note the doctor left alongside the decision. */
  decisionNote?: string
  /** Appointment created in the patient's calendar when the request is accepted. */
  appointmentId?: string
}