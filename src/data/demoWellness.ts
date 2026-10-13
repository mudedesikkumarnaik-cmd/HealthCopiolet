import type { Habit, WellnessGoal } from '@/types/health'
import { todayISO } from '@/utils/formatters'

/**
 * Fictional wellness goals. These are personal tracking targets, NOT medical
 * prescriptions. Users can freely edit or remove every entry.
 */
export const demoWellnessGoals: WellnessGoal[] = [
  {
    id: 'goal_steps',
    kind: 'steps',
    title: 'Daily steps',
    unit: 'steps',
    target: 8000,
    current: 6240,
    period: 'daily',
    isCustom: false,
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'goal_sleep',
    kind: 'sleep',
    title: 'Sleep',
    unit: 'hours',
    target: 7.5,
    current: 6.8,
    period: 'daily',
    isCustom: false,
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'goal_hydration',
    kind: 'hydration',
    title: 'Hydration',
    unit: 'glasses',
    target: 8,
    current: 5,
    period: 'daily',
    isCustom: false,
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'goal_activity',
    kind: 'activity',
    title: 'Moderate activity',
    unit: 'minutes',
    target: 30,
    current: 22,
    period: 'daily',
    isCustom: false,
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'goal_stretch',
    kind: 'custom',
    title: 'Evening stretch routine',
    unit: 'sessions',
    target: 5,
    current: 3,
    period: 'weekly',
    isCustom: true,
    createdAt: '2024-03-11T18:30:00.000Z',
  },
]

export const demoHabits: Habit[] = [
  { id: 'habit_water', label: 'Drink water with each meal', icon: 'Droplets', completedDates: [] },
  { id: 'habit_walk', label: 'Take a 20-minute walk', icon: 'Footprints', completedDates: [] },
  { id: 'habit_screens', label: 'Screens off 30 min before bed', icon: 'Moon', completedDates: [] },
  { id: 'habit_stretch', label: 'Stretch before bed', icon: 'Activity', completedDates: [] },
  { id: 'habit_gratitude', label: 'Note one good thing today', icon: 'Sparkles', completedDates: [] },
]

/** Seed a few completed habits so today's checklist looks alive. */
export function seededHabits(): Habit[] {
  const today = todayISO()
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
  })()
  return demoHabits.map((habit, index) => ({
    ...habit,
    completedDates: index < 2 ? [today] : index === 2 ? [yesterday] : [],
  }))
}
