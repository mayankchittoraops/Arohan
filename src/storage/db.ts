import Dexie, { type Table } from 'dexie'
import { todayKey } from '@/lib/date'
import type {
  AchievementRecord,
  ActiveWorkout,
  DailyHealth,
  HabitLog,
  Measurement,
  ProgressPhoto,
  Settings,
  WorkoutHistoryEntry,
} from './types'

/**
 * All of Arohan's data lives here, in IndexedDB, on this device. There is no
 * server and nothing leaves the browser — the only way data moves is through
 * the JSON backup in Settings.
 *
 * ## Adding a version
 *
 * Never edit an existing `version(n).stores()` block: Dexie replays versions in
 * order on an existing database, so changing history changes what already
 * installed clients upgrade *from*. Add a new `version(n + 1)` instead, declare
 * every store whose indexes changed (and `null` for any store being dropped),
 * and put data backfill in `.upgrade()`. Then add a case to
 * `src/storage/migration.test.ts` that seeds the old shape and asserts the new
 * one — that test is what stands between a schema change and a broken install.
 */
class ArohanDatabase extends Dexie {
  settings!: Table<Settings, number>
  daily_health!: Table<DailyHealth, string>
  workouts!: Table<ActiveWorkout, string>
  workout_history!: Table<WorkoutHistoryEntry, string>
  measurements!: Table<Measurement, string>
  habits!: Table<HabitLog, string>
  achievements!: Table<AchievementRecord, string>
  photos!: Table<ProgressPhoto, string>

  constructor(name = 'arohan') {
    super(name)

    // v1 — shipped in Phase 1. Left exactly as it was.
    this.version(1).stores({
      settings: 'id',
      daily_health: 'date',
      workouts: 'id, date, source',
      workout_history: 'id, date, templateId, kind, source',
      measurements: 'date',
      habits: 'id, date, habitId, [date+habitId]',
      achievements: 'id, unlockedAt',
      quotes: 'id, favourite',
      photos: 'id, date',
    })

    // v2 — full body-composition tracking; drops what nothing read.
    this.version(2)
      .stores({
        // `quotes` was written and backed up but never read: the daily quote
        // comes from the static module. Dropping the store entirely.
        quotes: null,
        // The [date+habitId] compound index was never queried; the primary key
        // is already `${date}:${habitId}`.
        habits: 'id, date, habitId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('measurements')
          .toCollection()
          .modify((m: Record<string, unknown>) => {
            for (const field of NEW_MEASUREMENT_FIELDS) m[field] ??= null
          })

        await tx
          .table('settings')
          .toCollection()
          .modify((s: Record<string, unknown>) => {
            s.heightCm ??= null
          })

        // `seen` was written on unlock and never read.
        await tx
          .table('achievements')
          .toCollection()
          .modify((a: Record<string, unknown>) => {
            delete a.seen
          })
      })
  }
}

/** Added in v2. Kept beside the migration so the two cannot drift apart. */
const NEW_MEASUREMENT_FIELDS = [
  'bodyFatPct',
  'skeletalMusclePct',
  'visceralFat',
  'neckCm',
  'chestCm',
  'hipsCm',
  'armLeftCm',
  'armRightCm',
  'thighLeftCm',
  'thighRightCm',
  'calfLeftCm',
  'calfRightCm',
] as const

export const SCHEMA_VERSION = 2

export const db = new ArohanDatabase()

/** A separate database instance, for tests only. */
export function createTestDatabase(name: string) {
  return new ArohanDatabase(name)
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  name: '',
  theme: 'system',
  units: 'metric',
  equipment: ['band'],
  heightCm: null,
  startDate: todayKey(),
  phase: 1,
  phasePromptDismissedFor: null,
  reminders: { workout: '18:30', mobility: '09:00', review: '21:30' },
  remindersEnabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  onboarded: false,
}

let seeding: Promise<void> | null = null

/** Creates the settings row on first run. Safe to call often. */
export function ensureSeeded(): Promise<void> {
  seeding ??= (async () => {
    const existing = await db.settings.get(1)
    if (!existing) await db.settings.put({ ...DEFAULT_SETTINGS, startDate: todayKey() })
  })()

  return seeding
}

/** Wipes every table and reseeds the defaults. */
export async function resetDatabase(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
  seeding = null
  await ensureSeeded()
}
