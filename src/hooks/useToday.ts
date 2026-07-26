import { useEffect, useState } from 'react'
import { todayKey, type DateKey } from '@/lib/date'

/**
 * Today's date key, refreshed when the clock passes midnight or the app comes
 * back to the foreground — which on iPad is the case that actually matters.
 */
export function useToday(): DateKey {
  const [date, setDate] = useState<DateKey>(todayKey)

  useEffect(() => {
    let timer: number

    const check = () => {
      setDate((current) => {
        const next = todayKey()
        return next === current ? current : next
      })
      schedule()
    }

    const schedule = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 2, 0)
      window.clearTimeout(timer)
      timer = window.setTimeout(check, midnight.getTime() - now.getTime())
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return date
}
