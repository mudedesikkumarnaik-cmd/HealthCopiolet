import { CheckCircle2, Eye, FileText } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { categoryLabel } from '@/services/recordsService'
import type { PatientRecordShare } from '@/types/practice'
import { formatDate, formatFileSize, formatRelativeTime } from '@/utils/formatters'

/**
 * One patient-uploaded report in the care-team inbox. Shows who shared it and
 * whether a clinician has reviewed it; the review action notifies the patient.
 */
export function PatientReportCard({
  share,
  onReview,
  showPatient = true,
}: {
  share: PatientRecordShare
  onReview?: (id: string) => void
  showPatient?: boolean
}) {
  const { record } = share
  const reviewed = Boolean(share.reviewedAt)

  return (
    <article className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showPatient ? (
            <p className="text-sm font-semibold text-ink">{share.patientName}</p>
          ) : null}
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            {!showPatient ? (
              <FileText aria-hidden="true" className="size-4 shrink-0 text-brand-700 dark:text-brand-300" />
            ) : null}
            <span className="truncate">{record.title}</span>
          </p>
          {showPatient ? <p className="text-xs text-muted">{share.patientEmail}</p> : null}
        </div>
        <Badge tone={reviewed ? 'success' : 'warning'}>
          {reviewed ? 'Reviewed' : 'New'}
        </Badge>
      </div>

      <p className="mt-1.5 text-xs text-muted">
        {categoryLabel(record.category)} · {record.provider} · {formatDate(record.date)} ·{' '}
        {record.fileName} · {formatFileSize(record.fileSizeKb)}
      </p>

      {record.notes ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{record.notes}</p>
      ) : null}
      {record.summary ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{record.summary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-muted">
          Shared {formatRelativeTime(share.sharedAt)}
          {reviewed && share.reviewedBy ? ` · reviewed by ${share.reviewedBy}` : ''}
        </p>
        {reviewed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            Patient notified
          </span>
        ) : onReview ? (
          <Button
            size="sm"
            onClick={() => onReview(share.id)}
            leftIcon={<Eye aria-hidden="true" className="size-4" />}
          >
            Mark as seen
          </Button>
        ) : null}
      </div>
    </article>
  )
}
