import { useState } from 'react'
import type { FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextAreaField } from '@/components/common/FormControls'
import { StarRating } from '@/components/feedback/StarRating'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/context/ToastContext'

const MIN_LENGTH = 10
const MAX_LENGTH = 500

/**
 * Feedback form — open to both patients and doctors. Each submission is added
 * to the shared board, and the form stays available so the same person can
 * send another note right away.
 */
export function FeedbackForm() {
  const { session } = useAuth()
  const { addFeedback } = useAppData()
  const { t } = useI18n()
  const toast = useToast()

  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = message.trim()

    if (trimmed.length < MIN_LENGTH) {
      setError(t('Please write at least {count} characters.', { count: MIN_LENGTH }))
      return
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(t('Please keep it under {count} characters.', { count: MAX_LENGTH }))
      return
    }

    setIsSubmitting(true)
    addFeedback({
      authorName: session?.fullName || 'Account holder',
      authorRole: session?.role === 'doctor' ? 'doctor' : 'patient',
      rating,
      message: trimmed,
    })
    setMessage('')
    setRating(5)
    setError(undefined)
    setIsSubmitting(false)
    toast.success(t('Feedback sent'), t('It is now on the shared board for every patient and doctor.'))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink">{t('How would you rate Health Copilot?')}</p>
        <div className="mt-1.5">
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <TextAreaField
        label={t('Your feedback')}
        placeholder={t('Share what is working well, what is confusing, or what you would like to see next…')}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value)
          if (error) setError(undefined)
        }}
        error={error}
        hint={t('{count}/{max} characters — visible to every patient and doctor on this device.', {
          count: message.trim().length,
          max: MAX_LENGTH,
        })}
        rows={4}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {t('Send as many notes as you like — there is no limit.')}
        </p>
        <Button type="submit" isLoading={isSubmitting} leftIcon={<Send className="size-4" />}>
          {t('Send feedback')}
        </Button>
      </div>
    </form>
  )
}