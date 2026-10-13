import { FileText, Eye } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import type { BadgeTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import type { RecordCategory, MedicalRecord } from '@/types/health'
import { categoryLabel } from '@/services/recordsService'
import { formatDate, formatFileSize } from '@/utils/formatters'

const CATEGORY_TONES: Record<RecordCategory, BadgeTone> = {
  'lab-report': 'info',
  prescription: 'violet',
  'discharge-summary': 'warning',
  imaging: 'brand',
  'consultation-note': 'neutral',
  vaccination: 'success',
  other: 'neutral',
}

function CategoryBadge({ category }: { category: RecordCategory }) {
  return <Badge tone={CATEGORY_TONES[category]}>{categoryLabel(category)}</Badge>
}

function FileGlyph({ fileType }: { fileType: MedicalRecord['fileType'] }) {
  const Icon: LucideIcon = FileText
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
      <Icon aria-hidden="true" className="size-5" />
      <span className="sr-only">{fileType.toUpperCase()} file</span>
    </span>
  )
}

export function RecordsTable({
  records,
  onOpen,
}: {
  records: MedicalRecord[]
  onOpen: (record: MedicalRecord) => void
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-5" />}
        title="No records match your filters"
        description="Try clearing the search or category filter, or upload a new document."
      />
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Medical records library</caption>
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">
                Record
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Category
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Provider
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Date
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                File
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <FileText aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{record.title}</p>
                      {record.isDemoPreview ? (
                        <p className="text-[0.68rem] text-muted">Metadata only · sample preview</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <CategoryBadge category={record.category} />
                </td>
                <td className="px-3 py-3.5 text-ink-soft">{record.provider}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-ink-soft">{formatDate(record.date)}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-ink-soft">
                  {record.fileName} · {formatFileSize(record.fileSizeKb)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button variant="subtle" size="sm" onClick={() => onOpen(record)} rightIcon={<Eye className="size-3.5" />}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="divide-y divide-line md:hidden">
        {records.map((record) => (
          <li key={record.id}>
            <button
              type="button"
              onClick={() => onOpen(record)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
            >
              <FileGlyph fileType={record.fileType} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{record.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {categoryLabel(record.category)} · {record.provider}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {formatDate(record.date)} · {formatFileSize(record.fileSizeKb)}
                </span>
              </span>
              <span className="mt-1 text-muted">
                <Eye aria-hidden="true" className="size-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}