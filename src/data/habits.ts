import type { HabitDefinition } from './types'

/** The six daily habits. Small enough to keep, specific enough to check off. */
export const HABITS: HabitDefinition[] = [
  {
    id: 'workout',
    name: 'Workout',
    detail: "Today's session, done",
    icon: 'dumbbell',
    accent: 'accent',
  },
  {
    id: 'mobility',
    name: 'Mobility',
    detail: 'Any routine counts',
    icon: 'wind',
    accent: 'teal',
  },
  {
    id: 'walk',
    name: 'Walk',
    detail: 'Twenty minutes outside',
    icon: 'footprints',
    accent: 'mint',
  },
  {
    id: 'hydration',
    name: 'Hydration',
    detail: 'Two to three litres',
    icon: 'droplet',
    accent: 'sky',
  },
  {
    id: 'sleep',
    name: 'Sleep before 11 PM',
    detail: 'Lights out, screen down',
    icon: 'moon',
    accent: 'violet',
  },
  {
    id: 'stretch',
    name: 'Stretch',
    detail: 'Five minutes, anywhere',
    icon: 'stretch-horizontal',
    accent: 'amber',
  },
]

export const HABIT_IDS = HABITS.map((h) => h.id)
