import { DEMO_PROFILE } from '@/data/demoUser'
import { samplePersonaFor } from '@/services/authService'

/**
 * The storage scope id used for a patient's own collections.
 *
 * Mirrors the rule in `DataContext`: the built-in sample patient always uses
 * its seeded id (`user_sample_patient`) so data the sample doctor delivers
 * always lines up, whatever authentication mode is active. Every other
 * account uses its own user id.
 */
export function patientScopeId(
  email: string | null | undefined,
  userId: string | null | undefined,
): string {
  if (samplePersonaFor(email) === 'patient') return DEMO_PROFILE.id
  return userId ?? 'anonymous'
}
