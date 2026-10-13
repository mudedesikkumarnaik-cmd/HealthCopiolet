import { useMemo, useState } from 'react'
import { Pill, Plus } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeading } from '@/components/common/PageHeading'
import { PageContainer } from '@/components/layout/PageContainer'
import { PrescriptionForm } from '@/components/doctor/PrescriptionForm'
import type { PrescriptionPatient } from '@/components/doctor/PrescriptionForm'
import { useAppData } from '@/context/DataContext'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { patientScopeId } from '@/services/patientScope'
import { formatDate, formatRelativeTime, humanize } from '@/utils/formatters'

const STATUS_TONES = { active: 'success', paused: 'warning', completed: 'neutral' } as const

export function DoctorPrescriptionsPage() {
  const { prescriptions } = useAppData()
  const patients = usePracticePatients()
  const [formOpen, setFormOpen] = useState(false)
  const [presetPatientId, setPresetPatientId] = useState<string | undefined>(undefined)

  // The doctor's patients, mapped to the storage scope id the prescription is
  // delivered to (the built-in sample patient keeps its seeded id).
  const patientOptions: PrescriptionPatient[] = useMemo(
    () =>
      patients.map((patient) => ({
        id: patientScopeId(patient.email, patient.id),
        name: patient.fullName,
        email: patient.email,
      })),
    [patients],
  )

  const sorted = useMemo(
    () =>
      [...prescriptions].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [prescriptions],
  )

  const openForm = (patientId?: string) => {
    setPresetPatientId(patientId)
    setFormOpen(true)
  }

  return (
    <PageContainer>
      <PageHeading
        title="Prescriptions"
        eyebrow="Doctor portal"
        description="Write a prescription for one of your patients. It is delivered to their own medicine list."
        actions={
          <Button
            onClick={() => openForm()}
            disabled={patientOptions.length === 0}
            leftIcon={<Plus className="size-4" />}
          >
            New prescription
          </Button>
        }
      />

      {patientOptions.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Pill aria-hidden="true" className="size-6" />}
          title="No patients to prescribe to"
          description="Your practice is empty. Once patients are part of your practice you can write prescriptions for them here."
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Pill aria-hidden="true" className="size-6" />}
          title="No prescriptions yet"
          description="Use “New prescription” to add a medication for one of your patients. It appears in their own list."
        />
      ) : (
        <Card className="mt-6">
          <CardHeader
            title={`${sorted.length} prescription${sorted.length === 1 ? '' : 's'}`}
            description="Every medication you have prescribed from this device"
            icon={<Pill aria-hidden="true" className="size-4" />}
          />
          <CardBody className="divide-y divide-line">
            {sorted.map((prescription) => (
              <div key={prescription.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {prescription.medication.name}{' '}
                    <span className="font-normal text-muted">{prescription.medication.dosage}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {prescription.medication.frequency} · for {prescription.patientName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Written by {prescription.doctorName} · {formatDate(prescription.issuedAt)} ·{' '}
                    {formatRelativeTime(prescription.issuedAt)}
                  </p>
                  {prescription.medication.notes ? (
                    <p className="mt-1 text-xs text-muted">{prescription.medication.notes}</p>
                  ) : null}
                </div>
                <Badge tone={STATUS_TONES[prescription.medication.status]}>
                  {humanize(prescription.medication.status)}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <PrescriptionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patients={patientOptions}
        defaultPatientId={presetPatientId}
      />
    </PageContainer>
  )
}
