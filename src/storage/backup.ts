import { db, ensureSeeded } from './db'
import type { ProgressPhoto } from './types'

export const BACKUP_VERSION = 1

interface SerialisedPhoto extends Omit<ProgressPhoto, 'blob'> {
  /** `data:` URL — JSON cannot carry a Blob. */
  blob: string
}

export interface BackupFile {
  app: 'arohan'
  version: number
  exportedAt: string
  data: {
    settings: unknown[]
    daily_health: unknown[]
    workouts: unknown[]
    workout_history: unknown[]
    measurements: unknown[]
    habits: unknown[]
    achievements: unknown[]
    quotes: unknown[]
    photos: SerialisedPhoto[]
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)), { once: true })
    reader.addEventListener(
      'error',
      () => reject(reader.error ?? new Error('Could not read image')),
      { once: true },
    )
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function exportBackup(): Promise<BackupFile> {
  await ensureSeeded()

  const photos = await db.photos.toArray()
  const serialisedPhotos = await Promise.all(
    photos.map(async (photo) => ({ ...photo, blob: await blobToDataUrl(photo.blob) })),
  )

  const [settings, daily, workouts, history, measurements, habits, achievements, quotes] =
    await Promise.all([
      db.settings.toArray(),
      db.daily_health.toArray(),
      db.workouts.toArray(),
      db.workout_history.toArray(),
      db.measurements.toArray(),
      db.habits.toArray(),
      db.achievements.toArray(),
      db.quotes.toArray(),
    ])

  return {
    app: 'arohan',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings,
      daily_health: daily,
      workouts,
      workout_history: history,
      measurements,
      habits,
      achievements,
      quotes,
      photos: serialisedPhotos,
    },
  }
}

export function backupFilename(date = new Date()): string {
  const stamp = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
  return `arohan-backup-${stamp}.json`
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename()
  document.body.append(link)
  link.click()
  link.remove()
  // Give Safari a moment to start the download before the URL disappears.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export class BackupError extends Error {}

function assertShape(value: unknown): asserts value is BackupFile {
  if (!value || typeof value !== 'object') throw new BackupError('That file is not valid JSON.')
  const file = value as Partial<BackupFile>
  if (file.app !== 'arohan') throw new BackupError('That backup was not created by Arohan.')
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new BackupError('That backup came from a newer version of Arohan.')
  }
  if (!file.data || typeof file.data !== 'object') throw new BackupError('The backup has no data.')
}

export interface ImportResult {
  counts: Record<string, number>
}

/** Replaces everything currently stored with the contents of the backup. */
export async function importBackup(raw: string): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new BackupError('That file is not valid JSON.')
  }
  assertShape(parsed)

  const { data } = parsed
  const photos: ProgressPhoto[] = await Promise.all(
    (data.photos ?? []).map(async (photo) => ({
      ...photo,
      blob: await dataUrlToBlob(photo.blob),
    })),
  )

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
    await Promise.all([
      db.settings.bulkPut((data.settings ?? []) as never[]),
      db.daily_health.bulkPut((data.daily_health ?? []) as never[]),
      db.workouts.bulkPut((data.workouts ?? []) as never[]),
      db.workout_history.bulkPut((data.workout_history ?? []) as never[]),
      db.measurements.bulkPut((data.measurements ?? []) as never[]),
      db.habits.bulkPut((data.habits ?? []) as never[]),
      db.achievements.bulkPut((data.achievements ?? []) as never[]),
      db.quotes.bulkPut((data.quotes ?? []) as never[]),
      db.photos.bulkPut(photos),
    ])
  })

  await ensureSeeded()

  return {
    counts: {
      'daily entries': data.daily_health?.length ?? 0,
      workouts: data.workout_history?.length ?? 0,
      measurements: data.measurements?.length ?? 0,
      habits: data.habits?.length ?? 0,
      photos: photos.length,
    },
  }
}
