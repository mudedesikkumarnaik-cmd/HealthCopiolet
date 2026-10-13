import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPlus, Stethoscope } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { FieldRow, SelectField, TextAreaField, TextField } from '@/components/common/FormControls'
import { Modal } from '@/components/common/Modal'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { doctors } from '@/data/doctorsData'
import type { AppointmentMode } from '@/types/health'
import { toLocalDateTimeValue } from '@/utils/formatters'
import { appointmentRequestSchema } from '@/utils/validation'
import type { AppointmentRequestFormInput, AppointmentRequestValues } from '@/utils/validation'
import { cn } from '@/utils/cn'

const MODES: Array<{ value: AppointmentMode; label: string }> = [
  { value: 'in-person', label: 'In person' },
  { value: 'video', label: 'Video visit' },
  { value: 'phone', label: 'Phone call' },
]

/** Datetime-local value for the next full hour. */
function defaultDateTime(): string {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  return toLocalDateTimeValue(date)
}

/** Fresh empty values — recomputed so the date is always current. */
function emptyValues(): AppointmentRequestValues {
  return {
    title: '',
    date: defaultDateTime(),
    durationMinutes: 30,
    mode: 'in-person',
    location: '',
    notes: '',
    doctorIds: [],
  }
}

export function RequestAppointmentForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { requestAppointment, profile } = useAppData()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentRequestFormInput, unknown, AppointmentRequestValues>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (!open) return
    reset(emptyValues())
  }, [open, reset])

  const selectedDoctorIds = watch('doctorIds') ?? []

  const onSubmit = (values: AppointmentRequestValues) => {
    const requests = requestAppointment({
      patientId: profile.id,
      patientName: profile.fullName,
      patientEmail: profile.email,
      doctorIds: values.doctorIds,
      title: values.title,
      date: values.date,
      durationMinutes: values.durationMinutes,
      mode: values.mode,
      location: values.location,
      notes: values.notes,
    })

    if (requests.length === 0) {
      toast.error('Choose at least one doctor', 'Select who should receive your request.')
      return
    }

    toast.success(
      'Request sent',
      requests.length === 1
        ? `${requests[0].doctorName} will review your request.`
        : `${requests.length} doctors will review your request.`,
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request an appointment"
      description="Choose one or more doctors, describe the visit, and each doctor can accept or cancel. Nothing is booked with a real clinic."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            leftIcon={<CalendarPlus className="size-4" />}
          >
            Send request{selectedDoctorIds.length > 1 ? 's' : ''}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField
          label="Reason for the visit"
          placeholder="e.g. Persistent cough, medication review"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        <FieldRow>
          <TextField
            label="Date & time"
            type="datetime-local"
            error={errors.date?.message}
            required
            {...register('date')}
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            min={10}
            max={240}
            step={5}
            inputMode="numeric"
            error={errors.durationMinutes?.message}
            required
            {...register('durationMinutes', { valueAsNumber: true })}
          />
        </FieldRow>

        <FieldRow>
          <SelectField
            label="Mode"
            options={MODES}
            error={errors.mode?.message}
            required
            {...register('mode')}
          />
          <TextField
            label="Location (optional)"
            placeholder="Address, room, or “Secure video visit”"
            error={errors.location?.message}
            {...register('location')}
          />
        </FieldRow>

        <TextAreaField
          label="Notes (optional)"
          placeholder="Symptoms, questions, or documents to bring…"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <fieldset>
          <legend className="hc-label">
            Doctors <span aria-hidden="true" className="text-rose-500">*</span>
          </legend>
          <p className="mb-2 text-xs text-muted">
            A separate request is created for every doctor you select.
          </p>
          <div className="hc-scroll grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {doctors.map((doctor) => {
              const checked = selectedDoctorIds.includes(doctor.id)
              return (
                <label
                  key={doctor.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    checked
                      ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10'
                      : 'border-line hover:bg-surface-2',
                  )}
                >
                  <input
                    type="checkbox"
                    value={doctor.id}
                    className="mt-0.5 size-4 shrink-0 rounded border-line-strong text-brand-600 accent-brand-600"
                    {...register('doctorIds')}
                  />
                  <Avatar name={doctor.name} color={doctor.avatarColor} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{doctor.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Stethoscope aria-hidden="true" className="size-3" />
                      {doctor.specialty}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted">{doctor.bio}</span>
                  </span>
                </label>
              )
            })}
          </div>
          {errors.doctorIds?.message ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {errors.doctorIds.message}
            </p>
          ) : null}
        </fieldset>
      </form>
    </Modal>
  )
}
