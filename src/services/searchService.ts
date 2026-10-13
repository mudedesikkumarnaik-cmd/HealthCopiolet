import type { Appointment, MedicalRecord, Medication } from '@/types/health'
import { categoryLabel } from './recordsService'
import { formatDate, formatDateTime } from '@/utils/formatters'

export type SearchResultKind = 'record' | 'appointment' | 'medication'

export interface SearchResult {
  id: string
  kind: SearchResultKind
  kindLabel: string
  title: string
  subtitle: string
  to: string
}

const MAX_PER_KIND = 5

/**
 * Client-side search across the dataset the user can currently see.
 * Scoped deliberately: it never calls an external service.
 */
export const dataSearchService = {
  search(
    query: string,
    data: { records: MedicalRecord[]; appointments: Appointment[]; medications: Medication[] },
  ): SearchResult[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return []

    const matches = (values: Array<string | undefined>) =>
      values.filter(Boolean).join(' ').toLowerCase().includes(needle)

    const records: SearchResult[] = data.records
      .filter((record) =>
        matches([record.title, record.provider, record.notes, ...(record.tags ?? []), categoryLabel(record.category)]),
      )
      .slice(0, MAX_PER_KIND)
      .map((record) => ({
        id: `record-${record.id}`,
        kind: 'record' as const,
        kindLabel: 'Record',
        title: record.title,
        subtitle: `${categoryLabel(record.category)} · ${record.provider} · ${formatDate(record.date)}`,
        to: '/records',
      }))

    const appointments: SearchResult[] = data.appointments
      .filter((appointment) =>
        matches([
          appointment.title,
          appointment.provider,
          appointment.specialty,
          appointment.location,
          appointment.notes,
        ]),
      )
      .slice(0, MAX_PER_KIND)
      .map((appointment) => ({
        id: `appointment-${appointment.id}`,
        kind: 'appointment' as const,
        kindLabel: 'Appointment',
        title: appointment.title,
        subtitle: `${appointment.provider} · ${formatDateTime(appointment.date)}`,
        to: '/appointments',
      }))

    const medications: SearchResult[] = data.medications
      .filter((medication) =>
        matches([medication.name, medication.dosage, medication.prescriber, medication.notes]),
      )
      .slice(0, MAX_PER_KIND)
      .map((medication) => ({
        id: `medication-${medication.id}`,
        kind: 'medication' as const,
        kindLabel: 'Medication',
        title: medication.name,
        subtitle: `${medication.dosage} · ${medication.frequency} · ${medication.prescriber}`,
        to: '/prescriptions',
      }))

    return [...records, ...appointments, ...medications]
  },
}
