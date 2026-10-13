import { useMemo, useState } from 'react'
import { CalendarCheck, CheckCircle2, Info, Pill } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { SearchInput } from '@/components/common/PageHeading'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { filterMedications } from '@/services/appointmentsService'
import type { Medication, MedicationStatus } from '@/types/health'
import { MedicationCard } from '@/components/prescriptions/MedicationCard'
import { formatNumber } from '@/utils/formatters'

type StatusFilter = MedicationStatus | 'all'

/**
 * The patient's medicine list is read-only on purpose: prescriptions can only
 * be written by a clinician, and arrive here from the doctor portal.
 */
export function PrescriptionsPage() {
  const { medications, activeMedicationCount, toggleMedicationTaken } = useAppData()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(
    () => filterMedications(medications, { search: query, status }),
    [medications, query, status],
  )
  const takenToday = medications.filter((medication) => medication.takenToday).length

  const handleToggle = (medication: Medication) => {
    toggleMedicationTaken(medication.id)
    toast.info(
      medication.takenToday ? 'Dose unmarked' : 'Dose marked as taken',
      `${medication.name} was ${medication.takenToday ? 'unmarked' : 'recorded as taken today'}.`,
    )
  }

  return (
    <PageContainer>
      <PageHeading
        title="Prescriptions"
        eyebrow="Medications"
        description="Medicines your care team has prescribed for you, with a daily dose tracker."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Pill aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{formatNumber(activeMedicationCount)}</p>
              <p className="text-xs text-muted">Active medications</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{formatNumber(takenToday)}</p>
              <p className="text-xs text-muted">Doses taken today</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <CalendarCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{formatNumber(medications.length)}</p>
              <p className="text-xs text-muted">Items on the list</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody className="flex items-start gap-2.5">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700 dark:text-brand-300" />
          <p className="text-sm text-ink-soft">
            Prescriptions are added by your doctors. When a clinician prescribes a medicine it
            appears here automatically and you are notified — you can mark doses as taken, but only
            your care team can add or change a prescription.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`${filtered.length} of ${medications.length} medication${medications.length === 1 ? '' : 's'}`}
          description="Sample entries — nothing here changes how you take real medicines."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                id="medications-search"
                label="Search medications"
                placeholder="Search name, dose, prescriber…"
                className="w-56"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="hc-input w-36"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          }
        />

        {filtered.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Pill className="size-5" />}
              title="No medications found"
              description="Nothing matches your filters yet. Prescriptions your doctors write will appear here."
            />
          </CardBody>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((medication) => (
              <MedicationCard
                key={medication.id}
                medication={medication}
                onToggleTaken={handleToggle}
              />
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
