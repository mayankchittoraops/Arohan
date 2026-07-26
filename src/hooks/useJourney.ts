import { useMemo } from 'react'
import { journeyDay, phaseFor, phaseForDay, resolveSession } from '@/data/program'
import type { DateKey } from '@/lib/date'
import type { Settings } from '@/storage/types'

/** Where the user is in the twelve-month plan, and what today asks of them. */
export function useJourney(settings: Settings | undefined, date: DateKey) {
  return useMemo(() => {
    if (!settings) return null

    const day = journeyDay(settings.startDate, date)
    const calendarPhase = phaseForDay(Math.max(1, day))
    const phase = phaseFor(settings.phase)

    return {
      day,
      phase,
      calendarPhase,
      /** True once the calendar has moved past the phase that is unlocked. */
      canUnlockNext: calendarPhase > settings.phase,
      nextPhase: phaseFor(Math.min(4, settings.phase + 1) as 1 | 2 | 3 | 4),
      /** Percentage through the whole year, clamped to the year. */
      yearProgress: Math.min(1, Math.max(0, day / 365)),
    }
  }, [settings, date])
}

/** Today's session, with progression and equipment substitutions applied. */
export function useSession(settings: Settings | undefined, date: DateKey, templateId?: string) {
  return useMemo(() => {
    if (!settings) return null
    return resolveSession(date, {
      startDate: settings.startDate,
      phase: settings.phase,
      equipment: settings.equipment,
      templateId,
    })
  }, [settings, date, templateId])
}
