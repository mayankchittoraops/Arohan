import type { Equipment, PhaseNumber, Section, WorkoutKind } from '@/data/types'
import type { DateKey } from '@/lib/date'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Units = 'metric' | 'imperial'

export interface ReminderTimes {
  /** `HH:MM`, or null when that reminder is off. */
  workout: string | null
  mobility: string | null
  review: string | null
}

/** Single row, always id 1. */
export interface Settings {
  id: 1
  name: string
  theme: ThemeMode
  units: Units
  equipment: Equipment[]
  /** Day one of the twelve-month journey. */
  startDate: DateKey
  /** The furthest phase unlocked. Never advances without being asked. */
  phase: PhaseNumber
  /** Set when the calendar has moved past `phase` and we have not asked yet. */
  phasePromptDismissedFor: PhaseNumber | null
  reminders: ReminderTimes
  remindersEnabled: boolean
  soundEnabled: boolean
  hapticsEnabled: boolean
  onboarded: boolean
}

export interface DailyHealth {
  date: DateKey
  sleepHours: number | null
  steps: number | null
  /** 1 (empty) to 5 (excellent). */
  energy: number | null
  /** 0 (none) to 10 (severe) — lower back unless noted. */
  pain: number | null
  notes: string
  updatedAt: number
}

export interface SetLog {
  done: boolean
  reps?: number
  seconds?: number
  weightKg?: number
}

export interface ExerciseLog {
  exerciseId: string
  section: Section
  plannedSets: number
  plannedReps?: number
  plannedSeconds?: number
  restSeconds: number
  sets: SetLog[]
  /** The programme's coaching hint for this movement. Not editable. */
  coachNote?: string
  /** Whatever you type during the session. */
  note?: string
  skipped: boolean
}

export type SessionSource = 'program' | 'mobility'

/** The autosaved, in-progress session. At most one exists at a time. */
export interface ActiveWorkout {
  id: string
  date: DateKey
  source: SessionSource
  templateId: string
  templateName: string
  templateSubtitle: string
  kind: WorkoutKind | 'mobility'
  startedAt: number
  updatedAt: number
  /** Index into `logs` of the exercise on screen. */
  currentIndex: number
  /** Accumulated work time, excluding any period the session was paused. */
  elapsedSeconds: number
  /** Timestamp the clock last resumed, or null while paused. */
  runningSince: number | null
  logs: ExerciseLog[]
  painBefore: number | null
}

export interface WorkoutHistoryEntry {
  id: string
  date: DateKey
  source: SessionSource
  templateId: string
  templateName: string
  templateSubtitle: string
  kind: WorkoutKind | 'mobility'
  startedAt: number
  finishedAt: number
  durationSeconds: number
  logs: ExerciseLog[]
  completedSets: number
  plannedSets: number
  totalReps: number
  volumeKg: number
  /** Perceived effort, 1–10. */
  rpe: number | null
  painBefore: number | null
  painAfter: number | null
  note: string
}

export interface Measurement {
  date: DateKey
  weightKg: number | null
  waistCm: number | null
  pushupMax: number | null
  plankSeconds: number | null
  note: string
  updatedAt: number
}

export interface HabitLog {
  /** `${date}:${habitId}` */
  id: string
  date: DateKey
  habitId: string
  done: boolean
  updatedAt: number
}

export interface AchievementRecord {
  id: string
  unlockedAt: number
  /** False until the unlock has been shown once. */
  seen: boolean
}

export interface QuoteRecord {
  id: string
  text: string
  author: string
  favourite: boolean
}

export interface ProgressPhoto {
  id: string
  date: DateKey
  blob: Blob
  width: number
  height: number
  note: string
  createdAt: number
}
