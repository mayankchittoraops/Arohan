import { useLiveQuery } from 'dexie-react-hooks'
import { Clock, Dumbbell, Flame, HeartPulse, Timer, Zap } from 'lucide-react'
import { BarChart, LineChart } from '@/components/Chart'
import { Card, SectionTitle } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { StatTile } from '@/components/StatTile'
import { addDays, formatShort, lastNDays, startOfWeek, type DateKey } from '@/lib/date'
import { formatDuration } from '@/lib/format'
import { db } from '@/storage/db'
import type { JourneyStats } from '@/hooks/useStats'

const WEEKS_SHOWN = 8
const DAYS_SHOWN = 30

export function OverviewTab({ stats, today }: { stats: JourneyStats | undefined; today: DateKey }) {
  const data = useLiveQuery(async () => {
    const [history, daily] = await Promise.all([
      db.workout_history.toArray(),
      db.daily_health.toArray(),
    ])
    return { history, daily }
  }, [])

  if (!data || !stats) return null

  const { history, daily } = data
  const achievement = stats.achievement

  if (history.length === 0 && daily.length === 0) {
    return (
      <EmptyState
        icon={<Dumbbell className="h-6 w-6" />}
        title="Nothing to chart yet"
        description="Finish a session or fill in a daily check-in and the picture starts building here."
      />
    )
  }

  /* Sessions per week for the last eight weeks. */
  const weekStarts = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    startOfWeek(addDays(today, (i - WEEKS_SHOWN + 1) * 7)),
  )
  const sessionsPerWeek = weekStarts.map((start) => {
    const end = addDays(start, 6)
    return history.filter((entry) => entry.date >= start && entry.date <= end).length
  })

  /* Pain, sleep and energy across the last thirty days. */
  const days = lastNDays(today, DAYS_SHOWN)
  const dailyByDate = new Map(daily.map((d) => [d.date, d]))
  const pain = days.map((day) => dailyByDate.get(day)?.pain ?? null)
  const sleep = days.map((day) => dailyByDate.get(day)?.sleepHours ?? null)
  const energy = days.map((day) => dailyByDate.get(day)?.energy ?? null)

  const hasPain = pain.some((value) => value != null)
  const hasSleep = sleep.some((value) => value != null) || energy.some((value) => value != null)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile
          label="Workouts"
          tone="accent"
          icon={<Dumbbell className="h-3.5 w-3.5" />}
          value={achievement.totalWorkouts}
        />
        <StatTile
          label="Mobility"
          tone="teal"
          icon={<Zap className="h-3.5 w-3.5" />}
          value={achievement.totalMobilitySessions}
        />
        <StatTile
          label="Streak"
          tone="rose"
          icon={<Flame className="h-3.5 w-3.5" />}
          value={stats.streak.current}
          unit="days"
        />
        <StatTile
          label="Time trained"
          tone="indigo"
          icon={<Clock className="h-3.5 w-3.5" />}
          value={
            achievement.totalMinutes < 60
              ? achievement.totalMinutes
              : Math.round(achievement.totalMinutes / 60)
          }
          unit={achievement.totalMinutes < 60 ? 'min' : 'hrs'}
        />
        <StatTile
          label="Best push-ups"
          tone="amber"
          icon={<Zap className="h-3.5 w-3.5" />}
          value={achievement.bestPushups || '—'}
        />
        <StatTile
          label="Best plank"
          tone="sky"
          icon={<Timer className="h-3.5 w-3.5" />}
          value={achievement.bestPlankSeconds ? formatDuration(achievement.bestPlankSeconds) : '—'}
        />
      </div>

      <div>
        <SectionTitle>Sessions per week</SectionTitle>
        <Card>
          <BarChart
            labels={weekStarts.map((start) => formatShort(start))}
            series={[{ label: 'Sessions', points: sessionsPerWeek, token: 'accent' }]}
            height={180}
          />
        </Card>
      </div>

      {hasPain ? (
        <div>
          <SectionTitle>Lower back, last 30 days</SectionTitle>
          <Card>
            <LineChart
              labels={days.map((day) => formatShort(day))}
              series={[{ label: 'Pain', points: pain, token: 'rose', fill: true }]}
              height={180}
              beginAtZero
            />
            <p className="mt-3 flex items-center gap-2 text-xs text-faint">
              <HeartPulse className="h-3.5 w-3.5 text-rose" />
              Lower is better. Log it daily and the trend becomes obvious.
            </p>
          </Card>
        </div>
      ) : null}

      {hasSleep ? (
        <div>
          <SectionTitle>Sleep and energy</SectionTitle>
          <Card>
            <LineChart
              labels={days.map((day) => formatShort(day))}
              series={[
                { label: 'Sleep (hrs)', points: sleep, token: 'sky' },
                { label: 'Energy (1–5)', points: energy, token: 'teal' },
              ]}
              height={180}
              beginAtZero
            />
            <div className="mt-3 flex gap-4 text-xs text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky" /> Sleep
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal" /> Energy
              </span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
