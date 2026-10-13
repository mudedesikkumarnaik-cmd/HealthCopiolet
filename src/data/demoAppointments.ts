import type { Appointment, Medication } from '@/types/health'

function at(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

/** Fictional appointments. Nothing here is booked with a real clinic. */
export const demoAppointments: Appointment[] = [
  {
    id: 'apt_cardiology',
    title: 'Cardiology follow-up',
    provider: 'Dr. Mei Chen',
    specialty: 'Cardiology',
    date: at(3, 9, 30),
    durationMinutes: 30,
    mode: 'in-person',
    location: 'Riverside Cardiology Center, Suite 210',
    status: 'scheduled',
    notes: 'Bring the ECG report and a list of current medications.',
    createdAt: at(-14, 10),
  },
  {
    id: 'apt_primary',
    title: 'Primary care check-in',
    provider: 'Dr. Priya Raman',
    specialty: 'Family medicine',
    date: at(9, 14, 0),
    durationMinutes: 45,
    mode: 'video',
    location: 'Secure video visit',
    status: 'scheduled',
    notes: 'Review sleep routine and activity goals.',
    createdAt: at(-10, 15),
  },
  {
    id: 'apt_dental',
    title: 'Dental cleaning',
    provider: 'Dr. Samuel Okafor',
    specialty: 'Dentistry',
    date: at(24, 11, 15),
    durationMinutes: 40,
    mode: 'in-person',
    location: 'Brightwater Dental, 42 Elm Street',
    status: 'scheduled',
    createdAt: at(-20, 9),
  },
  {
    id: 'apt_labs',
    title: 'Blood draw appointment',
    provider: 'Northbridge Family Health',
    specialty: 'Laboratory',
    date: at(-5, 8, 15),
    durationMinutes: 15,
    mode: 'in-person',
    location: 'Northbridge Family Health, Ground floor',
    status: 'completed',
    notes: 'Fasting sample collected.',
    createdAt: at(-25, 8),
  },
  {
    id: 'apt_physio',
    title: 'Physiotherapy session',
    provider: 'Lena Fischer, PT',
    specialty: 'Physiotherapy',
    date: at(-18, 16, 30),
    durationMinutes: 50,
    mode: 'in-person',
    location: 'MoveWell Physiotherapy',
    status: 'completed',
    createdAt: at(-30, 12),
  },
  {
    id: 'apt_derma',
    title: 'Dermatology consult',
    provider: 'Dr. Alan Whitfield',
    specialty: 'Dermatology',
    date: at(-33, 13, 0),
    durationMinutes: 30,
    mode: 'in-person',
    location: 'Cedar Skin Clinic',
    status: 'cancelled',
    notes: 'Cancelled — rescheduling in the new year.',
    createdAt: at(-45, 10),
  },
]

/**
 * Fictional medications. The app never advises changing a dose — these are
 * sample entries only and are clearly labelled as such in the UI.
 */
export const demoMedications: Medication[] = [
  {
    id: 'med_lisinopril',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily, morning',
    prescriber: 'Dr. Mei Chen',
    startDate: isoDate(-120),
    status: 'active',
    notes: 'Sample entry — take as directed by your prescriber.',
    takenToday: true,
    lastTakenAt: at(0, 8, 5),
    history: [
      { id: 'dose_1', takenAt: at(0, 8, 5) },
      { id: 'dose_2', takenAt: at(-1, 8, 12) },
      { id: 'dose_3', takenAt: at(-2, 8, 2) },
    ],
  },
  {
    id: 'med_atorvastatin',
    name: 'Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once daily, evening',
    prescriber: 'Dr. Mei Chen',
    startDate: isoDate(-120),
    status: 'active',
    notes: 'Sample entry for illustration purposes.',
    takenToday: false,
    history: [
      { id: 'dose_4', takenAt: at(-1, 21, 30) },
      { id: 'dose_5', takenAt: at(-2, 21, 40) },
    ],
  },
  {
    id: 'med_vitd',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    frequency: 'Once daily, with food',
    prescriber: 'Dr. Priya Raman',
    startDate: isoDate(-240),
    status: 'active',
    notes: 'Over-the-counter supplement recorded by the user.',
    takenToday: true,
    lastTakenAt: at(0, 9, 0),
    history: [{ id: 'dose_6', takenAt: at(0, 9, 0) }],
  },
  {
    id: 'med_amoxicillin',
    name: 'Amoxicillin',
    dosage: '500 mg',
    frequency: 'Three times daily for 7 days',
    prescriber: 'Dr. Samuel Okafor',
    startDate: isoDate(-70),
    endDate: isoDate(-63),
    status: 'completed',
    notes: 'Short course completed. Sample entry.',
    takenToday: false,
    history: [],
  },
  {
    id: 'med_ibuprofen',
    name: 'Ibuprofen',
    dosage: '200 mg',
    frequency: 'As needed, max 3 times daily',
    prescriber: 'MoveWell Physiotherapy',
    startDate: isoDate(-40),
    status: 'paused',
    notes: 'Paused by the user. Nothing here is medical advice.',
    takenToday: false,
    history: [],
  },
]
