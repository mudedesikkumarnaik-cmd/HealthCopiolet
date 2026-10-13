import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info, Lock, Mail, Stethoscope, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/common/Button'
import { CheckboxField, TextField } from '@/components/common/FormControls'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuth } from '@/context/AuthContext'
import { signupSchema } from '@/utils/validation'
import type { SignupValues } from '@/utils/validation'
import type { UserRole } from '@/types/user'
import { cn } from '@/utils/cn'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: 'patient',
    label: 'I am a patient',
    description: 'Create a personal health space. Available to everyone.',
    icon: UserRound,
  },
  {
    value: 'doctor',
    label: 'I am a doctor',
    description: 'Create a practice portal for your patients.',
    icon: Stethoscope,
  },
]

export function SignupPage() {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      acceptTerms: false,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (values: SignupValues) => {
    setFormError(null)
    try {
      // Patients and doctors both self-register. The chosen role is bound to
      // the account and cannot be changed later.
      await signup({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      })
      navigate(values.role === 'doctor' ? '/doctor' : '/', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create the account.')
    }
  }

  const busy = isSubmitting || isLoading

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your personal Health Copilot space in about a minute."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </p>
      }
    >
      {formError ? (
        <div className="mb-4">
          <ErrorState title="Could not create the account" message={formError} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">I am creating a</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => {
              const active = selectedRole === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('role', option.value, { shouldValidate: true })}
                  aria-pressed={active}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                    active
                      ? 'border-brand-300 bg-brand-50 ring-1 ring-brand-300 dark:border-brand-500/50 dark:bg-brand-500/15 dark:ring-brand-500/50'
                      : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg',
                      active ? 'bg-brand-600 text-white' : 'bg-surface-2 text-muted',
                    )}
                  >
                    <option.icon aria-hidden="true" className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {errors.role?.message ? (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              {errors.role.message}
            </p>
          ) : null}
        </fieldset>

        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          leadingIcon={<UserRound aria-hidden="true" className="size-4" />}
          error={errors.fullName?.message}
          required
          {...register('fullName')}
        />

        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leadingIcon={<Mail aria-hidden="true" className="size-4" />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          leadingIcon={<Lock aria-hidden="true" className="size-4" />}
          error={errors.password?.message}
          hint="Use at least 8 characters."
          required
          trailingSlot={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          }
          {...register('password')}
        />

        <TextField
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          leadingIcon={<Lock aria-hidden="true" className="size-4" />}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <CheckboxField
          label="I agree to the Terms of Service and Privacy Policy."
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />

        <Button type="submit" fullWidth size="lg" isLoading={busy}>
          Create account
        </Button>
      </form>

      <div className="mt-6 flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          This creates a <strong>{selectedRole === 'doctor' ? 'doctor' : 'patient'}</strong>{' '}
          account. Doctor and patient accounts are separate, and an account stays locked to the role
          you choose — a doctor account opens the practice portal, a patient account opens the
          personal health space.
        </p>
      </div>
    </AuthShell>
  )
}
