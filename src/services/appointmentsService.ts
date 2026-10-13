import type {
  Appointment,
  AppointmentMode,
  AppointmentStatus,
  Medication,
  MedicationStatus,
} from '@/types/health'
import { uid } from '@/utils/formatters'

/* ------------------------------------------------------------------ *
 * Appointments
 * ------------------------------------------------------------------ */

export interface NewAppointmentInput {
  title: string
  provider: string
  specialty: string
  date: string
  durationMinutes: number
  mode: AppointmentMode
  location?: string
  notes?: string
  status?: AppointmentStatus
}

export function createAppointment(input: NewAppointmentInput): Appointment {
  return {
    id: uid('apt'),
    title: input.title.trim(),
    provider: input.provider.trim(),
    specialty: input.specialty.trim(),
    date: input.date,
    durationMinutes: input.durationMinutes,
    mode: input.mode,
    location: input.location?.trim() || (input.mode === 'video' ? 'Secure video visit' : 'To be confirmed'),
    status: input.status ?? 'scheduled',
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
}

export function sortAppointments(appointments: Appointment[], order: 'asc' | 'desc'): Appointment[] {
  const direction = order === 'asc' ? 1 : -1
  return [...appointments].sort(
    (a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction,
  )
}

export interface AppointmentBuckets {
  upcoming: Appointment[]
  past: Appointment[]
}

export function splitAppointments(appointments: Appointment[], now = new Date()): AppointmentBuckets {
  const upcoming: Appointment[] = []
  const past: Appointment[] = []

  appointments.forEach((appointment) => {
    const isFuture = new Date(appointment.date).getTime() >= now.getTime()
    if (isFuture && appointment.status === 'scheduled') upcoming.push(appointment)
    else past.push(appointment)
  })

  return {
    upcoming: sortAppointments(upcoming, 'asc'),
    past: sortAppointments(past, 'desc'),
  }
}

export function filterAppointments(
  appointments: Appointment[],
  filters: { search?: string; status?: AppointmentStatus | 'all'; mode?: AppointmentMode | 'all' },
): Appointment[] {
  const search = (filters.search ?? '').trim().toLowerCase()
  return appointments.filter((appointment) => {
    if (filters.status && filters.status !== 'all' && appointment.status !== filters.status) return false
    if (filters.mode && filters.mode !== 'all' && appointment.mode !== filters.mode) return false
    if (search) {
      const haystack = [appointment.title, appointment.provider, appointment.specialty, appointment.location]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

/** Next scheduled appointment, used by the dashboard and AI context. */
export function nextAppointment(appointments: Appointment[]): Appointment | undefined {
  return splitAppointments(appointments).upcoming[0]
}

/* ------------------------------------------------------------------ *
 * Medications
 * ------------------------------------------------------------------ */

export interface NewMedicationInput {
  name: string
  dosage: string
  frequency: string
  prescriber: string
  startDate: string
  endDate?: string
  status: MedicationStatus
  notes?: string
}

export function createMedication(input: NewMedicationInput): Medication {
  return {
    id: uid('med'),
    name: input.name.trim(),
    dosage: input.dosage.trim(),
    frequency: input.frequency.trim(),
    prescriber: input.prescriber.trim(),
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    status: input.status,
    notes: input.notes?.trim() || undefined,
    takenToday: false,
    history: [],
  }
}

export function filterMedications(
  medications: Medication[],
  filters: { search?: string; status?: MedicationStatus | 'all' },
): Medication[] {
  const search = (filters.search ?? '').trim().toLowerCase()
  return medications.filter((medication) => {
    if (filters.status && filters.status !== 'all' && medication.status !== filters.status) return false
    if (search) {
      const haystack = [medication.name, medication.dosage, medication.prescriber, medication.notes ?? '']
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

/** Records a "taken" dose for the medication tracker and updates the day flag. */
export function markMedicationTaken(medication: Medication): Medication {
  const now = new Date().toISOString()
  if (medication.takenToday) {
    // Undo today's most recent dose.
    const [latest, ...rest] = [...medication.history].sort(
      (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
    )
    return {
      ...medication,
      takenToday: false,
      lastTakenAt: rest[0]?.takenAt,
      history: latest ? medication.history.filter((entry) => entry.id !== latest.id) : medication.history,
    }
  }
  return {
    ...medication,
    takenToday: true,
    lastTakenAt: now,
    history: [...medication.history, { id: uid('dose'), takenAt: now }],
  }
}

export function activeMedicationCount(medications: Medication[]): number {
  return medications.filter((medication) => medication.status === 'active').length
}
