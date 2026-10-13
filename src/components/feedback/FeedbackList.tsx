import { MessagesSquare } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { StarRating } from '@/components/feedback/StarRating'
import { useAppData } from '@/context/DataContext'
import { useI18n } from '@/context/I18nContext'
import type { FeedbackRole } from '@/types/feedback'
import { formatRelativeTime } from '@/utils/formatters'

const ROLE_COLORS: Record<FeedbackRole, string> = {
  patient: '#2563eb',
  doctor: '#0d9488',
}

const ROLE_TONES: Record<FeedbackRole, 'info' | 'brand'> = {
  patient: 'info',
  doctor: 'brand',
}

/** Shared feedback board — shows every patient's and doctor's notes. */
export function FeedbackList() {
  const { feedback } = useAppData()
  const { t } = useI18n()

  if (feedback.length === 0) {
    return (
      <EmptyState
        className="border-none"
        icon={<MessagesSquare aria-hidden="true" className="size-5" />}
        title={t('No feedback yet')}
        description={t('Be the first to share your thoughts — the form above is open to every patient and doctor.')}
      />
    )
  }

  return (
    <div className="divide-y divide-line">
      {feedback.map((entry) => (
        <article key={entry.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <Avatar
              name={entry.authorName}
              color={ROLE_COLORS[entry.authorRole]}
              size="sm"
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-ink">{entry.authorName}</span>
                <Badge tone={ROLE_TONES[entry.authorRole]}>{t(entry.authorRole === 'doctor' ? 'Doctor' : 'Patient')}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={entry.rating} size="sm" />
                <span className="text-xs text-muted">{formatRelativeTime(entry.createdAt)}</span>
              </div>
            </div>
          </div>
          <p className="mt-2.5 pl-11 text-sm leading-relaxed text-ink-soft">{entry.message}</p>
        </article>
      ))}
    </div>
  )
}