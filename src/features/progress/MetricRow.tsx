import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from '@/components/Sparkline'
import { cn } from '@/lib/cn'
import { formatDuration, roundTo, toDisplayLength, toDisplayWeight } from '@/lib/format'
import type { MetricDefinition } from '@/data/metrics'
import type { MetricTrend } from '@/storage/trends'
import type { Units } from '@/storage/types'

/** Converts a stored metric value into the unit the user has chosen. */
export function toDisplay(value: number, metric: MetricDefinition, units: Units): number {
  if (metric.kind === 'weight') return toDisplayWeight(value, units)
  if (metric.kind === 'length') return toDisplayLength(value, units)
  return value
}

export function unitLabel(metric: MetricDefinition, units: Units): string {
  switch (metric.kind) {
    case 'weight':
      return units === 'metric' ? 'kg' : 'lb'
    case 'length':
      return units === 'metric' ? 'cm' : 'in'
    case 'percent':
      return '%'
    case 'seconds':
      return ''
    case 'count':
      return ''
    default:
      return ''
  }
}

export function formatValue(value: number, metric: MetricDefinition, units: Units): string {
  if (metric.kind === 'seconds') return formatDuration(value)
  return String(roundTo(toDisplay(value, metric, units), metric.decimals))
}

/**
 * One metric, as a row: where it is now, which way it has moved, and its shape
 * over time. Deliberately not a chart per metric — a dozen charts is noise.
 */
export function MetricRow({
  metric,
  trend,
  units,
}: {
  metric: MetricDefinition
  trend: MetricTrend
  units: Units
}) {
  if (trend.latest == null) return null

  const Icon =
    trend.change == null || trend.change === 0
      ? Minus
      : trend.change > 0
        ? TrendingUp
        : TrendingDown

  const tone =
    trend.favourable === true
      ? 'text-mint'
      : trend.favourable === false
        ? 'text-amber'
        : 'text-faint'

  const changeText =
    trend.change == null
      ? 'First reading'
      : `${trend.change > 0 ? '+' : ''}${roundTo(toDisplay(trend.change, metric, units), metric.decimals)}`

  return (
    <li className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-label font-medium text-ink">{metric.label}</p>
        <p className={cn('mt-0.5 flex items-center gap-1 text-caption', tone)}>
          <Icon className="h-3 w-3" />
          {changeText}
          {trend.changeFromStart != null ? (
            <span className="text-faint">
              · {trend.changeFromStart > 0 ? '+' : ''}
              {roundTo(toDisplay(trend.changeFromStart, metric, units), metric.decimals)} overall
            </span>
          ) : null}
        </p>
      </div>

      <Sparkline
        values={trend.points.map((p) => toDisplay(p.value, metric, units))}
        tone={trend.favourable === true ? 'mint' : trend.favourable === false ? 'amber' : 'muted'}
      />

      <p className="w-20 shrink-0 text-right">
        <span className="text-heading tabular text-ink">
          {formatValue(trend.latest, metric, units)}
        </span>
        <span className="ml-0.5 text-caption text-faint">{unitLabel(metric, units)}</span>
      </p>
    </li>
  )
}
