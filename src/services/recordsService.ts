import type { MedicalRecord, RecordCategory, RecordFileType } from '@/types/health'
import { formatDate, humanize, uid } from '@/utils/formatters'

export const MAX_UPLOAD_MB = 10
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
const ACCEPTED_MIME = ['application/pdf', 'image/png', 'image/jpeg'] as const

export interface RecordCategoryOption {
  value: RecordCategory
  label: string
  description: string
}

export const RECORD_CATEGORIES: RecordCategoryOption[] = [
  { value: 'lab-report', label: 'Laboratory report', description: 'Blood work, urine and other lab results' },
  { value: 'prescription', label: 'Prescription', description: 'Dispensed medication history' },
  { value: 'discharge-summary', label: 'Discharge summary', description: 'Hospital or day-surgery summaries' },
  { value: 'imaging', label: 'Imaging report', description: 'X-ray, MRI, CT, ultrasound and ECG reports' },
  { value: 'consultation-note', label: 'Consultation note', description: 'Notes from a clinic visit' },
  { value: 'vaccination', label: 'Vaccination record', description: 'Immunisation certificates and cards' },
  { value: 'other', label: 'Other document', description: 'Administrative or uncategorised files' },
]

export function categoryLabel(category: RecordCategory): string {
  return RECORD_CATEGORIES.find((c) => c.value === category)?.label ?? humanize(category)
}

export type FileValidationResult =
  | { ok: true; fileType: RecordFileType; sizeKb: number }
  | { ok: false; error: string }

/** Validates file type and size BEFORE anything is added to the library. */
export function validateUploadFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase()
  const ext = name.slice(name.lastIndexOf('.'))
  const extOk = ['.pdf', '.png', '.jpg', '.jpeg'].includes(ext)
  const mimeOk = (ACCEPTED_MIME as readonly string[]).includes(file.type)

  if (!extOk && !mimeOk) {
    return { ok: false, error: 'Unsupported file type. Please choose a PDF, PNG or JPEG file.' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The app limit is ${MAX_UPLOAD_MB} MB.`,
    }
  }
  if (file.size === 0) {
    return { ok: false, error: 'That file appears to be empty.' }
  }

  const fileType: RecordFileType =
    ext === '.png' || file.type === 'image/png'
      ? 'png'
      : ext === '.jpg' || ext === '.jpeg' || file.type === 'image/jpeg'
        ? 'jpeg'
        : 'pdf'

  return { ok: true, fileType, sizeKb: Math.max(1, Math.round(file.size / 1024)) }
}

export interface NewRecordInput {
  title: string
  category: RecordCategory
  provider: string
  date: string
  notes?: string
  fileName: string
  fileType: RecordFileType
  fileSizeKb: number
}

/**
 * Creates a metadata-only record. No OCR or document analysis is performed —
 * the record is stored as a metadata-only entry and labelled as such.
 */
export function createRecord(input: NewRecordInput): MedicalRecord {
  return {
    id: uid('rec'),
    title: input.title.trim(),
    category: input.category,
    provider: input.provider.trim(),
    date: input.date,
    fileType: input.fileType,
    fileName: input.fileName,
    fileSizeKb: input.fileSizeKb,
    notes: input.notes?.trim() || undefined,
    tags: ['uploaded'],
    summary: undefined,
    isDemoPreview: true,
    createdAt: new Date().toISOString(),
  }
}

export interface RecordFilters {
  search?: string
  category?: RecordCategory | 'all'
  from?: string
  to?: string
  order?: 'newest' | 'oldest'
}

export function filterRecords(records: MedicalRecord[], filters: RecordFilters): MedicalRecord[] {
  const search = (filters.search ?? '').trim().toLowerCase()
  const from = filters.from ? new Date(filters.from) : null
  const to = filters.to ? new Date(filters.to) : null

  const filtered = records.filter((record) => {
    if (filters.category && filters.category !== 'all' && record.category !== filters.category) {
      return false
    }
    if (search) {
      const haystack = [record.title, record.provider, record.notes ?? '', ...(record.tags ?? [])]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (from || to) {
      const date = new Date(record.date)
      if (from && date < from) return false
      if (to && date > new Date(to.getTime() + 86_399_999)) return false
    }
    return true
  })

  const order = filters.order ?? 'newest'
  return [...filtered].sort((a, b) =>
    order === 'newest'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}

/**
 * Produces a real, downloadable text file describing a record.
 * Nothing is fabricated about the original document — this is an explicit
 * "metadata export", and the button label says so in the UI.
 */
export function downloadRecordAsText(record: MedicalRecord): void {
  const lines = [
    'HEALTH COPILOT — METADATA EXPORT',
    'This file was generated by Health Copilot.',
    'It contains metadata only — the original document is not available.',
    '',
    `Title:      ${record.title}`,
    `Category:   ${categoryLabel(record.category)}`,
    `Provider:   ${record.provider}`,
    `Date:       ${formatDate(record.date)}`,
    `File:       ${record.fileName} (${record.fileType.toUpperCase()}, ${record.fileSizeKb} KB)`,
    `Notes:      ${record.notes ?? '—'}`,
    '',
    'Sample summary (authored sample copy, not a real analysis):',
    record.summary ?? 'No summary available for this record.',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${record.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-metadata.txt`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
