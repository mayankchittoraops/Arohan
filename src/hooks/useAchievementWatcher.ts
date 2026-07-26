import { useEffect, useRef } from 'react'
import { getAchievement } from '@/data/achievements'
import { unlockAchievement } from '@/storage/repo'
import { newlyEarned } from '@/storage/stats'
import { db } from '@/storage/db'
import { useToast } from './useToast'
import type { JourneyStats } from './useStats'

/**
 * Watches the running totals and records anything newly earned. Runs once per
 * change of stats, and announces each unlock exactly once.
 */
export function useAchievementWatcher(stats: JourneyStats | undefined): void {
  const { show } = useToast()
  const inFlight = useRef(false)

  useEffect(() => {
    if (!stats || inFlight.current) return

    inFlight.current = true
    void (async () => {
      try {
        const unlocked = new Set((await db.achievements.toArray()).map((a) => a.id))
        const earned = newlyEarned(stats.achievement, unlocked)
        for (const id of earned) {
          await unlockAchievement(id)
          const definition = getAchievement(id)
          if (definition) show(`Unlocked · ${definition.name}`, 'success')
        }
      } finally {
        inFlight.current = false
      }
    })()
  }, [stats, show])
}
