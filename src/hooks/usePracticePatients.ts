import { useAuth } from '@/context/AuthContext'
import { isClinicianEmail } from '@/services/authService'
import { practicePatients } from '@/data/practiceData'
import type { PracticePatient } from '@/types/practice'

/**
 * Returns the practice roster for the current user.
 *
 * Every clinician account in the sample directory is shown the shared sample
 * practice so the portal is populated. Patient accounts and unknown users see
 * no practice — their side of the app uses the personal collections instead.
 */
export function usePracticePatients(): PracticePatient[] {
  const { session } = useAuth()
  return isClinicianEmail(session?.email) ? practicePatients : []
}
