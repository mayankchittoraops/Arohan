import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A wall-clock countdown. The deadline is a timestamp rather than a decrementing
 * counter, so a backgrounded tab or a throttled timer cannot make it drift.
 */
export function useCountdown(onComplete?: () => void) {
  const [deadline, setDeadline] = useState<number | null>(null)
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(0)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  useEffect(() => {
    if (deadline == null) return

    const tick = () => {
      const left = Math.max(0, (deadline - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0) {
        setDeadline(null)
        completeRef.current?.()
      }
    }

    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [deadline])

  const start = useCallback((seconds: number) => {
    setTotal(seconds)
    setPausedRemaining(null)
    setRemaining(seconds)
    setDeadline(Date.now() + seconds * 1000)
  }, [])

  const pause = useCallback(() => {
    setDeadline((current) => {
      if (current == null) return current
      setPausedRemaining(Math.max(0, (current - Date.now()) / 1000))
      return null
    })
  }, [])

  const resume = useCallback(() => {
    setPausedRemaining((left) => {
      if (left == null) return left
      setDeadline(Date.now() + left * 1000)
      return null
    })
  }, [])

  const stop = useCallback(() => {
    setDeadline(null)
    setPausedRemaining(null)
    setRemaining(0)
    setTotal(0)
  }, [])

  const adjust = useCallback((seconds: number) => {
    setTotal((t) => Math.max(0, t + seconds))
    setDeadline((current) => (current == null ? current : current + seconds * 1000))
    setPausedRemaining((left) => (left == null ? left : Math.max(0, left + seconds)))
  }, [])

  const isRunning = deadline != null
  const isPaused = pausedRemaining != null

  return {
    remaining: isPaused ? pausedRemaining : remaining,
    total,
    isRunning,
    isPaused,
    isActive: isRunning || isPaused,
    start,
    pause,
    resume,
    stop,
    adjust,
  }
}

/** A count-up stopwatch, for timed holds. */
export function useStopwatch() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (startedAt == null) return
    const tick = () => setElapsed((Date.now() - startedAt) / 1000)
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [startedAt])

  const start = useCallback(() => setStartedAt(Date.now()), [])
  const reset = useCallback(() => {
    setStartedAt(null)
    setElapsed(0)
  }, [])

  return { elapsed, running: startedAt != null, start, reset }
}

/** Re-renders on an interval. Used for the live session clock. */
export function useTicker(intervalMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, active])

  return now
}
