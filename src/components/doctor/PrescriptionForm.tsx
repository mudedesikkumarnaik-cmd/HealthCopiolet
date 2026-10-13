import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pill, Send } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FieldRow, SelectField, TextAreaField, TextField } from '@/components/common/FormControls'
import { Modal } from '@/components/common/Modal'
import { useAuth } from '@/context/AuthContext'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { currentDoctorFor } from '@/data/doctorsData'
import { doctorDisplayName, todayISO } from '@/utils/formatters'
import { prescriptionSchema } from '@/utils/validation'
import type { PrescriptionValues } from '@/utils/validation'

const FREQUENCIES = [
  'Once daily, morning',
  'Once daily, evening',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every other day',
  'Weekly',
  'As needed',
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
]

export interface PrescriptionPatient {
  /** Storage scope id the prescription is delivered to. */
  id: string
  name: string
  email: string
}

/**
 * Doctor-authored prescription. The clinician picks one of their patients, adds
 * the medication, and it is delivered straight into that patient's own list.
 * Patients cannot open this form.
 */
export function PrescriptionForm({
  open,
  onClose,
  patients,
  defaultPatientId,
}: {
  open: boolean
  onClose: () => void
  patients: PrescriptionPatient[]
  defaultPatientId?: string
}) {
  const { session } = useAuth()
  const { prescribeMedication } = useAppData()
  const toast = useToast()

  const doctorName =
    currentDoctorFor(session?.email)?.name ?? doctorDisplayName(session?.fullName)

  const patientOptions = useMemo(
    () => patients.map((patient) => ({ value: patient.id, label: `${patient.name} · ${patient.email}` })),
    [patients],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: defaultPatientId ?? '',
      name: '',
      dosage: '',
      frequency: 'Once daily, morning',
      startDate: todayISO(),
      status: 'active',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      patientId: defaultPatientId || patients[0]?.id || '',
      name: '',
      dosage: '',
      frequency: 'Once daily, morning',
      startDate: todayISO(),
      status: 'active',
      notes: '',
    })
  }, [open, defaultPatientId, patients, reset])

  const onSubmit = (values: PrescriptionValues) => {
    const patient = patients.find((candidate) => candidate.id === values.patientId)
    if (!patient) return

    prescribeMedication({
      patientId: patient.id,
      patientName: patient.name,
      patientEmail: patient.email,
      doctorId: currentDoctorFor(session?.email)?.id ?? session?.userId ?? 'doctor',
      doctorName,
      specialty: currentDoctorFor(session?.email)?.specialty ?? 'General practice',
      medication: {
        name: values.name,
        dosage: values.dosage,
        frequency: values.frequency,
        prescriber: doctorName,
        startDate: values.startDate,
        status: values.status,
        notes: values.notes || undefined,
      },
    })
    toast.success(
      'Prescription sent',
      `${values.name} was added to ${patient.name}'s medicine list.`,
    )
    onClose()
  }

  const hasPatients = patients.length > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New prescription"
      description="Choose a patient, then add the medication. It appears in that patient's own Prescriptions list."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={!hasPatients}
            leftIcon={<Send className="size-4" />}
          >
            Send prescription
          </Button>
        </>
      }
    >
      {hasPatients ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <SelectField
            label="Patient"
            placeholder="Choose a patient"
            options={patientOptions}
            error={errors.patientId?.message}
            required
            {...register('patientId')}
          />

          <FieldRow>
            <TextField
              label="Medication name"
              placeholder="e.g. Lisinopril"
              error={errors.name?.message}
              required
              {...register('name')}
            />
            <TextField
              label="Dosage"
              placeholder="e.g. 10 mg"
              error={errors.dosage?.message}
              required
              {...register('dosage')}
            />
          </FieldRow>

          <FieldRow>
            <SelectField
              label="Frequency"
              options={FREQUENCIES.map((frequency) => ({ value: frequency, label: frequency }))}
              error={errors.frequency?.message}
              required
              {...register('frequency')}
            />
            <TextField
              label="Start date"
              type="date"
              error={errors.startDate?.message}
              required
              {...register('startDate')}
            />
          </FieldRow>

          <SelectField
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            required
            {...register('status')}
          />

          <TextAreaField
            label="Instructions (optional)"
            placeholder="Dosing notes, things to watch for, or follow-up guidance…"
            error={errors.notes?.message}
            {...register('notes')}
          />

          <div className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
            <Pill aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              The prescription is written as <span className="font-semibold text-ink">{doctorName}</span>{' '}
              and delivered to the patient's own list. They are notified in-app. This demo stores
              sample data only.
            </p>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-line bg-surface-2 p-4 text-sm text-muted">
          No patients are on your list yet, so there is nobody to prescribe to. Patients appear once
          they are part of your practice.
        </p>
      )}
    </Modal>
  )
}
