import { useState } from 'react'
import { Download, FileText, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Modal } from '@/components/common/Modal'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { categoryLabel, downloadRecordAsText } from '@/services/recordsService'
import type { MedicalRecord } from '@/types/health'
import { formatDate, formatFileSize } from '@/utils/formatters'

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-ink-soft">{children}</dd>
    </div>
  )
}

export function RecordDetails({
  record,
  onClose,
}: {
  record: MedicalRecord
  onClose: () => void
}) {
  const { removeRecord } = useAppData()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDelete = () => {
    removeRecord(record.id)
    setConfirmOpen(false)
    onClose()
    toast.success('Record removed', `“${record.title}” was deleted from your library.`)
  }

  return (
    <>
      <Modal
        open={Boolean(record)}
        onClose={onClose}
        title={record.title}
        description={categoryLabel(record.category)}
        size="lg"
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              leftIcon={<Trash2 className="size-4" />}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadRecordAsText(record)}
              leftIcon={<Download className="size-4" />}
            >
              Download metadata
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <FileText aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{record.fileName}</p>
            <p className="text-xs text-muted">
              {record.fileType.toUpperCase()} · {formatFileSize(record.fileSizeKb)} ·{' '}
              {formatDate(record.date)}
            </p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-line">
          <DetailRow label="Category">
            <Badge tone="brand">{categoryLabel(record.category)}</Badge>
          </DetailRow>
          <DetailRow label="Provider">{record.provider}</DetailRow>
          <DetailRow label="Date">{formatDate(record.date)}</DetailRow>
          <DetailRow label="Tags">
            {record.tags.length > 0 ? record.tags.map((tag) => `#${tag}`).join(' · ') : '—'}
          </DetailRow>
          <DetailRow label="Added">{formatDate(record.createdAt)}</DetailRow>
          <DetailRow label="Notes">{record.notes ?? 'No notes added.'}</DetailRow>
        </dl>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Summary</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {record.summary ?? 'No summary available for this metadata-only record.'}
          </p>
        </div>

        <div className="mt-4 flex gap-2 rounded-xl border border-brand-100 bg-brand-50/70 p-3.5 text-xs text-brand-800 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-200">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">Metadata only:</span> the original document is not stored
            or read. Only the details you see here live in this browser, and the summary text is
            sample copy, not an analysis.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this record?"
        description={
          <>
            “{record.title}” will be removed from your library. The original document is never stored
            here, so nothing else is affected.
          </>
        }
        confirmLabel="Delete record"
      />
    </>
  )
}