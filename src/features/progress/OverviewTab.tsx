import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Timer, Zap } from 'lucide-react'
import { BarChart, LineChart } from '@/components/Chart'
import { BlockSkeleton } from '@/components/Page'
import { Card, SectionTitle } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { StatCard } from '@/components/StatCard'
import { addDays, formatShort, lastNDays, startOfWeek, type DateKey } from '@/lib/date'
import { formatDuration, roundTo } from '@/lib/format'
import { db } from '@/storage/db'
import type { JourneyStats } from '@/hooks/useStats'
import { WeeklySummary } from './WeeklySummary'

const WEEKS_SHOWN = 8
const DAYS_SHOWN = 28

function mean(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v != null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

/**
 * Trends, not readouts. Every number on this tab either compares against a
 * previous period or is a personal best worth chasing; anything that could not
 * be acted on has moved to the Journey tab.
 */
export function OverviewTab({ stats, today }: { stats: JourneyStats | undefined; today: DateKey }) {
  const data = useLiveQuery(async () => {
    const [history, daily] = await Promise.all([
      db.workout_history.toArray(),
      db.daily_health.toArray(),
    ])
    return { history, daily }
  }, [])

  if (!data || !stats) return <BlockSkeleton />

  const { history, daily } = data
  const achievement = stats.achievement

  if (history.length === 0 && daily.length === 0) {
    return (
      <EmptyState
        icon={<Dumbbell className="h-6 w-6" />}
        title="Nothing to chart yet"
        description="Finish a session or fill in a daily check-in. After a week there is enough here to show a direction rather than a dot."
      />
    )
  }

  /* Sessions per week, last eight weeks. */
  const weekStarts = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    startOfWeek(addDays(today, (i - WEEKS_SHOWN + 1) * 7)),
  )
  const sessionsPerWeek = weekStarts.map((start) => {
    const end = addDays(start, 6)
    return history.filter((entry) => entry.date >= start && entry.date <= end).length
  })

  /* Back pain over four weeks, summarised as a sentence before the chart. */
  const days = lastNDays(today, DAYS_SHOWN)
  const byDate = new Map(daily.map((d) => [d.date, d]))
  const pain = days.map((day) => byDate.get(day)?.pain ?? null)
  const hasPain = pain.filter((p) => p != null).length >= 2

  const painRecent = mean(pain.slice(-14))
  const painPrior = mean(pain.slice(0, 14))
  const painCopy =
    painRecent != null && painPrior != null
      ? painRecent < painPrior - 0.3
        ? `Easing — averaging ${roundTo(painRecent, 1)} over the last fortnight, down from ${roundTo(painPrior, 1)}.`
        : painRecent > painPrior + 0.3
          ? `Up a little — averaging ${roundTo(painRecent, 1)}, from ${roundTo(painPrior, 1)}. Worth a gentler week.`
          : `Steady around ${roundTo(painRecent, 1)} out of 10.`
      : painRecent != null
        ? `Averaging ${roundTo(painRecent, 1)} out of 10 so far.`
        : null

  return (
    <div className="space-y-section">
      <WeeklySummary today={today} history={history} daily={daily} />

      {/* The two numbers worth chasing. Totals live on the Journey tab. */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Best push-ups"
          tone="amber"
          icon={<Zap className="h-3.5 w-3.5" />}
          value={achievement.bestPushups || '—'}
        />
        <StatCard
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
            height={170}
          />
        </Card>
      </div>

      {hasPain ? (
        <div>
          <SectionTitle>Lower back</SectionTitle>
          <Card>
            {painCopy ? (
              <p className="mb-3 text-label leading-relaxed text-muted">{painCopy}</p>
            ) : null}
            <LineChart
              labels={days.map((day) => formatShort(day))}
              series={[{ label: 'Pain', points: pain, token: 'rose', fill: true }]}
              height={150}
              beginAtZero
            />
          </Card>
        </div>
      ) : null}
    </div>
  )
}
