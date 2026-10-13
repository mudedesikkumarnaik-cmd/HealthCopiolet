import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info, Lock, Mail, Stethoscope, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/common/Button'
import { CheckboxField, TextField } from '@/components/common/FormControls'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuth } from '@/context/AuthContext'
import { loginSchema } from '@/utils/validation'
import type { LoginValues } from '@/utils/validation'
import type { UserRole } from '@/types/user'
import { cn } from '@/utils/cn'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: 'patient',
    label: 'I am a patient',
    description: 'Manage my health records, medicines and appointments.',
    icon: UserRound,
  },
  {
    value: 'doctor',
    label: 'I am a doctor',
    description: 'Open my practice portal for patients and schedule.',
    icon: Stethoscope,
  },
]

export function LoginPage() {
  const { login, forgotPassword, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo =
    (location.state as { from?: string } | null)?.from && (location.state as { from: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'patient', email: '', password: '', rememberMe: true },
  })

  const selectedRole = watch('role')

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    setResetSent(null)
    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  const handleForgotPassword = async () => {
    setFormError(null)
    setResetSent(null)
    const email = getValues('email')
    try {
      await forgotPassword(email)
      setResetSent(email)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to send a reset link.')
    }
  }

  const busy = isSubmitting || isLoading

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Health Copilot account."
      footer={
        <div className="space-y-3">
          <p className="text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Create a new account
            </Link>
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Patient and doctor credentials are different and stay separate — a patient account only
            signs in as a patient, and a doctor account only as a doctor.
          </p>
        </div>
      }
    >
      {formError ? (
        <div className="mb-4">
          <ErrorState title="Could not sign in" message={formError} />
        </div>
      ) : null}

      {resetSent ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          If an account exists, we sent a password reset link to <strong>{resetSent}</strong>.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">I am signing in as</legend>
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
          autoComplete="current-password"
          placeholder="Enter your password"
          leadingIcon={<Lock aria-hidden="true" className="size-4" />}
          error={errors.password?.message}
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <CheckboxField label="Remember me on this device" {...register('rememberMe')} />
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={busy}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Choose patient or doctor once, then sign in. Each account is locked to one role, and your
          health data stays private to your account.
        </p>
      </div>
    </AuthShell>
  )
}