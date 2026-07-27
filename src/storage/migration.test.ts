import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestDatabase } from './db'

/**
 * Proves an existing install survives the upgrade.
 *
 * Each case opens a database at the *old* schema, writes data in the old shape,
 * closes it, then opens it through the current `ArohanDatabase` — which is what
 * a real device does when it loads a new build — and asserts the data is intact
 * and reshaped.
 *
 * Every future schema version needs a case here before it ships.
 */

const opened: Dexie[] = []
const track = <T extends Dexie>(db: T): T => {
  opened.push(db)
  return db
}

afterEach(async () => {
  await Promise.all(opened.splice(0).map((db) => db.close()))
})

/** The v1 schema exactly as Phase 1 shipped it. */
function openV1(name: string) {
  const db = track(new Dexie(name))
  db.version(1).stores({
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
  return db
}

let counter = 0
const uniqueName = () => `arohan-migration-test-${Date.now()}-${counter++}`

describe('v1 → v2', () => {
  it('keeps every record and backfills the new measurement fields', async () => {
    const name = uniqueName()

    const v1 = openV1(name)
    await v1.table('settings').put({
      id: 1,
      name: 'Mayank',
      theme: 'dark',
      units: 'metric',
      equipment: ['band'],
      startDate: '2026-01-05',
      phase: 1,
      phasePromptDismissedFor: null,
      reminders: { workout: '18:30', mobility: null, review: null },
      remindersEnabled: false,
      soundEnabled: true,
      hapticsEnabled: true,
      onboarded: true,
    })
    await v1.table('measurements').put({
      date: '2026-01-10',
      weightKg: 82.5,
      waistCm: 94,
      pushupMax: 18,
      plankSeconds: 55,
      note: 'morning',
      updatedAt: 1,
    })
    await v1.table('daily_health').put({
      date: '2026-01-10',
      sleepHours: 7,
      steps: 8000,
      energy: 4,
      pain: 2,
      notes: '',
      updatedAt: 1,
    })
    await v1.table('workout_history').put({
      id: 'w1',
      date: '2026-01-10',
      source: 'program',
      templateId: 'p1-a',
      templateName: 'Foundation A',
      templateSubtitle: 'Push & legs',
      kind: 'strength',
      startedAt: 1,
      finishedAt: 2,
      durationSeconds: 1800,
      logs: [],
      completedSets: 12,
      plannedSets: 12,
      totalReps: 96,
      volumeKg: 0,
      rpe: 7,
      painBefore: null,
      painAfter: 1,
      note: '',
    })
    await v1.table('habits').put({
      id: '2026-01-10:workout',
      date: '2026-01-10',
      habitId: 'workout',
      done: true,
      updatedAt: 1,
    })
    await v1.table('achievements').put({ id: 'first-workout', unlockedAt: 5, seen: false })
    await v1.table('quotes').put({ id: 'q1', text: 'x', author: 'y', favourite: false })
    await v1.close()

    const v2 = track(createTestDatabase(name))
    await v2.open()
    expect(v2.verno).toBe(2)

    // Nothing lost.
    const settings = await v2.settings.get(1)
    expect(settings?.name).toBe('Mayank')
    expect(settings?.startDate).toBe('2026-01-05')
    expect(await v2.daily_health.get('2026-01-10')).toMatchObject({ sleepHours: 7, pain: 2 })
    expect(await v2.workout_history.get('w1')).toMatchObject({ completedSets: 12 })
    expect(await v2.habits.get('2026-01-10:workout')).toMatchObject({ done: true })

    // Existing measurement values preserved…
    const measurement = await v2.measurements.get('2026-01-10')
    expect(measurement?.weightKg).toBe(82.5)
    expect(measurement?.waistCm).toBe(94)
    expect(measurement?.pushupMax).toBe(18)
    expect(measurement?.note).toBe('morning')

    // …and every new field present and explicitly null, not undefined.
    for (const field of [
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
    ] as const) {
      expect(measurement, field).toHaveProperty(field)
      expect(measurement?.[field], field).toBeNull()
    }

    // Height added to settings so BMI can be derived.
    expect(settings).toHaveProperty('heightCm')
    expect(settings?.heightCm).toBeNull()

    // The unread `seen` flag is gone; the unlock itself survives.
    const achievement = await v2.achievements.get('first-workout')
    expect(achievement?.unlockedAt).toBe(5)
    expect(achievement).not.toHaveProperty('seen')

    // The quotes store is dropped entirely.
    expect(v2.tables.map((t) => t.name)).not.toContain('quotes')
  })

  it('is idempotent — reopening an already-migrated database changes nothing', async () => {
    const name = uniqueName()

    const v1 = openV1(name)
    await v1.table('measurements').put({
      date: '2026-01-10',
      weightKg: 80,
      waistCm: null,
      pushupMax: null,
      plankSeconds: null,
      note: '',
      updatedAt: 1,
    })
    await v1.close()

    const first = track(createTestDatabase(name))
    await first.open()
    await first.measurements.put({
      ...(await first.measurements.get('2026-01-10'))!,
      bodyFatPct: 22.4,
    })
    await first.close()

    const second = track(createTestDatabase(name))
    await second.open()
    const row = await second.measurements.get('2026-01-10')
    expect(row?.weightKg).toBe(80)
    // The backfill must not clobber a value written after the migration.
    expect(row?.bodyFatPct).toBe(22.4)
  })

  it('creates a fresh database straight at the current version', async () => {
    const db = track(createTestDatabase(uniqueName()))
    await db.open()
    expect(db.verno).toBe(2)
    expect(db.tables.map((t) => t.name).toSorted()).toEqual([
      'achievements',
      'daily_health',
      'habits',
      'measurements',
      'photos',
      'settings',
      'workout_history',
      'workouts',
    ])
  })
})
