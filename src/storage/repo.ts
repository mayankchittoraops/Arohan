import { db, DEFAULT_SETTINGS, ensureSeeded } from './db'
import type { DateKey } from '@/lib/date'
import type {
  ActiveWorkout,
  DailyHealth,
  HabitLog,
  Measurement,
  ProgressPhoto,
  Settings,
  WorkoutHistoryEntry,
} from './types'

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/* -------------------------------------------------------------- settings */

export async function getSettings(): Promise<Settings> {
  await ensureSeeded()
  return (await db.settings.get(1)) ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = { ...current, ...patch, id: 1 }
  await db.settings.put(next)
  return next
}

/* ---------------------------------------------------------- daily health */

export const EMPTY_DAILY = (date: DateKey): DailyHealth => ({
  date,
  sleepHours: null,
  steps: null,
  energy: null,
  pain: null,
  notes: '',
  updatedAt: 0,
})

export async function getDaily(date: DateKey): Promise<DailyHealth> {
  return (await db.daily_health.get(date)) ?? EMPTY_DAILY(date)
}

export async function saveDaily(
  date: DateKey,
  patch: Partial<Omit<DailyHealth, 'date' | 'updatedAt'>>,
): Promise<DailyHealth> {
  const current = await getDaily(date)
  const next: DailyHealth = { ...current, ...patch, date, updatedAt: Date.now() }
  await db.daily_health.put(next)
  return next
}

/* ---------------------------------------------------------------- habits */

export function habitsForDate(date: DateKey): Promise<HabitLog[]> {
  return db.habits.where('date').equals(date).toArray()
}

export async function setHabit(date: DateKey, habitId: string, done: boolean): Promise<void> {
  await db.habits.put({ id: `${date}:${habitId}`, date, habitId, done, updatedAt: Date.now() })
}

export async function toggleHabit(date: DateKey, habitId: string): Promise<boolean> {
  const existing = await db.habits.get(`${date}:${habitId}`)
  const next = !existing?.done
  await setHabit(date, habitId, next)
  return next
}

/** Habit ids ticked on a given day. */
export function doneHabitIds(logs: HabitLog[]): Set<string> {
  return new Set(logs.filter((l) => l.done).map((l) => l.habitId))
}

/* -------------------------------------------------------- active session */

export async function getActiveSession(): Promise<ActiveWorkout | undefined> {
  const all = await db.workouts.toArray()
  if (all.length <= 1) return all[0]
  // `startSession` clears the table first, so more than one row should be
  // impossible. If it ever happens, the newest wins rather than a random one.
  return all.toSorted((a, b) => b.startedAt - a.startedAt)[0]
}

export async function saveActiveSession(session: ActiveWorkout): Promise<void> {
  await db.workouts.put({ ...session, updatedAt: Date.now() })
}

export async function startSession(session: ActiveWorkout): Promise<ActiveWorkout> {
  await db.workouts.clear()
  await db.workouts.put(session)
  return session
}

export async function discardActiveSession(): Promise<void> {
  await db.workouts.clear()
}

export async function finishSession(entry: WorkoutHistoryEntry): Promise<void> {
  await db.transaction('rw', db.workouts, db.workout_history, async () => {
    await db.workout_history.put(entry)
    await db.workouts.clear()
  })
}

/* --------------------------------------------------------------- history */

export function historyForDate(date: DateKey): Promise<WorkoutHistoryEntry[]> {
  return db.workout_history.where('date').equals(date).toArray()
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await db.workout_history.delete(id)
}

/* ---------------------------------------------------------- measurements */

export const EMPTY_MEASUREMENT = (date: DateKey): Measurement => ({
  date,
  weightKg: null,
  bodyFatPct: null,
  musclePct: null,
  visceralFat: null,
  neckCm: null,
  chestCm: null,
  waistCm: null,
  hipsCm: null,
  armLeftCm: null,
  armRightCm: null,
  thighLeftCm: null,
  thighRightCm: null,
  calfLeftCm: null,
  calfRightCm: null,
  pushupMax: null,
  plankSeconds: null,
  note: '',
  updatedAt: 0,
})

export async function getMeasurement(date: DateKey): Promise<Measurement> {
  return (await db.measurements.get(date)) ?? EMPTY_MEASUREMENT(date)
}

export async function saveMeasurement(
  date: DateKey,
  patch: Partial<Omit<Measurement, 'date' | 'updatedAt'>>,
): Promise<Measurement> {
  const current = await getMeasurement(date)
  const next: Measurement = { ...current, ...patch, date, updatedAt: Date.now() }
  await db.measurements.put(next)
  return next
}

export function allMeasurements(): Promise<Measurement[]> {
  return db.measurements.orderBy('date').toArray()
}

/* ---------------------------------------------------------- achievements */

export async function unlockAchievement(id: string): Promise<void> {
  const existing = await db.achievements.get(id)
  if (existing) return
  await db.achievements.put({ id, unlockedAt: Date.now() })
}

/* ---------------------------------------------------------------- photos */

export function allPhotos(): Promise<ProgressPhoto[]> {
  // oxlint-disable-next-line unicorn/no-array-reverse -- Dexie collection, not an array
  return db.photos.orderBy('date').reverse().toArray()
}

export async function addPhoto(date: DateKey, blob: Blob, width: number, height: number, note = '') {
  const photo: ProgressPhoto = { id: uid(), date, blob, width, height, note, createdAt: Date.now() }
  await db.photos.put(photo)
  return photo
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id)
}
