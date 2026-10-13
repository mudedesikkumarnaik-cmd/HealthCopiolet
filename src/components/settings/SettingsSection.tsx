import type { ReactNode } from 'react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Toggle } from '@/components/common/Toggle'

export function SettingsSection({
  title,
  description,
  icon,
  children,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} icon={icon} action={action} />
      <CardBody className="divide-y divide-line">{children}</CardBody>
    </Card>
  )
}

export function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled,
  divider = false,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  divider?: boolean
}) {
  return (
    <div className={divider ? 'py-4 first:pt-0 last:pb-0' : 'py-0'}>
      <Toggle label={label} description={description} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}