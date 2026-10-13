import type { AppointmentMode } from '@/types/health'
import type { AppointmentRequest, Doctor } from '@/types/practice'
import { practiceRequestsFor } from './appointmentRequestsService'

/* ------------------------------------------------------------------ *
 * Doctor-side schedule rows
 *
 * A practice calendar row can come from two places:
 *  - the static sample roster (`PracticePatient.appointments`), or
 *  - an appointment request the doctor accepted (delivered to the
 *    patient's calendar, and mirrored here so the doctor sees the visit).
 * ------------------------------------------------------------------ */

export interface DoctorVisitAppointment {
  id: string
  title: string
  date: string
  mode: AppointmentMode
  status: 'scheduled' | 'completed' | 'cancelled'
  location: string
}

export interface DoctorVisit {
  patientId: string
  patientName: string
  avatarColor: string
  appointment: DoctorVisitAppointment
  /** True when this visit came from an accepted appointment request. */
  fromRequest: boolean
}

/**
 * Converts a doctor's accepted requests into scheduled visits. Each accepted
 * request becomes one calendar row for that doctor, matching the appointment
 * the patient received. Directory clinicians see the whole practice inbox, so
 * any accepted application (to any directory doctor) is mirrored here.
 */
export function acceptedRequestVisits(
  requests: AppointmentRequest[],
  doctor: Doctor | null | undefined,
): DoctorVisit[] {
  return practiceRequestsFor(requests, doctor)
    .filter((request) => request.status === 'accepted')
    .map((request) => ({
      patientId: request.patientId,
      patientName: request.patientName,
      avatarColor: '#64748b',
      appointment: {
        id: request.id,
        title: request.title,
        date: request.date,
        mode: request.mode,
        status: 'scheduled' as const,
        location: request.location || request.mode,
      },
      fromRequest: true,
    }))
}

/** Merges roster visits with accepted-request visits, deduped by appointment id. */
export function mergeDoctorVisits(
  roster: DoctorVisit[],
  requestVisits: DoctorVisit[],
): DoctorVisit[] {
  const seen = new Set(roster.map((visit) => visit.appointment.id))
  return [...roster, ...requestVisits.filter((visit) => !seen.has(visit.appointment.id))]
}