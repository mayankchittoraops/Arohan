import { useLiveQuery } from 'dexie-react-hooks'
import { BatteryMedium, Footprints, HeartPulse, Minus, Moon, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/Card'
import { StatCard } from '@/components/StatCard'
import { cn } from '@/lib/cn'
import { addDays, lastNDays, weekdayInitial, type DateKey } from '@/lib/date'
import { db } from '@/storage/db'
import type { DailyHealth } from '@/storage/types'

const WINDOW = 14

function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null)
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * Consistency and direction, rather than a wall of raw numbers.
 *
 * Two windows of fourteen days are compared so the card can say whether things
 * are moving, which is the only part of a number that is actually actionable.
 */
export function ConsistencyCard({
  today,
  activeDates,
}: {
  today: DateKey
  activeDates: Set<DateKey>
}) {
  const recent = lastNDays(today, WINDOW)
  const previous = lastNDays(addDays(today, -WINDOW), WINDOW)

  const movedRecent = recent.filter((d) => activeDates.has(d)).length
  const movedPrevious = previous.filter((d) => activeDates.has(d)).length
  const delta = movedRecent - movedPrevious
  const hasHistory = movedPrevious > 0

  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const trendTone = delta > 0 ? 'text-mint' : delta < 0 ? 'text-amber' : 'text-faint'
  const trendCopy = !hasHistory
    ? 'Building the first two weeks of the picture.'
    : delta > 0
      ? `${delta} more than the fortnight before.`
      : delta < 0
        ? `${Math.abs(delta)} fewer than the fortnight before. Worth a gentle week.`
        : 'Exactly as steady as the fortnight before.'

  return (
    <Card className="mb-section">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-micro uppercase text-faint">Consistency</h3>
        <span className={cn('flex items-center gap-1 text-caption font-semibold', trendTone)}>
          <Trend className="h-3.5 w-3.5" />
          {delta > 0 ? `+${delta}` : delta}
        </span>
      </div>

      <p className="mt-2 text-title text-ink">
        {movedRecent}
        <span className="ml-1.5 text-label font-medium text-faint">of the last {WINDOW} days</span>
      </p>
      <p className="mt-1 text-label leading-relaxed text-muted">{trendCopy}</p>

      <div className="mt-4 flex gap-1">
        {recent.map((day) => {
          const moved = activeDates.has(day)
          const isToday = day === today
          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  'h-9 w-full rounded-lg transition-colors',
                  moved
                    ? 'bg-accent'
                    : isToday
                      ? 'border-2 border-dashed border-line-strong'
                      : 'bg-sunken',
                )}
              />
              {isToday ? (
                <span className="text-micro text-faint">{weekdayInitial(day)}</span>
              ) : (
                <span className="text-micro text-transparent">·</span>
              )}
            </div>
          )
        })}
      </div>
      <p className="sr-only">
        Moved on {movedRecent} of the last {WINDOW} days.
      </p>
    </Card>
  )
}

/**
 * Today's check-in. When nothing has been logged it invites rather than showing
 * a row of em dashes.
 */
export function CheckInRow({
  today,
  daily,
  onOpen,
}: {
  today: DateKey
  daily: DailyHealth | undefined
  onOpen: () => void
}) {
  const logged =
    daily != null &&
    (daily.sleepHours != null ||
      daily.steps != null ||
      daily.energy != null ||
      daily.pain != null)

  const painHistory = useLiveQuery(async () => {
    const from = addDays(today, -13)
    return db.daily_health.where('date').between(from, today, true, true).toArray()
  }, [today])

  if (!logged) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="mb-section flex w-full items-center gap-4 rounded-xl2 border border-dashed border-line-strong bg-surface/60 p-5 text-left transition-transform active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken text-accent">
          <HeartPulse className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-label font-semibold text-ink">
            How are you doing today?
          </span>
          <span className="mt-0.5 block text-caption leading-relaxed text-muted">
            Thirty seconds on sleep, energy and your back. It is what the coaching reads.
          </span>
        </span>
      </button>
    )
  }

  // Once there is a week of pain data, say which way it is going.
  const rows = painHistory ?? []
  const recentPain = average(rows.filter((r) => r.date > addDays(today, -7)).map((r) => r.pain))
  const priorPain = average(rows.filter((r) => r.date <= addDays(today, -7)).map((r) => r.pain))
  const painTrend =
    recentPain != null && priorPain != null
      ? recentPain < priorPain - 0.4
        ? 'Your back has been easing over the last week.'
        : recentPain > priorPain + 0.4
          ? 'Your back has been more talkative than the week before.'
          : 'Your back has been steady week to week.'
      : null

  return (
    <div className="mb-section">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Sleep"
          tone="violet"
          icon={<Moon className="h-3.5 w-3.5" />}
          value={daily?.sleepHours ?? '—'}
          unit={daily?.sleepHours != null ? 'hrs' : undefined}
          onClick={onOpen}
        />
        <StatCard
          label="Steps"
          tone="mint"
          icon={<Footprints className="h-3.5 w-3.5" />}
          value={daily?.steps?.toLocaleString() ?? '—'}
          onClick={onOpen}
        />
        <StatCard
          label="Energy"
          tone="amber"
          icon={<BatteryMedium className="h-3.5 w-3.5" />}
          value={daily?.energy ?? '—'}
          unit={daily?.energy != null ? '/ 5' : undefined}
          onClick={onOpen}
        />
        <StatCard
          label="Back"
          tone="rose"
          icon={<HeartPulse className="h-3.5 w-3.5" />}
          value={daily?.pain ?? '—'}
          unit={daily?.pain != null ? '/ 10' : undefined}
          onClick={onOpen}
        />
      </div>
      {painTrend ? <p className="mt-2 px-1 text-caption text-faint">{painTrend}</p> : null}
    </div>
  )
}
