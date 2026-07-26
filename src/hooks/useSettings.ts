import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { db } from '@/storage/db'
import { updateSettings } from '@/storage/repo'
import type { Settings } from '@/storage/types'

/**
 * Live settings. Returns `undefined` until the seeded row exists, which callers
 * use to hold back the first paint.
 *
 * This reads the table directly rather than going through `getSettings()`.
 * Awaiting a promise Dexie did not create — such as the memoised seeding
 * promise — drops the live query out of Dexie's tracking zone, and the query
 * then never re-fires when the row changes.
 */
export function useSettings(): Settings | undefined {
  return useLiveQuery(() => db.settings.get(1), [])
}

export function useUpdateSettings() {
  return useCallback((patch: Partial<Omit<Settings, 'id'>>) => updateSettings(patch), [])
}
