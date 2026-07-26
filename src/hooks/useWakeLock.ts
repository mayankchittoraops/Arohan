import { useEffect } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void> }
type WakeLockLike = { request: (type: 'screen') => Promise<WakeLockSentinelLike> }

/**
 * Keeps the screen awake during a session. Unsupported browsers simply ignore
 * it, and the lock is re-acquired when the app returns to the foreground —
 * the system drops it automatically whenever the tab is hidden.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const api = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock
    if (!api) return

    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const lock = await api.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Denied or unavailable — the session still works, the screen just dims.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [active])
}
