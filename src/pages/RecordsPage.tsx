import { useMemo, useState } from 'react'
import { FileUp, FolderOpen, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { PageHeading } from '@/components/common/PageHeading'
import { SearchInput } from '@/components/common/PageHeading'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { RECORD_CATEGORIES, filterRecords } from '@/services/recordsService'
import type { RecordCategory } from '@/types/health'
import { RecordUpload } from '@/components/records/RecordUpload'
import { RecordDetails } from '@/components/records/RecordDetails'
import { RecordsTable } from '@/components/records/RecordsTable'

type CategoryFilter = RecordCategory | 'all'
type DateValue = string

export function RecordsPage() {
  const { records } = useAppData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [from, setFrom] = useState<DateValue>('')
  const [to, setTo] = useState<DateValue>('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      filterRecords(records, {
        search: query,
        category,
        from: from || undefined,
        to: to || undefined,
        order,
      }),
    [records, query, category, from, to, order],
  )

  const selected = records.find((record) => record.id === selectedId) ?? null

  const hasFilters = Boolean(query || category !== 'all' || from || to)
  const clearFilters = () => {
    setQuery('')
    setCategory('all')
    setFrom('')
    setTo('')
  }

  return (
    <PageContainer>
      <PageHeading
        title="Medical Records"
        eyebrow="Library"
        description="Your documents, organised by category with easy search and filtering."
        actions={
          <Button onClick={() => setUploadOpen(true)} leftIcon={<FileUp className="size-4" />}>
            Upload record
          </Button>
        }
      />

      <Card>
        <CardHeader
          icon={<FolderOpen className="size-4" />}
          title={`${filtered.length} of ${records.length} record${records.length === 1 ? '' : 's'}`}
          description={
            hasFilters
              ? 'Filtered from your full library.'
              : 'Metadata-only entries — files are never stored or analysed.'
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <SearchInput
              id="records-search"
              label="Search records"
              placeholder="Search titles, providers, notes…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="hc-input md:w-44"
            >
              <option value="all">All categories</option>
              {RECORD_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 md:w-40">
              <span className="sr-only">From date</span>
              <input
                type="date"
                aria-label="From date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="hc-input"
              />
            </label>
            <label className="flex items-center gap-2 md:w-40">
              <span className="sr-only">To date</span>
              <input
                type="date"
                aria-label="To date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="hc-input"
              />
            </label>
            <SegmentedControl
              ariaLabel="Sort order"
              value={order}
              onChange={setOrder}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
              ]}
            />
          </div>

          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <SlidersHorizontal aria-hidden="true" className="size-3.5" />
                Active filters
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <RecordsTable records={filtered} onOpen={(record) => setSelectedId(record.id)} />
      </Card>

      {uploadOpen ? <RecordUpload onClose={() => setUploadOpen(false)} /> : null}
      {selected ? <RecordDetails record={selected} onClose={() => setSelectedId(null)} /> : null}
    </PageContainer>
  )
}