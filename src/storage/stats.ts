import { ACHIEVEMENTS, type AchievementStats } from '@/data/achievements'
import { HABIT_IDS } from '@/data/habits'
import { addDays, daysBetween, type DateKey } from '@/lib/date'
import type { DailyHealth, HabitLog, Measurement, WorkoutHistoryEntry } from './types'

/** Exercise ids that count towards the push-up and plank records. */
const PUSHUP_IDS = ['push-up', 'decline-push-up', 'archer-push-up']
const PLANK_IDS = ['front-plank', 'weighted-plank']

export interface StreakResult {
  current: number
  longest: number
}

/**
 * A day counts as active if a session was completed or the workout/mobility
 * habit was ticked. Today never breaks the streak — it has not finished yet.
 */
export function activeDates(history: WorkoutHistoryEntry[], habits: HabitLog[]): Set<DateKey> {
  const dates = new Set<DateKey>()
  for (const entry of history) dates.add(entry.date)
  for (const log of habits) {
    if (log.done && (log.habitId === 'workout' || log.habitId === 'mobility')) dates.add(log.date)
  }
  return dates
}

export function computeStreak(dates: Set<DateKey>, today: DateKey): StreakResult {
  if (dates.size === 0) return { current: 0, longest: 0 }

  // Current: walk back from today, tolerating an as-yet-unfinished today.
  let cursor = dates.has(today) ? today : addDays(today, -1)
  let current = 0
  while (dates.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  // Longest: sort once and count consecutive runs.
  const sorted = [...dates].toSorted()
  let longest = 0
  let run = 0
  let previous: DateKey | null = null
  for (const date of sorted) {
    run = previous && daysBetween(previous, date) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = date
  }

  return { current, longest }
}

/** Dates on which every habit was ticked. */
export function perfectHabitDays(habits: HabitLog[]): number {
  const byDate = new Map<DateKey, Set<string>>()
  for (const log of habits) {
    if (!log.done) continue
    const set = byDate.get(log.date) ?? new Set<string>()
    set.add(log.habitId)
    byDate.set(log.date, set)
  }
  let count = 0
  for (const done of byDate.values()) {
    if (HABIT_IDS.every((id) => done.has(id))) count++
  }
  return count
}

/** Consecutive days ending today with a logged pain score of 2 or lower. */
export function painFreeRun(daily: DailyHealth[], today: DateKey): number {
  const byDate = new Map(daily.map((d) => [d.date, d]))
  let cursor = today
  let run = 0
  // Today only counts once it has actually been logged.
  if (byDate.get(today)?.pain == null) cursor = addDays(today, -1)
  for (;;) {
    const entry = byDate.get(cursor)
    if (entry?.pain == null || entry.pain > 2) break
    run++
    cursor = addDays(cursor, -1)
  }
  return run
}

/** Best rep count and hold time, from both the logger and the manual tests. */
export function personalRecords(history: WorkoutHistoryEntry[], measurements: Measurement[]) {
  let pushups = 0
  let plankSeconds = 0

  for (const entry of history) {
    for (const log of entry.logs) {
      if (PUSHUP_IDS.includes(log.exerciseId)) {
        for (const set of log.sets) if (set.done) pushups = Math.max(pushups, set.reps ?? 0)
      }
      if (PLANK_IDS.includes(log.exerciseId)) {
        for (const set of log.sets)
          if (set.done) plankSeconds = Math.max(plankSeconds, set.seconds ?? 0)
      }
    }
  }

  for (const m of measurements) {
    pushups = Math.max(pushups, m.pushupMax ?? 0)
    plankSeconds = Math.max(plankSeconds, m.plankSeconds ?? 0)
  }

  return { pushups, plankSeconds }
}

/** Change from the first recorded value to the most recent, as a loss. */
function loss(values: Array<number | null | undefined>): number {
  const numbers = values.filter((v): v is number => v != null)
  if (numbers.length < 2) return 0
  return Math.max(0, numbers[0] - numbers[numbers.length - 1])
}

export interface LastSession {
  date: DateKey
  kind: string
  rpe: number | null
}

/** The most recently finished session, by completion time. */
export function lastSessionOf(history: WorkoutHistoryEntry[]): LastSession | null {
  let latest: WorkoutHistoryEntry | null = null
  for (const entry of history) {
    if (!latest || entry.finishedAt > latest.finishedAt) latest = entry
  }
  return latest ? { date: latest.date, kind: latest.kind, rpe: latest.rpe } : null
}

export interface StatsInput {
  history: WorkoutHistoryEntry[]
  habits: HabitLog[]
  daily: DailyHealth[]
  measurements: Measurement[]
  today: DateKey
  phase: number
  journeyDay: number
}

export function buildAchievementStats(input: StatsInput): AchievementStats {
  const streak = computeStreak(activeDates(input.history, input.habits), input.today)
  const records = personalRecords(input.history, input.measurements)
  const sorted = input.measurements.toSorted((a, b) => a.date.localeCompare(b.date))

  return {
    totalWorkouts: input.history.filter((h) => h.source === 'program' && h.kind !== 'recovery')
      .length,
    totalMobilitySessions: input.history.filter(
      (h) => h.source === 'mobility' || h.kind === 'recovery',
    ).length,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    bestPushups: records.pushups,
    bestPlankSeconds: records.plankSeconds,
    painFreeDays: painFreeRun(input.daily, input.today),
    perfectHabitDays: perfectHabitDays(input.habits),
    totalMinutes: Math.round(
      input.history.reduce((total, h) => total + h.durationSeconds, 0) / 60,
    ),
    weightLostKg: loss(sorted.map((m) => m.weightKg)),
    waistLostCm: loss(sorted.map((m) => m.waistCm)),
    phase: input.phase,
    journeyDay: input.journeyDay,
  }
}

/** Ids that are earned but not yet recorded. */
export function newlyEarned(stats: AchievementStats, unlocked: Set<string>): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.test(stats)).map((a) => a.id)
}
