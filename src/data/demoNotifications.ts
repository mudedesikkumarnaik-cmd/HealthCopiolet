import type { AppNotification } from '@/types/health'

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

/** Sample in-app notifications. No email/SMS/push is ever sent. */
export const demoNotifications: AppNotification[] = [
  {
    id: 'notif_appt_cardio',
    kind: 'appointment',
    title: 'Cardiology follow-up in 3 days',
    message: 'Dr. Mei Chen · Riverside Cardiology Center, Suite 210.',
    createdAt: minutesAgo(45),
    read: false,
    link: '/appointments',
  },
  {
    id: 'notif_med_evening',
    kind: 'medication',
    title: 'Evening medication reminder',
    message: 'Atorvastatin 20 mg is scheduled for this evening (app reminder).',
    createdAt: minutesAgo(180),
    read: false,
    link: '/prescriptions',
  },
  {
    id: 'notif_record_ready',
    kind: 'system',
    title: 'New record added to your library',
    message: '“Comprehensive metabolic & lipid panel” was added as a metadata-only entry.',
    createdAt: minutesAgo(1_400),
    read: false,
    link: '/records',
  },
  {
    id: 'notif_wellness',
    kind: 'wellness',
    title: 'You are close to your step goal',
    message: '6,240 of 8,000 steps logged so far today.',
    createdAt: minutesAgo(2_200),
    read: true,
    link: '/wellness',
  },
  {
    id: 'notif_welcome',
    kind: 'system',
    title: 'Welcome to Health Copilot',
    message: 'All data shown is fictional and stored only in your browser.',
    createdAt: minutesAgo(4_320),
    read: true,
    link: '/settings',
  },
]
