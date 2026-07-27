import { getMetric } from '@/data/metrics'
import type { DateKey } from '@/lib/date'
import type { Measurement, MeasurementField } from './types'

/**
 * Turns a column of measurements into a direction.
 *
 * The brief asks for trends rather than overwhelming charts, so this is the
 * shape the Body screen renders: a latest value, how it moved, and enough
 * points for a sparkline. No axes, no legends.
 */
export interface MetricTrend {
  field: MeasurementField
  /** Most recent reading, and when. */
  latest: number | null
  latestDate: DateKey | null
  /** The reading before that. */
  previous: number | null
  /** The first ever reading. */
  first: number | null
  /** latest − previous. */
  change: number | null
  /** latest − first. */
  changeFromStart: number | null
  /** Whether the movement is in the direction you want. Null when flat. */
  favourable: boolean | null
  /** Chronological readings, for the sparkline. */
  points: Array<{ date: DateKey; value: number }>
  /** How many readings exist at all. */
  count: number
}

/** Below this, a change is noise rather than a trend. */
function significant(kind: string, delta: number): boolean {
  const threshold = kind === 'weight' ? 0.2 : kind === 'length' ? 0.4 : kind === 'percent' ? 0.2 : 0.5
  return Math.abs(delta) >= threshold
}

export function trendFor(field: MeasurementField, measurements: Measurement[]): MetricTrend {
  const definition = getMetric(field)
  const points = measurements
    .filter((m) => m[field] != null)
    .map((m) => ({ date: m.date, value: m[field] as number }))
    .toSorted((a, b) => a.date.localeCompare(b.date))

  const latest = points.at(-1) ?? null
  const previous = points.at(-2) ?? null
  const first = points[0] ?? null

  const change = latest && previous ? latest.value - previous.value : null
  const changeFromStart = latest && first && points.length > 1 ? latest.value - first.value : null

  let favourable: boolean | null = null
  if (change != null && definition && significant(definition.kind, change)) {
    favourable = definition.lowerIsBetter ? change < 0 : change > 0
  }

  return {
    field,
    latest: latest?.value ?? null,
    latestDate: latest?.date ?? null,
    previous: previous?.value ?? null,
    first: first?.value ?? null,
    change,
    changeFromStart,
    favourable,
    points,
    count: points.length,
  }
}

/** Every metric that has at least one reading, most recently updated first. */
export function trendsWithData(
  fields: MeasurementField[],
  measurements: Measurement[],
): MetricTrend[] {
  return fields.map((field) => trendFor(field, measurements)).filter((t) => t.count > 0)
}

/**
 * Left/right difference, as a percentage of the larger side. Asymmetry above a
 * few per cent is worth knowing about; below that it is measurement error.
 */
export function asymmetry(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null
  const larger = Math.max(left, right)
  if (larger <= 0) return null
  return (Math.abs(left - right) / larger) * 100
}
