import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Lock } from 'lucide-react'
import { BlockSkeleton } from '@/components/Page'
import { Card, SectionTitle } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { ProgressBar, ProgressRing } from '@/components/ProgressRing'
import { ACHIEVEMENTS } from '@/data/achievements'
import { PHASES } from '@/data/program'
import { cn } from '@/lib/cn'
import { formatShort } from '@/lib/date'
import { pluralise } from '@/lib/format'
import { db } from '@/storage/db'
import type { JourneyStats } from '@/hooks/useStats'
import type { Settings } from '@/storage/types'

const TIER_STYLES = {
  bronze: 'bg-amber/15 text-amber',
  silver: 'bg-sky/15 text-sky',
  gold: 'bg-accent-soft text-accent',
} as const

export function JourneyTab({
  stats,
  settings,
  journeyDay,
}: {
  stats: JourneyStats | undefined
  settings: Settings
  journeyDay: number
}) {
  const unlocked = useLiveQuery(async () => {
    const records = await db.achievements.toArray()
    return new Map(records.map((r) => [r.id, r]))
  }, [])

  if (!stats || !unlocked) return <BlockSkeleton />

  const achievement = stats.achievement
  const yearProgress = Math.min(1, Math.max(0, journeyDay / 365))
  const earnedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-5">
          <ProgressRing
            value={yearProgress}
            size={104}
            thickness={10}
            label={`Day ${journeyDay} of 365`}
          >
            <span className="text-xl font-bold tabular text-ink">{Math.max(1, journeyDay)}</span>
            <span className="text-[10px] font-medium text-faint">of 365</span>
          </ProgressRing>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Phase {settings.phase} · {PHASES[settings.phase - 1].name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {PHASES[settings.phase - 1].tagline}
            </p>
            <p className="mt-2 text-xs text-faint">Started {formatShort(settings.startDate)}</p>
          </div>
        </div>
      </Card>

      <div>
        <SectionTitle>The climb</SectionTitle>
        <ol className="space-y-2">
          {PHASES.map((phase) => {
            const reached = settings.phase >= phase.number
            const current = settings.phase === phase.number
            return (
              <li key={phase.number}>
                <Card
                  className={cn(
                    'flex gap-4',
                    current && 'border-accent/40',
                    !reached && 'opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                      reached ? 'bg-accent-soft text-accent' : 'bg-sunken text-faint',
                    )}
                  >
                    {reached && !current ? <Check className="h-5 w-5" strokeWidth={3} /> : phase.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-ink">
                      {phase.name}
                      {!reached ? <Lock className="h-3.5 w-3.5 text-faint" /> : null}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{phase.tagline}</p>
                    <p className="mt-1.5 text-xs text-faint">
                      Days {phase.startDay}–{phase.endDay} · {phase.focus.join(' · ')}
                    </p>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </div>

      <div>
        <SectionTitle>
          Achievements · {earnedCount} of {ACHIEVEMENTS.length}
        </SectionTitle>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((award) => {
            const record = unlocked.get(award.id)
            const progress = award.progress(achievement)
            return (
              <li key={award.id}>
                <Card className={cn('h-full', !record && 'bg-surface/60')}>
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                        record ? TIER_STYLES[award.tier] : 'bg-sunken text-faint',
                      )}
                    >
                      <Icon name={award.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'font-semibold tracking-tight',
                          record ? 'text-ink' : 'text-muted',
                        )}
                      >
                        {award.name}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-faint">
                        {award.description}
                      </p>
                      {record ? (
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-mint">
                          Earned {new Date(record.unlockedAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <div className="mt-2.5">
                          <ProgressBar value={progress} tone="teal" className="h-1.5" />
                          <p className="mt-1 text-[11px] tabular text-faint">
                            {Math.round(progress * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <SectionTitle>Your year so far</SectionTitle>
        <Card>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Workouts', achievement.totalWorkouts],
              ['Mobility routines', achievement.totalMobilitySessions],
              [
                'Time moving',
                achievement.totalMinutes < 60
                  ? `${achievement.totalMinutes} min`
                  : `${Math.round(achievement.totalMinutes / 60)} hrs`,
              ],
              ['Longest streak', pluralise(achievement.longestStreak, 'day')],
              ['Best push-ups', achievement.bestPushups || '—'],
              ['Perfect habit days', achievement.perfectHabitDays],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs text-faint">{label}</dt>
                <dd className="text-2xl font-semibold tabular tracking-tight text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}
