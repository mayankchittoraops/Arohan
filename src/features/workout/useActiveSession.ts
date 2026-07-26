import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useRef } from 'react'
import { getActiveSession, saveActiveSession } from '@/storage/repo'
import type { ActiveWorkout, ExerciseLog, SetLog } from '@/storage/types'

/**
 * The in-progress session, read live from IndexedDB. Every mutation writes
 * straight back, which is what makes the workout autosave — closing the app
 * mid-set loses nothing.
 *
 * Each mutation is a read-modify-write of the whole session row, so they are
 * queued end to end. Two taps in quick succession — a rep stepper, or ticking a
 * set while the index advances — would otherwise read the same snapshot and the
 * second write would silently discard the first.
 */
export function useActiveSession() {
  const result = useLiveQuery(async () => ({ session: await getActiveSession() }), [])
  const queue = useRef<Promise<void>>(Promise.resolve())

  const mutate = useCallback((update: (session: ActiveWorkout) => ActiveWorkout) => {
    queue.current = queue.current.then(async () => {
      const current = await getActiveSession()
      if (!current) return
      await saveActiveSession(update(current))
    })
    return queue.current
  }, [])

  const updateLog = useCallback(
    (index: number, update: (log: ExerciseLog) => ExerciseLog) =>
      mutate((session) => ({
        ...session,
        logs: session.logs.map((log, i) => (i === index ? update(log) : log)),
      })),
    [mutate],
  )

  const updateSet = useCallback(
    (exerciseIndex: number, setIndex: number, patch: Partial<SetLog>) =>
      updateLog(exerciseIndex, (log) => ({
        ...log,
        sets: log.sets.map((set, i) => (i === setIndex ? { ...set, ...patch } : set)),
      })),
    [updateLog],
  )

  return {
    session: result?.session,
    loading: result === undefined,
    mutate,
    updateLog,
    updateSet,
  }
}
