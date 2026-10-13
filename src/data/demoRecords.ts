import type { MedicalRecord } from '@/types/health'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(9, 0, 0, 0)
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

/**
 * Fictional sample records for the library.
 *
 * The `summary` text is hand-authored sample copy — these
 * documents were never analysed by any software and the app says so in the UI.
 */
export const demoRecords: MedicalRecord[] = [
  {
    id: 'rec_lipid_panel',
    title: 'Comprehensive metabolic & lipid panel',
    category: 'lab-report',
    provider: 'Northbridge Family Health',
    date: daysAgo(6),
    fileType: 'pdf',
    fileName: 'lipid-panel-2025.pdf',
    fileSizeKb: 412,
    notes: 'Annual check-up blood work.',
    tags: ['bloodwork', 'annual'],
    summary:
      'Sample summary: this report groups your cholesterol and blood sugar measurements. Your care team reviews each value against your personal history rather than a single number.',
    isDemoPreview: true,
    createdAt: daysAgo(6),
  },
  {
    id: 'rec_ecg',
    title: 'Resting 12-lead ECG report',
    category: 'imaging',
    provider: 'Riverside Cardiology Center',
    date: daysAgo(19),
    fileType: 'pdf',
    fileName: 'resting-ecg.pdf',
    fileSizeKb: 685,
    notes: 'Routine tracing requested by Dr. Chen.',
    tags: ['cardiology'],
    summary:
      'Sample summary: an ECG records the electrical activity of your heart. Only a qualified clinician should interpret the tracing.',
    isDemoPreview: true,
    createdAt: daysAgo(19),
  },
  {
    id: 'rec_discharge',
    title: 'Day-surgery discharge summary',
    category: 'discharge-summary',
    provider: 'St. Alderday Medical Center',
    date: daysAgo(48),
    fileType: 'pdf',
    fileName: 'discharge-summary.pdf',
    fileSizeKb: 268,
    tags: ['surgery', 'follow-up'],
    summary:
      'Sample summary: discharge instructions typically list follow-up appointments, activity limits and who to contact if symptoms change.',
    isDemoPreview: true,
    createdAt: daysAgo(48),
  },
  {
    id: 'rec_consult',
    title: 'Consultation note — sleep difficulties',
    category: 'consultation-note',
    provider: 'Dr. Priya Raman, MD',
    date: daysAgo(12),
    fileType: 'pdf',
    fileName: 'consult-sleep.pdf',
    fileSizeKb: 154,
    notes: 'Discussed sleep routine and screen time.',
    tags: ['sleep'],
    summary:
      'Sample summary: consultation notes record what was discussed, what was examined and any agreed next steps.',
    isDemoPreview: true,
    createdAt: daysAgo(12),
  },
  {
    id: 'rec_vaccine',
    title: 'Influenza vaccination record',
    category: 'vaccination',
    provider: 'Northbridge Family Health',
    date: daysAgo(74),
    fileType: 'jpeg',
    fileName: 'flu-vaccine-card.jpg',
    fileSizeKb: 890,
    tags: ['immunisation'],
    summary:
      'Sample summary: vaccination records document the date and product given so your history stays complete.',
    isDemoPreview: true,
    createdAt: daysAgo(74),
  },
  {
    id: 'rec_rx_history',
    title: 'Pharmacy prescription history',
    category: 'prescription',
    provider: 'Lakeside Community Pharmacy',
    date: daysAgo(31),
    fileType: 'pdf',
    fileName: 'rx-history.pdf',
    fileSizeKb: 221,
    tags: ['pharmacy'],
    summary:
      'Sample summary: a prescription history lists dispensed medicines, strengths and fill dates.',
    isDemoPreview: true,
    createdAt: daysAgo(31),
  },
  {
    id: 'rec_xray',
    title: 'Chest X-ray — imaging report',
    category: 'imaging',
    provider: 'St. Alderday Medical Center',
    date: daysAgo(63),
    fileType: 'png',
    fileName: 'chest-xray-report.png',
    fileSizeKb: 1240,
    notes: 'Requested during a respiratory infection.',
    tags: ['radiology'],
    summary:
      'Sample summary: radiology reports describe what the images show and any recommended follow-up.',
    isDemoPreview: true,
    createdAt: daysAgo(63),
  },
  {
    id: 'rec_insurance',
    title: 'Insurance coverage letter',
    category: 'other',
    provider: 'Meridian Health Plan',
    date: daysAgo(90),
    fileType: 'pdf',
    fileName: 'coverage-letter.pdf',
    fileSizeKb: 96,
    tags: ['administrative'],
    summary:
      'Sample summary: administrative documents are stored alongside clinical records so everything is in one place.',
    isDemoPreview: true,
    createdAt: daysAgo(90),
  },
]
