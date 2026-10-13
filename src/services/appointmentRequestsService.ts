import type { AppointmentMode } from '@/types/health'
import type { AppointmentRequest, AppointmentRequestStatus, Doctor } from '@/types/practice'
import { doctorById } from '@/data/doctorsData'
import { uid } from '@/utils/formatters'

/* ------------------------------------------------------------------ *
 * Appointment requests ("applications")
 *
 * A patient applies to one or more doctors. One request is created per
 * selected doctor. Each doctor may accept or cancel their copy, which is
 * what drives the patient notification and the doctor's counters.
 * ------------------------------------------------------------------ */

export interface NewAppointmentRequestInput {
  patientId: string
  patientName: string
  patientEmail: string
  /** One request is created for each doctor id. */
  doctorIds: string[]
  title: string
  /** Requested slot — ISO datetime or a `datetime-local` value. */
  date: string
  durationMinutes: number
  mode: AppointmentMode
  location?: string
  notes?: string
}

/** Builds one pending request per selected doctor (unknown ids are ignored). */
export function createAppointmentRequests(input: NewAppointmentRequestInput): AppointmentRequest[] {
  const createdAt = new Date().toISOString()
  const title = input.title.trim()
  const notes = input.notes?.trim() || undefined

  return input.doctorIds
    .map((id) => doctorById(id))
    .filter((doctor): doctor is Doctor => Boolean(doctor))
    .map((doctor) => ({
      id: uid('req'),
      patientId: input.patientId,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      title,
      date: input.date,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      location:
        input.location?.trim() || (input.mode === 'video' ? 'Secure video visit' : doctor.location),
      notes,
      status: 'pending' as const,
      createdAt,
    }))
}

export interface AppointmentRequestCounts {
  total: number
  pending: number
  accepted: number
  cancelled: number
}

/** Counts by status — powers the doctor's accepted / cancelled / pending badges. */
export function appointmentRequestCounts(
  requests: AppointmentRequest[],
): AppointmentRequestCounts {
  const counts: AppointmentRequestCounts = { total: requests.length, pending: 0, accepted: 0, cancelled: 0 }
  requests.forEach((request) => {
    counts[request.status] += 1
  })
  return counts
}

export function sortRequests(
  requests: AppointmentRequest[],
  order: 'asc' | 'desc' = 'asc',
): AppointmentRequest[] {
  const direction = order === 'asc' ? 1 : -1
  return [...requests].sort(
    (a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction,
  )
}

/** Requests a patient submitted, newest first. */
export function requestsForPatient(
  requests: AppointmentRequest[],
  patientId: string | undefined,
): AppointmentRequest[] {
  if (!patientId) return []
  return [...requests]
    .filter((request) => request.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Requests addressed to a doctor, newest first. */
export function requestsForDoctor(
  requests: AppointmentRequest[],
  doctorId: string | undefined,
): AppointmentRequest[] {
  if (!doctorId) return []
  return [...requests]
    .filter((request) => request.doctorId === doctorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * The practice inbox. In this demo the shared request pool IS the practice:
 * a signed-in clinician sees every application (each one clearly labelled
 * with the doctor it targets), so a request the patient sends always shows
 * up in the doctor portal — no matter which directory doctor it was aimed
 * at. Non-directory (self-registered) doctors get no inbox, because patients
 * can only apply to directory clinicians.
 */
export function practiceRequestsFor(
  requests: AppointmentRequest[],
  doctor: Doctor | null | undefined,
): AppointmentRequest[] {
  return doctor ? requests : []
}

/** Applies a doctor's decision to a request. */
export function decideRequest(
  request: AppointmentRequest,
  decision: Extract<AppointmentRequestStatus, 'accepted' | 'cancelled'>,
  note?: string,
): AppointmentRequest {
  return {
    ...request,
    status: decision,
    decidedAt: new Date().toISOString(),
    decisionNote: note?.trim() || undefined,
  }
}
