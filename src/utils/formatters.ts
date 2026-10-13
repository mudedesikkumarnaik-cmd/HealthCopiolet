/** Formatting helpers shared across the app. All user-facing dates go through here. */

const MS_PER_DAY = 86_400_000

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value
  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY)
}

export function formatDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
  if (!value) return '—'
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(value: string | Date | null | undefined): string {
  return formatDate(value, { hour: 'numeric', minute: '2-digit' })
}

/**
 * Converts a Date or ISO datetime into the `YYYY-MM-DDTHH:mm` value accepted
 * by `<input type="datetime-local">`, using the browser's local time zone.
 */
export function toLocalDateTimeValue(value: string | Date): string {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  const min = `${date.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  const date = value ? parseDate(value) : null
  if (!date) return '—'
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60_000)
  if (Math.abs(mins) < 1) return 'just now'
  if (Math.abs(mins) < 60) return mins > 0 ? `${mins}m ago` : `in ${Math.abs(mins)}m`
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : `in ${Math.abs(hours)}h`
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return days > 0 ? `${days}d ago` : `in ${Math.abs(days)}d`
  return formatDate(date)
}

/** Human-friendly "in 3 days" / "2 days ago" label used by appointments. */
export function formatRelativeDay(value: string | Date): string {
  const date = parseDate(value)
  if (!date) return '—'
  const diff = daysBetween(new Date(), date)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1) return `In ${diff} days`
  return `${Math.abs(diff)} days ago`
}

export function formatNumber(value: number, precision = 0): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value)
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

export function formatPercent(value: number, precision = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, precision)}%`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

export function formatFileSize(kb: number): string {
  if (kb < 1024) return `${formatNumber(kb, 0)} KB`
  return `${formatNumber(kb / 1024, 1)} MB`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Age in whole years from an ISO date, or 0 when the date is missing. */
export function ageFromISO(value: string | null | undefined): number {
  if (!value) return 0
  const date = parseDate(value)
  if (!date) return 0
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const beforeBirthday =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())
  if (beforeBirthday) age -= 1
  return Math.max(0, age)
}

/** Title-cases a kebab-case enum value: 'lab-report' -> 'Lab report'. */
export function humanize(value: string): string {
  const spaced = value.replace(/[-_]+/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * A clinician's display name with a title. Names that already start with
 * "Dr."/"Doctor" are used as-is so we never produce "Dr. Dr. …".
 */
export function doctorDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'Your doctor'
  return /^(dr|doctor)\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function percentChange(current: number, previous: number): number {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function round(value: number, precision = 1): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function uid(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}
