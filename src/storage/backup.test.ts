import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { BACKUP_VERSION, BackupError, exportBackup, importBackup } from './backup'
import { db, resetDatabase } from './db'
import { EMPTY_MEASUREMENT, saveDaily, saveMeasurement, setHabit, updateSettings } from './repo'
import type { WorkoutHistoryEntry } from './types'

const historyEntry: WorkoutHistoryEntry = {
  id: 'w1',
  date: '2026-01-10',
  source: 'program',
  templateId: 'p1-a',
  templateName: 'Foundation A',
  templateSubtitle: 'Push & legs',
  kind: 'strength',
  startedAt: 100,
  finishedAt: 2000,
  durationSeconds: 1900,
  logs: [
    {
      exerciseId: 'push-up',
      section: 'main',
      plannedSets: 3,
      plannedReps: 10,
      restSeconds: 60,
      skipped: false,
      sets: [
        { done: true, reps: 10 },
        { done: true, reps: 9, weightKg: 5 },
        { done: false, reps: 10 },
      ],
      note: 'felt strong',
    },
  ],
  completedSets: 2,
  plannedSets: 3,
  totalReps: 19,
  volumeKg: 45,
  rpe: 7,
  painBefore: 2,
  painAfter: 1,
  note: 'good session',
}

async function seed() {
  await updateSettings({ name: 'Mayank', heightCm: 178, units: 'metric', onboarded: true })
  await saveDaily('2026-01-10', { sleepHours: 7.5, steps: 9000, energy: 4, pain: 2, notes: 'ok' })
  await saveMeasurement('2026-01-10', {
    weightKg: 82.5,
    bodyFatPct: 24.1,
    skeletalMusclePct: 38.2,
    visceralFat: 9,
    neckCm: 39,
    chestCm: 102,
    waistCm: 94,
    hipsCm: 99,
    armLeftCm: 33.5,
    armRightCm: 34,
    thighLeftCm: 56,
    thighRightCm: 56.5,
    calfLeftCm: 37,
    calfRightCm: 37.5,
    pushupMax: 18,
    plankSeconds: 55,
    note: 'morning',
  })
  await db.workout_history.put(historyEntry)
  await setHabit('2026-01-10', 'workout', true)
  await db.achievements.put({ id: 'first-workout', unlockedAt: 1234 })
}

beforeEach(async () => {
  await resetDatabase()
})

describe('export', () => {
  it('carries every table and stamps the current version', async () => {
    await seed()
    const backup = await exportBackup()

    expect(backup.app).toBe('arohan')
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(Object.keys(backup.data).toSorted()).toEqual([
      'achievements',
      'daily_health',
      'habits',
      'measurements',
      'photos',
      'settings',
      'workout_history',
      'workouts',
    ])
    expect(backup.data.measurements).toHaveLength(1)
    expect(backup.data.workout_history).toHaveLength(1)
  })

  it('is valid JSON with no undefined holes', () => {
    return seed()
      .then(exportBackup)
      .then((backup) => {
        const text = JSON.stringify(backup)
        expect(text).not.toContain('undefined')
        expect(() => JSON.parse(text)).not.toThrow()
      })
  })
})

describe('round trip', () => {
  it('restores every field exactly, including nested set logs', async () => {
    await seed()
    const before = await exportBackup()

    await resetDatabase()
    expect(await db.workout_history.count()).toBe(0)

    const result = await importBackup(JSON.stringify(before))
    expect(result.counts.workouts).toBe(1)

    const settings = await db.settings.get(1)
    expect(settings?.name).toBe('Mayank')
    expect(settings?.heightCm).toBe(178)

    const measurement = await db.measurements.get('2026-01-10')
    expect(measurement).toEqual({
      ...EMPTY_MEASUREMENT('2026-01-10'),
      weightKg: 82.5,
      bodyFatPct: 24.1,
      skeletalMusclePct: 38.2,
      visceralFat: 9,
      neckCm: 39,
      chestCm: 102,
      waistCm: 94,
      hipsCm: 99,
      armLeftCm: 33.5,
      armRightCm: 34,
      thighLeftCm: 56,
      thighRightCm: 56.5,
      calfLeftCm: 37,
      calfRightCm: 37.5,
      pushupMax: 18,
      plankSeconds: 55,
      note: 'morning',
      updatedAt: measurement!.updatedAt,
    })

    const restored = await db.workout_history.get('w1')
    expect(restored).toEqual(historyEntry)
    expect(restored?.logs[0].sets[1].weightKg).toBe(5)

    expect(await db.daily_health.get('2026-01-10')).toMatchObject({ sleepHours: 7.5, pain: 2 })
    expect(await db.habits.get('2026-01-10:workout')).toMatchObject({ done: true })
    expect(await db.achievements.get('first-workout')).toMatchObject({ unlockedAt: 1234 })
  })

  it('replaces rather than merges', async () => {
    await seed()
    const backup = JSON.stringify(await exportBackup())

    await saveDaily('2026-02-02', { sleepHours: 6 })
    expect(await db.daily_health.count()).toBe(2)

    await importBackup(backup)
    expect(await db.daily_health.count()).toBe(1)
    expect(await db.daily_health.get('2026-02-02')).toBeUndefined()
  })

  it('survives a second round trip unchanged', async () => {
    await seed()
    const first = JSON.stringify(await exportBackup())
    await importBackup(first)
    const second = await exportBackup()

    // exportedAt is a timestamp, so compare the payload only.
    expect(second.data).toEqual(JSON.parse(first).data)
  })

  it('still restores a settings row when the backup had none', async () => {
    await seed()
    const backup = await exportBackup()
    backup.data.settings = []
    await importBackup(JSON.stringify(backup))
    // ensureSeeded must put the defaults back rather than leaving no settings.
    expect(await db.settings.get(1)).toBeDefined()
  })
})

describe('backwards compatibility', () => {
  it('accepts a v1 backup, including its now-removed quotes table', async () => {
    await seed()
    const backup = await exportBackup()
    const v1 = {
      ...backup,
      version: 1,
      data: {
        ...backup.data,
        quotes: [{ id: 'q1', text: 'x', author: 'y', favourite: false }],
        measurements: [
          {
            date: '2026-01-10',
            weightKg: 80,
            waistCm: 95,
            pushupMax: 12,
            plankSeconds: 40,
            note: '',
            updatedAt: 1,
          },
        ],
      },
    }

    await resetDatabase()
    await importBackup(JSON.stringify(v1))

    const measurement = await db.measurements.get('2026-01-10')
    expect(measurement?.weightKg).toBe(80)
    expect(measurement?.waistCm).toBe(95)
    // Fields the old file never had read as absent, not as garbage.
    expect(measurement?.bodyFatPct ?? null).toBeNull()
  })
})

describe('rejection', () => {
  it('refuses a file that is not JSON', async () => {
    await expect(importBackup('not json at all')).rejects.toBeInstanceOf(BackupError)
  })

  it('refuses a JSON file from another app', async () => {
    await expect(importBackup(JSON.stringify({ app: 'something-else' }))).rejects.toBeInstanceOf(
      BackupError,
    )
  })

  it('refuses a backup from a future version', async () => {
    const future = JSON.stringify({ app: 'arohan', version: 99, data: {} })
    await expect(importBackup(future)).rejects.toBeInstanceOf(BackupError)
  })

  it('leaves existing data untouched when a file is rejected', async () => {
    await seed()
    await expect(importBackup('garbage')).rejects.toThrow()
    expect(await db.workout_history.count()).toBe(1)
    expect((await db.settings.get(1))?.name).toBe('Mayank')
  })
})
