import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { FieldRow, SelectField, TextField } from '@/components/common/FormControls'
import { PageHeading } from '@/components/common/PageHeading'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { LANGUAGES, TIME_ZONES } from '@/data/demoUser'
import { formatDate } from '@/utils/formatters'
import { profileSchema } from '@/utils/validation'
import type { ProfileValues } from '@/utils/validation'

export function ProfilePage() {
  const { profile, updateProfile } = useAppData()
  const { session } = useAuth()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      preferredLanguage: profile.preferredLanguage,
      timeZone: profile.timeZone,
      emergencyContactName: profile.emergencyContactName ?? '',
      emergencyContactPhone: profile.emergencyContactPhone ?? '',
    },
  })

  useEffect(() => {
    reset({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      preferredLanguage: profile.preferredLanguage,
      timeZone: profile.timeZone,
      emergencyContactName: profile.emergencyContactName ?? '',
      emergencyContactPhone: profile.emergencyContactPhone ?? '',
    })
  }, [profile, reset])

  const onSubmit = (values: ProfileValues) => {
    updateProfile({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      preferredLanguage: values.preferredLanguage,
      timeZone: values.timeZone,
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
    })
    toast.success('Profile saved', 'Your details were updated in this browser.')
  }

  return (
    <PageContainer>
      <PageHeading
        title="Profile"
        eyebrow="Account"
        description="Your contact details and emergency contact. Everything is stored only in this browser."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-4">
          <Card>
            <CardBody className="flex flex-col items-center gap-3 text-center">
              <Avatar name={profile.fullName} color={profile.avatarColor} size="xl" />
              <div>
                <p className="text-base font-bold text-ink">{profile.fullName}</p>
                <p className="text-sm text-muted">
                  {session?.role === 'doctor' ? 'Doctor' : 'Patient'}
                </p>
              </div>
              <dl className="w-full space-y-2 text-left text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate text-ink-soft">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Phone aria-hidden="true" className="size-4 shrink-0" />
                  <span className="text-ink-soft">{profile.phone ?? 'No phone on file'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                  <span className="text-ink-soft">
                    {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Date of birth not set'}
                  </span>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" />
              <p>
                This profile is a fictional sample profile. Editing it only changes data in your browser; it is
                not connected to any real health system.
              </p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={<UserRound className="size-4" />}
            title="Profile information"
            description="Fill in as much or as little as you like — nothing here is required for using the app."
          />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <FieldRow>
                <TextField
                  label="Full name"
                  placeholder="Your name"
                  error={errors.fullName?.message}
                  required
                  {...register('fullName')}
                />
                <TextField
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />
              </FieldRow>

              <FieldRow>
                <TextField
                  label="Phone number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />
              </FieldRow>

              <FieldRow>
                <SelectField
                  label="Preferred language"
                  options={LANGUAGES.map((language) => ({ value: language, label: language }))}
                  error={errors.preferredLanguage?.message}
                  required
                  {...register('preferredLanguage')}
                />
                <SelectField
                  label="Time zone"
                  options={TIME_ZONES.map((zone) => ({ value: zone, label: zone }))}
                  error={errors.timeZone?.message}
                  required
                  {...register('timeZone')}
                />
              </FieldRow>

              <div className="rounded-xl border border-line bg-surface-2 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Emergency contact
                </p>
                <div className="space-y-4">
                  <FieldRow>
                    <TextField
                      label="Contact name"
                      placeholder="Someone a clinician could reach"
                      error={errors.emergencyContactName?.message}
                      {...register('emergencyContactName')}
                    />
                    <TextField
                      label="Contact phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      error={errors.emergencyContactPhone?.message}
                      {...register('emergencyContactPhone')}
                    />
                  </FieldRow>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => reset()} disabled={!isDirty || isSubmitting}>
                  Discard changes
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={!isDirty} leftIcon={<Save className="size-4" />}>
                  Save profile
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}