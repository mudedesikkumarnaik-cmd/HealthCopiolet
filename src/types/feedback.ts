/**
 * Shared feedback model.
 *
 * Feedback is intentionally shared across every account on the device: a
 * patient or doctor who posts a note sees it — and every other patient and
 * doctor — on the same board.
 */

export type FeedbackRole = 'patient' | 'doctor'

export interface Feedback {
  id: string
  authorName: string
  authorRole: FeedbackRole
  /** 1–5 stars. */
  rating: number
  message: string
  createdAt: string
}