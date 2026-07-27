import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/storage/db'
import {
  activeDates,
  buildAchievementStats,
  computeStreak,
  lastSessionOf,
  type LastSession,
} from '@/storage/stats'
import { journeyDay } from '@/data/program'
import type { DateKey } from '@/lib/date'
import type { Settings } from '@/storage/types'

export interface JourneyStats {
  streak: { current: number; longest: number }
  activeDates: Set<DateKey>
  achievement: ReturnType<typeof buildAchievementStats>
  /** Feeds the coaching rules — how long since training, and how hard it was. */
  lastSession: LastSession | null
}

/**
 * The whole-history roll-up used by the dashboard, achievements and progress
 * screens. One live query, shared by everything that needs a total.
 */
export function useStats(settings: Settings | undefined, today: DateKey): JourneyStats | undefined {
  return useLiveQuery(async () => {
    if (!settings) return undefined

    const [history, habits, daily, measurements] = await Promise.all([
      db.workout_history.toArray(),
      db.habits.toArray(),
      db.daily_health.toArray(),
      db.measurements.toArray(),
    ])

    const dates = activeDates(history, habits)

    return {
      streak: computeStreak(dates, today),
      activeDates: dates,
      lastSession: lastSessionOf(history),
      achievement: buildAchievementStats({
        history,
        habits,
        daily,
        measurements,
        today,
        phase: settings.phase,
        journeyDay: journeyDay(settings.startDate, today),
      }),
    }
  }, [settings?.phase, settings?.startDate, today, settings !== undefined])
}
