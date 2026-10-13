import type { Doctor } from '@/types/practice'

/**
 * Fictional directory of clinicians a patient can send an appointment request
 * to. None of these are real people or practices — the whole directory is
 * sample data for the demo.
 *
 * The first entry matches the built-in sample doctor account so requests
 * reaching that persona line up with the practice portal.
 */
export const doctors: Doctor[] = [
  {
    id: 'doc_priya',
    name: 'Dr. Priya Raman',
    specialty: 'Family medicine',
    email: 'doctor@healthcopilot.app',
    location: 'Northbridge Family Health',
    avatarColor: '#0d9488',
    bio: 'Primary care, routine check-ups and long-term condition reviews.',
  },
  {
    id: 'doc_mei',
    name: 'Dr. Mei Chen',
    specialty: 'Cardiology',
    email: 'mei.chen@northbridge.example',
    location: 'Riverside Cardiology Center',
    avatarColor: '#2563eb',
    bio: 'Heart health, blood pressure and cholesterol follow-ups.',
  },
  {
    id: 'doc_anika',
    name: 'Dr. Anika Rao',
    specialty: 'Endocrinology',
    email: 'anika.rao@northbridge.example',
    location: 'Northbridge Family Health, Suite 3',
    avatarColor: '#7c3aed',
    bio: 'Diabetes, thyroid and hormone management.',
  },
  {
    id: 'doc_marcus',
    name: 'Dr. Samuel Okafor',
    specialty: 'Dentistry',
    email: 'samuel.okafor@brightwater.example',
    location: 'Brightwater Dental, 42 Elm Street',
    avatarColor: '#0ea5e9',
    bio: 'Routine dental care, cleanings and check-ups.',
  },
  {
    id: 'doc_alan',
    name: 'Dr. Alan Whitfield',
    specialty: 'Dermatology',
    email: 'alan.whitfield@cedarskin.example',
    location: 'Cedar Skin Clinic',
    avatarColor: '#f59e0b',
    bio: 'Skin, hair and nail concerns.',
  },
  {
    id: 'doc_lena',
    name: 'Lena Fischer, PT',
    specialty: 'Physiotherapy',
    email: 'lena.fischer@movewell.example',
    location: 'MoveWell Physiotherapy',
    avatarColor: '#db2777',
    bio: 'Movement, rehabilitation and injury recovery.',
  },
]

/** Looks up a directory entry by id. */
export function doctorById(id: string): Doctor | undefined {
  return doctors.find((doctor) => doctor.id === id)
}

/**
 * Resolves the directory entry for a signed-in clinician by email. Returns
 * null for anything that is not a known doctor in the directory.
 */
export function currentDoctorFor(email: string | null | undefined): Doctor | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return doctors.find((doctor) => doctor.email.trim().toLowerCase() === normalized) ?? null
}
