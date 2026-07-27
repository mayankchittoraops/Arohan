import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/Card'
import { cn } from '@/lib/cn'
import { addDays, startOfWeek, type DateKey } from '@/lib/date'
import { formatMinutes, roundTo } from '@/lib/format'
import type { DailyHealth, WorkoutHistoryEntry } from '@/storage/types'

interface WeekTotals {
  sessions: number
  seconds: number
  sets: number
  sleep: number | null
}

function totals(
  history: WorkoutHistoryEntry[],
  daily: DailyHealth[],
  from: DateKey,
  to: DateKey,
): WeekTotals {
  const inWeek = history.filter((e) => e.date >= from && e.date <= to)
  const sleeps = daily
    .filter((d) => d.date >= from && d.date <= to && d.sleepHours != null)
    .map((d) => d.sleepHours as number)

  return {
    sessions: inWeek.length,
    seconds: inWeek.reduce((t, e) => t + e.durationSeconds, 0),
    sets: inWeek.reduce((t, e) => t + e.completedSets, 0),
    sleep: sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null,
  }
}

function Delta({ value, unit }: { value: number; unit?: string }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus
  const tone = value > 0 ? 'text-mint' : value < 0 ? 'text-amber' : 'text-faint'
  return (
    <span className={cn('flex items-center gap-0.5 text-micro font-semibold', tone)}>
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}
      {value}
      {unit}
    </span>
  )
}

function Metric({
  label,
  value,
  delta,
  unit,
}: {
  label: string
  value: string
  delta: number | null
  unit?: string
}) {
  return (
    <div>
      <dt className="text-caption text-faint">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2">
        <span className="text-title tabular text-ink">{value}</span>
        {delta != null && delta !== 0 ? <Delta value={delta} unit={unit} /> : null}
      </dd>
    </div>
  )
}

/**
 * This week against last, which is the comparison that actually changes
 * behaviour. Absolute totals are kept small; the deltas carry the message.
 */
export function WeeklySummary({
  today,
  history,
  daily,
}: {
  today: DateKey
  history: WorkoutHistoryEntry[]
  daily: DailyHealth[]
}) {
  const thisStart = startOfWeek(today)
  const lastStart = addDays(thisStart, -7)

  const current = totals(history, daily, thisStart, addDays(thisStart, 6))
  const previous = totals(history, daily, lastStart, addDays(lastStart, 6))
  const hasPrevious = previous.sessions > 0

  const headline =
    current.sessions === 0
      ? 'Nothing logged this week yet. The week is not over.'
      : !hasPrevious
        ? 'First full week on record — next week gets a comparison.'
        : current.sessions > previous.sessions
          ? 'Ahead of last week, and it is not finished.'
          : current.sessions === previous.sessions
            ? 'Level with last week.'
            : 'Behind last week so far. Plenty of week left.'

  return (
    <Card className="mb-section">
      <h3 className="text-micro uppercase text-faint">This week</h3>
      <p className="mt-2 text-label leading-relaxed text-muted">{headline}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Metric
          label="Sessions"
          value={String(current.sessions)}
          delta={hasPrevious ? current.sessions - previous.sessions : null}
        />
        <Metric
          label="Time"
          value={formatMinutes(current.seconds)}
          delta={
            hasPrevious
              ? Math.round(current.seconds / 60) - Math.round(previous.seconds / 60)
              : null
          }
          unit=" min"
        />
        <Metric
          label="Sets"
          value={String(current.sets)}
          delta={hasPrevious ? current.sets - previous.sets : null}
        />
      </dl>

      {current.sleep != null ? (
        <p className="mt-4 border-t border-line pt-3 text-caption text-faint">
          Averaging{' '}
          <span className="font-semibold text-muted">{roundTo(current.sleep, 1)} hours</span> of
          sleep this week
          {previous.sleep != null ? (
            <>
              , against {roundTo(previous.sleep, 1)} last week.
            </>
          ) : (
            '.'
          )}
        </p>
      ) : null}
    </Card>
  )
}
