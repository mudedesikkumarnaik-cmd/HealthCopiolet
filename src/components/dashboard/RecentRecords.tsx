import { Link } from 'react-router-dom'
import { ArrowRight, FileText, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppData } from '@/context/DataContext'
import { categoryLabel } from '@/services/recordsService'
import { filterRecords } from '@/services/recordsService'
import { formatDate } from '@/utils/formatters'

export function RecentRecords() {
  const { records } = useAppData()
  const recent = filterRecords(records, { order: 'newest' }).slice(0, 4)

  return (
    <Card className="h-full">
      <CardHeader
        title="Recent records"
        description="Latest documents in your library"
        icon={<FolderOpen aria-hidden="true" className="size-4" />}
        action={
          <Link
            to="/records"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            View all <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        }
      />
      <CardBody>
        {recent.length === 0 ? (
          <EmptyState
            icon={<FileText aria-hidden="true" className="size-5" />}
            title="No records yet"
            description="Upload sample documents on the Medical Records page."
            action={
              <Link
                to="/records"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950"
              >
                Open records
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((record) => (
              <li key={record.id}>
                <Link
                  to="/records"
                  className="flex items-start gap-3 py-2.5 transition-colors first:pt-0 last:pb-0"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                    <FileText aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{record.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {record.provider} · {formatDate(record.date)}
                    </span>
                  </span>
                  <Badge tone="neutral" className="mt-0.5 hidden sm:inline-flex">
                    {categoryLabel(record.category)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}