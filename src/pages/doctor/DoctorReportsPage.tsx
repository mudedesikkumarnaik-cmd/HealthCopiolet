import { useMemo, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { PageContainer } from '@/components/layout/PageContainer'
import { PatientReportCard } from '@/components/doctor/PatientReportCard'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'

type ReportFilter = 'all' | 'new' | 'reviewed'

export function DoctorReportsPage() {
  const { patientRecordShares, markPatientRecordReviewed } = useAppData()
  const toast = useToast()
  const [filter, setFilter] = useState<ReportFilter>('all')

  const sorted = useMemo(
    () =>
      [...patientRecordShares].sort(
        (a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime(),
      ),
    [patientRecordShares],
  )

  const newCount = useMemo(() => sorted.filter((share) => !share.reviewedAt).length, [sorted])

  const filtered = useMemo(() => {
    if (filter === 'new') return sorted.filter((share) => !share.reviewedAt)
    if (filter === 'reviewed') return sorted.filter((share) => Boolean(share.reviewedAt))
    return sorted
  }, [sorted, filter])

  const handleReview = (id: string) => {
    const reviewed = markPatientRecordReviewed(id)
    if (!reviewed) return
    toast.success(
      'Marked as seen',
      `${reviewed.patientName} was notified that you reviewed “${reviewed.record.title}”.`,
    )
  }

  return (
    <PageContainer>
      <PageHeading
        title="Patient reports"
        eyebrow="Doctor portal"
        description="Reports patients have shared on this device. Marking one as seen notifies the patient."
      />

      {sorted.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<FileUp aria-hidden="true" className="size-6" />}
          title="No patient reports yet"
          description="When a patient uploads a medical record, it appears here for review — with their name attached."
        />
      ) : (
        <Card className="mt-6">
          <CardHeader
            title={`${filtered.length} of ${sorted.length} report${sorted.length === 1 ? '' : 's'}`}
            description={`${newCount} awaiting review`}
            icon={<FileUp aria-hidden="true" className="size-4" />}
            action={
              <SegmentedControl
                ariaLabel="Filter reports"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'new', label: 'New' },
                  { value: 'reviewed', label: 'Reviewed' },
                ]}
              />
            }
          />
          <CardBody className="space-y-3">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No reports match this filter.
              </p>
            ) : (
              filtered.map((share) => (
                <PatientReportCard key={share.id} share={share} onReview={handleReview} />
              ))
            )}
          </CardBody>
        </Card>
      )}
    </PageContainer>
  )
}
