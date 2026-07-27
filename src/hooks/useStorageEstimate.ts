import { useCallback, useEffect, useState } from 'react'

export interface StorageEstimate {
  /** Bytes currently used by this origin, where the browser will say. */
  usage: number | null
  /** Bytes the browser is prepared to give this origin. */
  quota: number | null
  /**
   * Whether the browser has promised not to evict this data under pressure.
   * Null while unknown, or where the API does not exist.
   */
  persisted: boolean | null
  supported: boolean
}

/**
 * Storage headroom, and whether the data is protected from eviction.
 *
 * This matters more here than in most apps: everything lives in IndexedDB with
 * no server copy, and iOS evicts storage for origins it decides are inactive.
 * Without a persistence grant, a year of training history can disappear with no
 * warning and no way back except a JSON backup.
 */
export function useStorageEstimate() {
  const [estimate, setEstimate] = useState<StorageEstimate>({
    usage: null,
    quota: null,
    persisted: null,
    supported: typeof navigator !== 'undefined' && 'storage' in navigator,
  })

  const refresh = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage) return

    const [usage, persisted] = await Promise.all([
      navigator.storage.estimate?.().catch(() => null) ?? null,
      navigator.storage.persisted?.().catch(() => null) ?? null,
    ])

    setEstimate({
      usage: usage?.usage ?? null,
      quota: usage?.quota ?? null,
      persisted: persisted ?? null,
      supported: true,
    })
  }, [])

  /** Asks the browser to protect this origin's storage from eviction. */
  const requestPersistence = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
    try {
      const granted = await navigator.storage.persist()
      await refresh()
      return granted
    } catch {
      return false
    }
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { estimate, refresh, requestPersistence }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
