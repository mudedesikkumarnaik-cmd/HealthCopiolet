import { Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

export function SuggestedQuestions({
  questions,
  onPick,
  disabled,
  className,
}: {
  questions: string[]
  onPick: (question: string) => void
  disabled?: boolean
  className?: string
}) {
  if (questions.length === 0) return null
  return (
    <div className={cn('space-y-2', className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Sparkles aria-hidden="true" className="size-3.5" />
        Try asking
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onPick(question)}
            disabled={disabled}
            className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}