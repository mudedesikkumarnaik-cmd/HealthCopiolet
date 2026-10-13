import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FieldRow, SelectField, TextField } from '@/components/common/FormControls'
import { Modal } from '@/components/common/Modal'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import type { GoalKind, WellnessGoal } from '@/types/health'
import { goalSchema } from '@/utils/validation'
import type { GoalInput, GoalValues } from '@/utils/validation'

const KINDS: Array<{
  value: GoalKind
  label: string
  defaultTitle: string
  defaultUnit: string
  defaultTarget: number
}> = [
  { value: 'steps', label: 'Steps', defaultTitle: 'Daily steps', defaultUnit: 'steps', defaultTarget: 8000 },
  { value: 'sleep', label: 'Sleep', defaultTitle: 'Sleep', defaultUnit: 'hours', defaultTarget: 7.5 },
  { value: 'hydration', label: 'Hydration', defaultTitle: 'Hydration', defaultUnit: 'glasses', defaultTarget: 8 },
  { value: 'activity', label: 'Activity', defaultTitle: 'Moderate activity', defaultUnit: 'minutes', defaultTarget: 30 },
  { value: 'custom', label: 'Custom goal', defaultTitle: 'My custom goal', defaultUnit: 'units', defaultTarget: 10 },
]

export function GoalForm({
  open,
  onClose,
  goal,
}: {
  open: boolean
  onClose: () => void
  goal?: WellnessGoal | null
}) {
  const { addGoal, updateGoal } = useAppData()
  const toast = useToast()
  const isEditing = Boolean(goal)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalInput, unknown, GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: '', kind: 'steps', unit: 'steps', target: 8000, current: 0, period: 'daily' },
  })

  const selectedKind = watch('kind')

  useEffect(() => {
    if (!open) return
    if (goal) {
      reset({
        title: goal.title,
        kind: goal.kind,
        unit: goal.unit,
        target: goal.target,
        current: goal.current,
        period: goal.period,
      })
    } else {
      const preset = KINDS[0]
      reset({ title: preset.defaultTitle, kind: preset.value, unit: preset.defaultUnit, target: preset.defaultTarget, current: 0, period: 'daily' })
    }
  }, [open, goal, reset])

  const handleKindChange = (kind: GoalKind) => {
    setValue('kind', kind)
    const preset = KINDS.find((option) => option.value === kind)
    if (preset) {
      setValue('title', preset.defaultTitle)
      setValue('unit', preset.defaultUnit)
      setValue('target', preset.defaultTarget)
    }
  }

  const onSubmit = (values: GoalValues) => {
    if (goal) {
      updateGoal(goal.id, values)
      toast.success('Goal updated', `${values.title} was saved.`)
    } else {
      addGoal({ ...values, isCustom: values.kind === 'custom' })
      toast.success('Goal added', `${values.title} is now on your board.`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit goal' : 'Add a goal'}
      description="Personal tracking targets for the app — not medical prescriptions."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting} leftIcon={<Target className="size-4" />}>
            {isEditing ? 'Save changes' : 'Add goal'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {!isEditing ? (
          <SelectField
            label="Goal type"
            options={KINDS.map((kind) => ({ value: kind.value, label: kind.label }))}
            onChange={(event) => handleKindChange(event.target.value as GoalKind)}
            value={selectedKind}
            required
          />
        ) : null}

        <TextField
          label="Goal name"
          placeholder="e.g. Evening stretching"
          error={errors.title?.message}
          required
          {...register('title')}
        />

        <FieldRow>
          <TextField
            label="Unit"
            placeholder="e.g. minutes"
            error={errors.unit?.message}
            required
            {...register('unit')}
          />
          <SelectField
            label="Frequency"
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
            error={errors.period?.message}
            required
            {...register('period')}
          />
        </FieldRow>

        <FieldRow>
          <TextField
            label="Target"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="e.g. 8000"
            error={errors.target?.message}
            required
            {...register('target', { valueAsNumber: true })}
          />
          <TextField
            label="Current progress"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="e.g. 5200"
            error={errors.current?.message}
            required
            {...register('current', { valueAsNumber: true })}
          />
        </FieldRow>
      </form>
    </Modal>
  )
}