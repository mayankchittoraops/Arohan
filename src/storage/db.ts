import Dexie, { type Table } from 'dexie'
import { QUOTES } from '@/data/quotes'
import { todayKey } from '@/lib/date'
import type {
  AchievementRecord,
  ActiveWorkout,
  DailyHealth,
  HabitLog,
  Measurement,
  ProgressPhoto,
  QuoteRecord,
  Settings,
  WorkoutHistoryEntry,
} from './types'

/**
 * All of Arohan's data lives here, in IndexedDB, on this device. There is no
 * server and nothing leaves the browser — the only way data moves is through
 * the JSON backup in Settings.
 */
class ArohanDatabase extends Dexie {
  settings!: Table<Settings, number>
  daily_health!: Table<DailyHealth, string>
  workouts!: Table<ActiveWorkout, string>
  workout_history!: Table<WorkoutHistoryEntry, string>
  measurements!: Table<Measurement, string>
  habits!: Table<HabitLog, string>
  achievements!: Table<AchievementRecord, string>
  quotes!: Table<QuoteRecord, string>
  photos!: Table<ProgressPhoto, string>

  constructor() {
    super('arohan')
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
  }
}

export const db = new ArohanDatabase()

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  name: '',
  theme: 'system',
  units: 'metric',
  equipment: ['band'],
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

/** Creates the settings row and quote pool on first run. Safe to call often. */
export function ensureSeeded(): Promise<void> {
  seeding ??= (async () => {
    await db.transaction('rw', db.settings, db.quotes, async () => {
      const existing = await db.settings.get(1)
      if (!existing) {
        await db.settings.put({ ...DEFAULT_SETTINGS, startDate: todayKey() })
      }

      const quoteCount = await db.quotes.count()
      if (quoteCount === 0) {
        await db.quotes.bulkPut(QUOTES.map((q) => ({ ...q, favourite: false })))
      }
    })
  })()

  return seeding
}

/** Wipes every table and reseeds the defaults. */
export async function resetDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.settings,
      db.daily_health,
      db.workouts,
      db.workout_history,
      db.measurements,
      db.habits,
      db.achievements,
      db.quotes,
      db.photos,
    ],
    async () => {
      await Promise.all(db.tables.map((table) => table.clear()))
    },
  )
  seeding = null
  await ensureSeeded()
}
