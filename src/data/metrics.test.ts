import { describe, expect, it } from 'vitest'
import { bmi, bmiBand, getMetric, METRIC_GROUPS, METRICS, metricsIn } from './metrics'
import { EMPTY_MEASUREMENT } from '@/storage/repo'

describe('metric definitions', () => {
  it('describes every measurement field exactly once', () => {
    const described = METRICS.map((m) => m.field).toSorted()
    const stored = Object.keys(EMPTY_MEASUREMENT('2026-01-01'))
      .filter((key) => !['date', 'note', 'updatedAt'].includes(key))
      .toSorted()

    // The guard against a renamed or added column with no entry field.
    expect(described).toEqual(stored)
  })

  it('puts every metric in a real group', () => {
    for (const metric of METRICS) {
      expect(METRIC_GROUPS, metric.field).toContain(metric.group)
    }
    expect(METRIC_GROUPS.flatMap((g) => metricsIn(g))).toHaveLength(METRICS.length)
  })

  it('gives every metric a usable range and step', () => {
    for (const metric of METRICS) {
      expect(metric.min, metric.field).toBeLessThan(metric.max)
      expect(metric.step, metric.field).toBeGreaterThan(0)
      expect(metric.decimals, metric.field).toBeGreaterThanOrEqual(0)
    }
  })

  /**
   * `NumberInput` clamps silently rather than rejecting, so a `max` set below a
   * real reading does not show an error — it records a different number. These
   * are the readings a Dr Trust scale actually produces.
   */
  it('accepts the readings a real scale reports', () => {
    const readings: Array<[string, number]> = [
      ['weightKg', 82.5],
      ['bodyFatPct', 24.1],
      ['musclePct', 78.2], // Muscle Rate, not skeletal muscle mass — 70–85% is normal.
      ['visceralFat', 9],
      ['waistCm', 94],
      ['chestCm', 102],
      ['neckCm', 39],
      ['armLeftCm', 33],
      ['thighLeftCm', 56],
      ['pushupMax', 18],
      ['plankSeconds', 55],
    ]

    for (const [field, value] of readings) {
      const metric = getMetric(field as never)
      expect(metric, field).toBeDefined()
      expect(value, `${field} below min`).toBeGreaterThanOrEqual(metric!.min)
      expect(value, `${field} clamped by max`).toBeLessThanOrEqual(metric!.max)
    }
  })

  it('lets every percentage run the full 0–100', () => {
    for (const metric of METRICS.filter((m) => m.kind === 'percent')) {
      expect(metric.min, metric.field).toBe(0)
      expect(metric.max, metric.field).toBe(100)
    }
  })

  it('knows which direction is progress', () => {
    expect(getMetric('musclePct')!.lowerIsBetter).toBe(false)
    expect(getMetric('bodyFatPct')!.lowerIsBetter).toBe(true)
    expect(getMetric('waistCm')!.lowerIsBetter).toBe(true)
    expect(getMetric('pushupMax')!.lowerIsBetter).toBe(false)
  })
})

describe('bmi', () => {
  it('computes from weight and height', () => {
    expect(bmi(82.5, 178)).toBeCloseTo(26.04, 2)
  })

  it('returns null when either input is missing or nonsense', () => {
    expect(bmi(null, 178)).toBeNull()
    expect(bmi(82.5, null)).toBeNull()
    expect(bmi(82.5, 0)).toBeNull()
    expect(bmi(0, 178)).toBeNull()
  })

  it('bands on the standard boundaries', () => {
    expect(bmiBand(18.4)).toBe('under')
    expect(bmiBand(18.5)).toBe('healthy')
    expect(bmiBand(24.9)).toBe('healthy')
    expect(bmiBand(25)).toBe('over')
    expect(bmiBand(29.9)).toBe('over')
    expect(bmiBand(30)).toBe('obese')
  })
})
