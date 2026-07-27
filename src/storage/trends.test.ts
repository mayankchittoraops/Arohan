import { describe, expect, it } from 'vitest'
import { asymmetry, trendFor, trendsWithData } from './trends'
import { bmi, bmiBand, METRICS } from '@/data/metrics'
import { EMPTY_MEASUREMENT } from './repo'
import type { Measurement } from './types'

const m = (date: string, patch: Partial<Measurement>): Measurement => ({
  ...EMPTY_MEASUREMENT(date),
  ...patch,
})

describe('trendFor', () => {
  it('is empty when nothing was ever logged', () => {
    const t = trendFor('weightKg', [])
    expect(t.count).toBe(0)
    expect(t.latest).toBeNull()
    expect(t.change).toBeNull()
    expect(t.favourable).toBeNull()
  })

  it('handles a single reading without inventing a change', () => {
    const t = trendFor('weightKg', [m('2026-01-01', { weightKg: 82 })])
    expect(t.latest).toBe(82)
    expect(t.change).toBeNull()
    expect(t.changeFromStart).toBeNull()
  })

  it('orders by date regardless of insertion order', () => {
    const t = trendFor('weightKg', [
      m('2026-03-01', { weightKg: 80 }),
      m('2026-01-01', { weightKg: 84 }),
      m('2026-02-01', { weightKg: 82 }),
    ])
    expect(t.points.map((p) => p.value)).toEqual([84, 82, 80])
    expect(t.latest).toBe(80)
    expect(t.previous).toBe(82)
    expect(t.first).toBe(84)
    expect(t.change).toBe(-2)
    expect(t.changeFromStart).toBe(-4)
  })

  it('skips days where that metric was not recorded', () => {
    const t = trendFor('waistCm', [
      m('2026-01-01', { waistCm: 94 }),
      m('2026-01-08', { weightKg: 82 }), // weighed, not measured
      m('2026-01-15', { waistCm: 92 }),
    ])
    expect(t.count).toBe(2)
    expect(t.change).toBe(-2)
  })

  it('calls a fall favourable when lower is better', () => {
    const t = trendFor('waistCm', [
      m('2026-01-01', { waistCm: 95 }),
      m('2026-01-08', { waistCm: 93 }),
    ])
    expect(t.favourable).toBe(true)
  })

  it('calls a rise favourable when higher is better', () => {
    const t = trendFor('skeletalMusclePct', [
      m('2026-01-01', { skeletalMusclePct: 38 }),
      m('2026-01-08', { skeletalMusclePct: 39 }),
    ])
    expect(t.favourable).toBe(true)
  })

  it('treats a tiny change as noise, not a trend', () => {
    const t = trendFor('weightKg', [
      m('2026-01-01', { weightKg: 82.0 }),
      m('2026-01-02', { weightKg: 82.1 }),
    ])
    expect(t.change).toBeCloseTo(0.1)
    expect(t.favourable).toBeNull()
  })
})

describe('trendsWithData', () => {
  it('returns only metrics that have been logged', () => {
    const rows = [m('2026-01-01', { weightKg: 82, waistCm: 94 })]
    const fields = METRICS.map((metric) => metric.field)
    const trends = trendsWithData(fields, rows)
    expect(trends.map((t) => t.field).toSorted()).toEqual(['waistCm', 'weightKg'])
  })
})

describe('asymmetry', () => {
  it('is a percentage of the larger side', () => {
    expect(asymmetry(40, 38)).toBeCloseTo(5)
    expect(asymmetry(38, 40)).toBeCloseTo(5)
    expect(asymmetry(40, 40)).toBe(0)
  })

  it('is null when either side is missing', () => {
    expect(asymmetry(null, 38)).toBeNull()
    expect(asymmetry(40, null)).toBeNull()
  })
})

describe('bmi', () => {
  it('derives from weight and height', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 2)
    expect(bmi(60, 165)).toBeCloseTo(22.04, 2)
  })

  it('is null without both inputs, or with nonsense ones', () => {
    expect(bmi(null, 180)).toBeNull()
    expect(bmi(80, null)).toBeNull()
    expect(bmi(80, 0)).toBeNull()
    expect(bmi(0, 180)).toBeNull()
    expect(bmi(-5, 180)).toBeNull()
  })

  it('bands at the standard boundaries', () => {
    expect(bmiBand(18.4)).toBe('under')
    expect(bmiBand(18.5)).toBe('healthy')
    expect(bmiBand(24.9)).toBe('healthy')
    expect(bmiBand(25)).toBe('over')
    expect(bmiBand(29.9)).toBe('over')
    expect(bmiBand(30)).toBe('obese')
  })
})

describe('metric definitions', () => {
  it('covers every stored measurement field exactly once', () => {
    const fields = METRICS.map((metric) => metric.field)
    expect(new Set(fields).size).toBe(fields.length)

    const stored = Object.keys(EMPTY_MEASUREMENT('2026-01-01')).filter(
      (k) => !['date', 'note', 'updatedAt'].includes(k),
    )
    expect(fields.toSorted()).toEqual(stored.toSorted())
  })

  it('gives every metric a usable range', () => {
    for (const metric of METRICS) {
      expect(metric.max).toBeGreaterThan(metric.min)
      expect(metric.step).toBeGreaterThan(0)
      expect(metric.label.length).toBeGreaterThan(1)
    }
  })
})
