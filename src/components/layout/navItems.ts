import {
  Activity,
  Bot,
  CalendarDays,
  ClipboardList,
  FileUp,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Pill,
  Settings,
  Target,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  description: string
}

/** Primary product navigation (rendered in the sidebar and mobile drawer). */
export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Your health at a glance',
  },
  {
    label: 'AI Health Assistant',
    path: '/assistant',
    icon: Bot,
    description: 'Ask questions in plain language',
  },
  {
    label: 'Medical Records',
    path: '/records',
    icon: FolderOpen,
    description: 'Organise reports and documents',
  },
  {
    label: 'Prescriptions',
    path: '/prescriptions',
    icon: Pill,
    description: 'Track medicines and doses',
  },
  {
    label: 'Appointments',
    path: '/appointments',
    icon: CalendarDays,
    description: 'Upcoming and past visits',
  },
  {
    label: 'Health Analytics',
    path: '/analytics',
    icon: LineChart,
    description: 'Trends over time',
  },
  {
    label: 'Wellness & Goals',
    path: '/wellness',
    icon: Target,
    description: 'Habits and personal targets',
  },
]

/** Account-level navigation pinned to the bottom of the sidebar. */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'Profile', path: '/profile', icon: UserRound, description: 'Your details' },
  { label: 'Settings', path: '/settings', icon: Settings, description: 'Preferences and privacy' },
  { label: 'Help & Support', path: '/help', icon: LifeBuoy, description: 'FAQs and about' },
]

/** Doctor portal navigation — shown only to doctor accounts. */
export const DOCTOR_NAV: NavItem[] = [
  {
    label: 'Overview',
    path: '/doctor',
    icon: LayoutDashboard,
    description: 'Your practice at a glance',
  },
  {
    label: 'Patients',
    path: '/doctor/patients',
    icon: Users,
    description: 'Roster, records and medicines',
  },
  {
    label: 'Requests',
    path: '/doctor/requests',
    icon: ClipboardList,
    description: 'Accept or cancel visit requests',
  },
  {
    label: 'Patient reports',
    path: '/doctor/reports',
    icon: FileUp,
    description: 'Reports patients have shared',
  },
  {
    label: 'Prescriptions',
    path: '/doctor/prescriptions',
    icon: Pill,
    description: 'Prescribe medication to patients',
  },
  {
    label: 'Appointments',
    path: '/doctor/appointments',
    icon: CalendarDays,
    description: 'The full visit calendar',
  },
]

export const BRAND_ICON = Activity

/** Resolves the nav entry for a pathname so the header can show a title. */
export function findNavItem(pathname: string): NavItem | undefined {
  return [...PRIMARY_NAV, ...DOCTOR_NAV, ...SECONDARY_NAV].find(
    (item) => item.path === pathname || (pathname.startsWith(item.path) && item.path !== '/'),
  )
}
