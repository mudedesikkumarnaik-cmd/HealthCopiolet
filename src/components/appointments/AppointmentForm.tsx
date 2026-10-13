import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FieldRow, SelectField, TextAreaField, TextField } from '@/components/common/FormControls'
import { Modal } from '@/components/common/Modal'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { doctors } from '@/data/doctorsData'
import { toLocalDateTimeValue } from '@/utils/formatters'
import type { Appointment, AppointmentMode } from '@/types/health'
import { appointmentSchema } from '@/utils/validation'
import type { AppointmentInput, AppointmentValues } from '@/utils/validation'

const MODES: Array<{ value: AppointmentMode; label: string }> = [
  { value: 'in-person', label: 'In person' },
  { value: 'video', label: 'Video visit' },
  { value: 'phone', label: 'Phone call' },
]

/** Directory clinicians the patient can pick — the form shows only doctor names. */
const DOCTOR_OPTIONS = doctors.map((doctor) => ({
  value: doctor.id,
  label: `${doctor.name} — ${doctor.specialty}`,
}))

/** Matches an existing provider name back to a directory doctor, if any. */
function doctorIdForProvider(name: string | undefined): string {
  return doctors.find((doctor) => doctor.name === name)?.id ?? ''
}

/** Datetime-local value for the next full hour, used when a slate is empty. */
function defaultDateTime(): string {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  return toLocalDateTimeValue(date)
}

export function AppointmentForm({
  open,
  onClose,
  appointment,
}: {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
}) {
  const { addAppointment, updateAppointment } = useAppData()
  const toast = useToast()
  const isEditing = Boolean(appointment)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput, unknown, AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: '',
      doctorId: '',
      provider: '',
      specialty: '',
      date: defaultDateTime(),
      durationMinutes: 30,
      mode: 'in-person',
      location: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      appointment
        ? {
            title: appointment.title,
            doctorId: doctorIdForProvider(appointment.provider),
            provider: appointment.provider,
            specialty: appointment.specialty,
            date: toLocalDateTimeValue(appointment.date),
            durationMinutes: appointment.durationMinutes,
            mode: appointment.mode,
            location: appointment.location,
            notes: appointment.notes ?? '',
          }
        : {
            title: '',
            doctorId: '',
            provider: '',
            specialty: '',
            date: defaultDateTime(),
            durationMinutes: 30,
            mode: 'in-person',
            location: '',
            notes: '',
          },
    )
  }, [open, appointment, reset])

  const handleDoctorChange = (id: string) => {
    const doctor = doctors.find((candidate) => candidate.id === id)
    if (!doctor) return
    setValue('provider', doctor.name, { shouldValidate: true })
    setValue('specialty', doctor.specialty, { shouldValidate: true })
    if (!getValues('location')?.trim()) {
      setValue('location', doctor.location, { shouldValidate: false })
    }
  }

  const onSubmit = (values: AppointmentValues) => {
    const payload = {
      title: values.title,
      provider: values.provider,
      specialty: values.specialty,
      date: values.date,
      durationMinutes: values.durationMinutes,
      mode: values.mode,
      location: values.location,
      notes: values.notes,
    }
    if (appointment) {
      updateAppointment(appointment.id, payload)
      toast.success('Appointment updated', `${values.title} was saved.`)
    } else {
      addAppointment(payload)
      toast.success('Appointment added', `${values.title} was scheduled in your calendar.`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit appointment' : 'Add an appointment'}
      description={`${isEditing ? 'Update' : 'Schedule'} a visit in your calendar — nothing is booked with a real clinic.`}
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
            {isEditing ? 'Save changes' : 'Schedule appointment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FieldRow>
          <TextField
            label="Title"
            placeholder="e.g. Cardiology follow-up"
            error={errors.title?.message}
            required
            {...register('title')}
          />
          <SelectField
            label="Doctor"
            placeholder="Choose a doctor…"
            options={DOCTOR_OPTIONS}
            error={
              errors.provider?.message ? 'Choose a doctor from the list' : errors.specialty?.message
            }
            hint="The doctor's name, specialty and location are filled in automatically."
            required
            {...register('doctorId')}
            onChange={(event) => {
              register('doctorId').onChange(event)
              handleDoctorChange(event.target.value)
            }}
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
            label="Date & time"
            type="datetime-local"
            error={errors.date?.message}
            required
            {...register('date')}
          />
        </FieldRow>

        <FieldRow>
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
          <TextField
            label="Location"
            placeholder="Address, room, or “Secure video visit”"
            error={errors.location?.message}
            hint="Filled in from the doctor when you pick them."
            {...register('location')}
          />
        </FieldRow>

        <TextAreaField
          label="Notes (optional)"
          placeholder="What to prepare, questions, or documents to bring…"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}