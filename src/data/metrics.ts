import type { MeasurementField } from '@/storage/types'

/**
 * The body metrics, described once so the entry form, the trend list and the
 * unit conversion all read from the same place.
 *
 * Storage is always metric — kilograms and centimetres — regardless of the
 * display unit, so switching units never rewrites history.
 */

export type MetricKind = 'weight' | 'length' | 'percent' | 'rating' | 'count' | 'seconds'

export type MetricGroup = 'Composition' | 'Girths' | 'Performance'

export interface MetricDefinition {
  field: MeasurementField
  label: string
  group: MetricGroup
  kind: MetricKind
  /** Sensible entry bounds — wide enough not to fight a real reading. */
  min: number
  max: number
  step: number
  decimals: number
  /** True when a smaller number is the goal. Drives the trend colour. */
  lowerIsBetter: boolean
  /** Shown under the field when the meaning is not obvious. */
  hint?: string
  /** Paired left/right metrics render side by side. */
  pairKey?: string
}

export const METRICS: MetricDefinition[] = [
  {
    field: 'weightKg',
    label: 'Weight',
    group: 'Composition',
    kind: 'weight',
    min: 0,
    max: 400,
    step: 0.1,
    decimals: 1,
    lowerIsBetter: true,
  },
  {
    field: 'bodyFatPct',
    label: 'Body fat',
    group: 'Composition',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.1,
    decimals: 1,
    lowerIsBetter: true,
  },
  {
    field: 'musclePct',
    label: 'Muscle',
    group: 'Composition',
    kind: 'percent',
    min: 0,
    max: 100,
    step: 0.1,
    decimals: 1,
    lowerIsBetter: false,
    // Consumer scales report "Muscle Rate": every lean soft tissue — skeletal
    // and smooth muscle, organs, their water — as a share of body weight.
    // Everything except fat and bone mineral, so it runs far higher than the
    // skeletal-muscle percentage this field used to ask for.
    hint: 'Your scale’s Muscle Rate. Counts all lean tissue, not just skeletal muscle, so 70–85% is normal.',
  },
  {
    field: 'visceralFat',
    label: 'Visceral fat',
    group: 'Composition',
    kind: 'rating',
    min: 0,
    max: 59,
    step: 1,
    decimals: 0,
    lowerIsBetter: true,
    hint: 'The rating your scale reports. Under 10 is the usual target.',
  },

  {
    field: 'neckCm',
    label: 'Neck',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 100,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: true,
  },
  {
    field: 'chestCm',
    label: 'Chest',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 200,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
  },
  {
    field: 'waistCm',
    label: 'Waist',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 200,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: true,
    hint: 'At the navel, relaxed, at the end of a normal breath out.',
  },
  {
    field: 'hipsCm',
    label: 'Hips',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 200,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: true,
  },
  {
    field: 'armLeftCm',
    label: 'Left arm',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 100,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'arm',
  },
  {
    field: 'armRightCm',
    label: 'Right arm',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 100,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'arm',
  },
  {
    field: 'thighLeftCm',
    label: 'Left thigh',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 120,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'thigh',
  },
  {
    field: 'thighRightCm',
    label: 'Right thigh',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 120,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'thigh',
  },
  {
    field: 'calfLeftCm',
    label: 'Left calf',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 100,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'calf',
  },
  {
    field: 'calfRightCm',
    label: 'Right calf',
    group: 'Girths',
    kind: 'length',
    min: 0,
    max: 100,
    step: 0.5,
    decimals: 1,
    lowerIsBetter: false,
    pairKey: 'calf',
  },

  {
    field: 'pushupMax',
    label: 'Push-up max',
    group: 'Performance',
    kind: 'count',
    min: 0,
    max: 300,
    step: 1,
    decimals: 0,
    lowerIsBetter: false,
    hint: 'One all-out set, good form only.',
  },
  {
    field: 'plankSeconds',
    label: 'Plank hold',
    group: 'Performance',
    kind: 'seconds',
    min: 0,
    max: 900,
    step: 5,
    decimals: 0,
    lowerIsBetter: false,
  },
]

export const METRIC_GROUPS: MetricGroup[] = ['Composition', 'Girths', 'Performance']

export function metricsIn(group: MetricGroup): MetricDefinition[] {
  return METRICS.filter((m) => m.group === group)
}

const byField = new Map(METRICS.map((m) => [m.field, m]))

export function getMetric(field: MeasurementField): MetricDefinition | undefined {
  return byField.get(field)
}

/**
 * BMI, derived rather than stored.
 *
 * Storing it would let it drift out of step with the weight sitting next to it,
 * and a smart scale computes it from exactly these two numbers anyway.
 */
export function bmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg == null || heightCm == null || heightCm <= 0 || weightKg <= 0) return null
  const metres = heightCm / 100
  return weightKg / (metres * metres)
}

export type BmiBand = 'under' | 'healthy' | 'over' | 'obese'

export function bmiBand(value: number): BmiBand {
  if (value < 18.5) return 'under'
  if (value < 25) return 'healthy'
  if (value < 30) return 'over'
  return 'obese'
}

export const BMI_BAND_LABELS: Record<BmiBand, string> = {
  under: 'Under the healthy range',
  healthy: 'Healthy range',
  over: 'Above the healthy range',
  obese: 'Well above the healthy range',
}
