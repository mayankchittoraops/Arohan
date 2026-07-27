import { useMemo } from 'react'
import { coach, type CoachAdvice } from '@/data/coach'
import { daysBetween, type DateKey } from '@/lib/date'
import type { WorkoutKind } from '@/data/types'
import type { DailyHealth } from '@/storage/types'
import type { JourneyStats } from './useStats'

/**
 * Assembles the coaching input from data the calling screen already holds, so
 * asking for advice costs no extra database work.
 */
export function useCoach(args: {
  today: DateKey
  scheduledKind: WorkoutKind | 'mobility' | undefined
  trainedToday: boolean
  daily: DailyHealth | undefined
  stats: JourneyStats | undefined
  journeyDay: number | undefined
}): CoachAdvice | null {
  const { today, scheduledKind, trainedToday, daily, stats, journeyDay } = args

  return useMemo(() => {
    if (!scheduledKind || !stats || journeyDay == null) return null

    const last = stats.lastSession
    return coach({
      scheduledKind,
      trainedToday,
      sleepHours: daily?.sleepHours ?? null,
      energy: daily?.energy ?? null,
      pain: daily?.pain ?? null,
      daysSinceLastSession: last ? Math.max(0, daysBetween(last.date, today)) : null,
      lastRpe: last?.rpe ?? null,
      streak: stats.streak.current,
      journeyDay,
    })
  }, [today, scheduledKind, trainedToday, daily, stats, journeyDay])
}
