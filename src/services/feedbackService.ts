import type { Feedback, FeedbackRole } from '@/types/feedback'
import { uid } from '@/utils/formatters'

export interface NewFeedbackInput {
  authorName: string
  authorRole: FeedbackRole
  /** 1–5 stars. */
  rating: number
  message: string
}

/**
 * Creates a feedback entry from the signed-in account's name and role. The
 * entry is later stored in the shared board, so every patient and doctor on
 * this device sees it. Anyone may post as many entries as they like.
 */
export function createFeedback(input: NewFeedbackInput): Feedback {
  return {
    id: uid('fb'),
    authorName: input.authorName.trim(),
    authorRole: input.authorRole,
    rating: input.rating,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  }
}