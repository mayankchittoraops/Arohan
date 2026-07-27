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
  /** Standing height in centimetres. Only used to derive BMI. */
  heightCm: number | null
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

/**
 * One row per day. Every field is optional — a weigh-in day and a tape-measure
 * day are usually different days, and forcing both would mean neither happens.
 *
 * Girths are stored in centimetres and weight in kilograms regardless of the
 * display unit, so switching units never rewrites history.
 *
 * BMI is deliberately absent: it is derived from weight and `settings.heightCm`
 * at display time. Storing it would let it disagree with the weight beside it.
 */
export interface Measurement {
  date: DateKey

  /* Composition — typically all four come off a smart scale at once. */
  weightKg: number | null
  bodyFatPct: number | null
  /**
   * The "Muscle Rate" a consumer scale reports: all lean soft tissue as a
   * share of body weight, excluding only fat and bone mineral. Typically
   * 70–85%. This is *not* skeletal muscle mass percentage, which runs
   * 33–45% — the field was named `skeletalMusclePct` until v3, which was
   * wrong for every scale that feeds it.
   */
  musclePct: number | null
  /** Visceral fat rating, as reported by the scale (roughly 1–59). */
  visceralFat: number | null

  /* Girths, centimetres. Left and right are separate: asymmetry is the point. */
  neckCm: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  armLeftCm: number | null
  armRightCm: number | null
  thighLeftCm: number | null
  thighRightCm: number | null
  calfLeftCm: number | null
  calfRightCm: number | null

  /* Performance tests. */
  pushupMax: number | null
  plankSeconds: number | null

  note: string
  updatedAt: number
}

/** Every numeric field on a measurement, for iterating generically. */
export type MeasurementField = Exclude<keyof Measurement, 'date' | 'note' | 'updatedAt'>

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
