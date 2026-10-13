import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileUp, Info, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FieldRow, SelectField, TextAreaField, TextField } from '@/components/common/FormControls'
import { Modal } from '@/components/common/Modal'
import { useAppData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { RECORD_CATEGORIES, validateUploadFile } from '@/services/recordsService'
import type { RecordFileType } from '@/types/health'
import { formatFileSize } from '@/utils/formatters'
import { todayISO } from '@/utils/formatters'
import { uploadMetadataSchema } from '@/utils/validation'
import type { UploadMetadataValues } from '@/utils/validation'

interface ChosenFile {
  name: string
  fileType: RecordFileType
  sizeKb: number
}

export function RecordUpload({ onClose }: { onClose: () => void }) {
  const { addRecord } = useAppData()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [chosenFile, setChosenFile] = useState<ChosenFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UploadMetadataValues>({
    resolver: zodResolver(uploadMetadataSchema),
    defaultValues: {
      title: '',
      category: 'lab-report',
      provider: '',
      date: todayISO(),
      notes: '',
    },
  })

  const acceptFile = (file: File) => {
    const result = validateUploadFile(file)
    if (!result.ok) {
      setFileError(result.error)
      setChosenFile(null)
      return
    }
    setFileError(null)
    setChosenFile({ name: file.name, fileType: result.fileType, sizeKb: result.sizeKb })
    const title = file.name
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim()
    setValue('title', title || 'Untitled document', { shouldValidate: true })
    setValue('date', todayISO())
  }

  const onSubmit = async (values: UploadMetadataValues) => {
    if (!chosenFile) return
    addRecord({
      title: values.title,
      category: values.category,
      provider: values.provider,
      date: values.date,
      notes: values.notes || undefined,
      fileName: chosenFile.name,
      fileType: chosenFile.fileType,
      fileSizeKb: chosenFile.sizeKb,
    })
    toast.success(
      'Record added and shared with your care team',
      'A doctor can now review it; you will be notified once it has been seen.',
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload a medical record"
      description="Add a document to your library. It is shared with your care team to review; files are never uploaded or analysed."
      size="lg"
      footer={
        chosenFile ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting} leftIcon={<FileUp className="size-4" />}>
              Save record
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {!chosenFile ? (
        <div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a PDF, PNG or JPEG file to upload"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              const file = event.dataTransfer.files[0]
              if (file) acceptFile(file)
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging
                ? 'border-brand-400 bg-brand-50/70 dark:border-brand-500/50 dark:bg-brand-500/10'
                : 'border-line-strong hover:border-brand-300 hover:bg-surface-2'
            }`}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <UploadCloud aria-hidden="true" className="size-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Drop a file here or click to browse</p>
              <p className="mt-1 text-xs text-muted">PDF, PNG or JPEG · up to 10 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) acceptFile(file)
                event.target.value = ''
              }}
            />
          </div>
          <div className="mt-3 flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              Nothing is sent over the network — but this entry is published to the shared care-team
              inbox on this device so a doctor can review it. The record is saved as a metadata-only
              entry, clearly labelled metadata-only; no OCR or analysis happens here.
            </p>
          </div>
          {fileError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
              {fileError}
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <UploadCloud aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{chosenFile.name}</p>
              <p className="text-xs text-muted">
                {chosenFile.fileType.toUpperCase()} · {formatFileSize(chosenFile.sizeKb)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChosenFile(null)}
              aria-label="Remove chosen file"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <TextField
            label="Record title"
            placeholder="e.g. Comprehensive metabolic panel"
            error={errors.title?.message}
            required
            {...register('title')}
          />

          <FieldRow>
            <SelectField
              label="Category"
              options={RECORD_CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
              error={errors.category?.message}
              required
              {...register('category')}
            />
            <TextField
              label="Provider / facility"
              placeholder="Hospital, clinic or laboratory name"
              error={errors.provider?.message}
              required
              {...register('provider')}
            />
          </FieldRow>

          <TextField
            label="Record date"
            type="date"
            error={errors.date?.message}
            hint="Choose the date printed on the original document."
            required
            {...register('date')}
          />

          <TextAreaField
            label="Notes (optional)"
            placeholder="Anything you want to remember about this document…"
            error={errors.notes?.message}
            {...register('notes')}
          />
        </form>
      )}
    </Modal>
  )
}