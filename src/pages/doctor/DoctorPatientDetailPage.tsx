import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Droplets,
  FolderOpen,
  Pill,
  Plus,
  Stethoscope,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { PatientReportCard } from '@/components/doctor/PatientReportCard'
import { PrescriptionForm } from '@/components/doctor/PrescriptionForm'
import type { PrescriptionPatient } from '@/components/doctor/PrescriptionForm'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { usePracticePatients } from '@/hooks/usePracticePatients'
import { patientScopeId } from '@/services/patientScope'
import { ageFromISO, formatDate, formatDateTime, humanize } from '@/utils/formatters'

const STATUS_TONES = { scheduled: 'brand', completed: 'success', cancelled: 'neutral' } as const

export function DoctorPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const patients = usePracticePatients()
  const patient = patients.find((candidate) => candidate.id === patientId)
  const { patientRecordShares, prescriptions, markPatientRecordReviewed } = useAppData()
  const toast = useToast()
  const [prescribeOpen, setPrescribeOpen] = useState(false)

  // Reports this patient has uploaded from their own account.
  const sharedRecords = useMemo(
    () =>
      patient
        ? patientRecordShares
            .filter((share) => share.patientEmail.toLowerCase() === patient.email.toLowerCase())
            .sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())
        : [],
    [patientRecordShares, patient],
  )

  // Medicines this practice has prescribed to the patient, merged ahead of the
  // roster's seeded medicines so a freshly issued prescription shows immediately.
  const medicines = useMemo(() => {
    if (!patient) return []
    const issued = prescriptions
      .filter((entry) => entry.patientEmail.toLowerCase() === patient.email.toLowerCase())
      .map((entry) => entry.medication)
    const seededIds = new Set(patient.medications.map((medication) => medication.id))
    return [...issued.filter((medication) => !seededIds.has(medication.id)), ...patient.medications]
  }, [prescriptions, patient])

  const prescriptionPatients: PrescriptionPatient[] = useMemo(
    () =>
      patients.map((candidate) => ({
        id: patientScopeId(candidate.email, candidate.id),
        name: candidate.fullName,
        email: candidate.email,
      })),
    [patients],
  )

  const handleReview = (id: string) => {
    const reviewed = markPatientRecordReviewed(id)
    if (!reviewed) return
    toast.success(
      'Marked as seen',
      `${reviewed.patientName} was notified that you reviewed “${reviewed.record.title}”.`,
    )
  }

  if (!patient) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Users aria-hidden="true" className="size-6" />}
          title="Patient not found"
          description="This patient is not part of your practice, or the practice is still empty."
          action={
            <Link
              to="/doctor/patients"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to patients
            </Link>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Link
        to="/doctor/patients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All patients
      </Link>

      {/* Header */}
      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={patient.fullName} color={patient.avatarColor} size="xl" />
            <div>
              <h1 className="text-xl font-bold text-ink sm:text-2xl">{patient.fullName}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {ageFromISO(patient.dateOfBirth)} yrs · {formatDate(patient.dateOfBirth)}{' '}
                · Blood {patient.bloodType}
              </p>
              <p className="mt-1 text-sm text-muted">
                {patient.email} · {patient.phone}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Badge tone="brand" icon={<Stethoscope aria-hidden="true" className="size-3" />}>
              {patient.primaryPhysician}
            </Badge>
            <Badge tone="neutral">Last visit {formatDate(patient.lastVisit)}</Badge>
            <Button
              size="sm"
              onClick={() => setPrescribeOpen(true)}
              leftIcon={<Plus aria-hidden="true" className="size-4" />}
            >
              Prescribe
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Conditions & allergies */}
        <Card>
          <CardHeader
            title="Conditions & allergies"
            icon={<Stethoscope aria-hidden="true" className="size-4" />}
          />
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active conditions</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patient.conditions.length === 0 ? (
                <span className="text-sm text-muted">None recorded.</span>
              ) : (
                patient.conditions.map((condition) => (
                  <Badge key={condition} tone="warning">
                    {condition}
                  </Badge>
                ))
              )}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Allergies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {patient.allergies.length === 0 ? (
                <span className="text-sm text-muted">No known allergies.</span>
              ) : (
                patient.allergies.map((allergy) => (
                  <Badge key={allergy} tone="danger" icon={<Droplets aria-hidden="true" className="size-3" />}>
                    {allergy}
                  </Badge>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Medicines */}
        <Card>
          <CardHeader
            title="Medicines"
            icon={<Pill aria-hidden="true" className="size-4" />}
            action={
              <Badge tone="success">
                {medicines.filter((medication) => medication.status === 'active').length} active
              </Badge>
            }
          />
          <CardBody className="space-y-3">
            {medicines.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No medicines on file.</p>
            ) : (
              medicines.map((medication) => (
                <div
                  key={medication.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {medication.name}{' '}
                      <span className="font-normal text-muted">{medication.dosage}</span>
                    </p>
                    <p className="text-xs text-muted">{medication.frequency}</p>
                    {medication.notes ? (
                      <p className="mt-1 text-xs text-muted">{medication.notes}</p>
                    ) : null}
                  </div>
                  <Badge tone={medication.status === 'active' ? 'success' : 'neutral'}>
                    {medication.status}
                  </Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Records */}
        <Card>
          <CardHeader
            title="Medical records"
            icon={<FolderOpen aria-hidden="true" className="size-4" />}
            action={
              <Badge tone="neutral">
                {patient.records.length + sharedRecords.length} documents
              </Badge>
            }
          />
          <CardBody className="space-y-3">
            {patient.records.length === 0 && sharedRecords.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No records on file.</p>
            ) : (
              <>
                {patient.records.map((record) => (
                  <div key={record.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">{record.title}</p>
                      <Badge tone="neutral">{humanize(record.category)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {record.provider} · {formatDate(record.date)}
                    </p>
                    {record.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{record.summary}</p>
                    ) : null}
                  </div>
                ))}

                {sharedRecords.length > 0 ? (
                  <div className="border-t border-line pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      Shared by the patient ({sharedRecords.length})
                    </p>
                    <div className="space-y-3">
                      {sharedRecords.map((share) => (
                        <PatientReportCard
                          key={share.id}
                          share={share}
                          onReview={handleReview}
                          showPatient={false}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardBody>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader
            title="Visit history"
            icon={<CalendarDays aria-hidden="true" className="size-4" />}
            action={<Badge tone="brand">{patient.appointments.length} visits</Badge>}
          />
          <CardBody className="divide-y divide-line">
            {patient.appointments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No visits on file.</p>
            ) : (
              [...patient.appointments]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{appointment.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(appointment.date)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {appointment.mode} · {appointment.location}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[appointment.status]}>{appointment.status}</Badge>
                  </div>
                ))
            )}
          </CardBody>
        </Card>
      </div>

      <PrescriptionForm
        open={prescribeOpen}
        onClose={() => setPrescribeOpen(false)}
        patients={prescriptionPatients}
        defaultPatientId={patientScopeId(patient.email, patient.id)}
      />
    </PageContainer>
  )
}