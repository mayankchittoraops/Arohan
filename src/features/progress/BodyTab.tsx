import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Ruler, Scale } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { EmptyState } from '@/components/Feedback'
import { Field, NumberInput, TextInput } from '@/components/Fields'
import { BottomSheet } from '@/components/Overlay'
import { BlockSkeleton } from '@/components/Page'
import {
  BMI_BAND_LABELS,
  bmi,
  bmiBand,
  METRIC_GROUPS,
  METRICS,
  metricsIn,
  type MetricDefinition,
} from '@/data/metrics'
import { cn } from '@/lib/cn'
import { formatRelative, type DateKey } from '@/lib/date'
import { fromDisplayLength, fromDisplayWeight, roundTo } from '@/lib/format'
import { allMeasurements, getMeasurement, saveMeasurement } from '@/storage/repo'
import { asymmetry, trendFor } from '@/storage/trends'
import type { Measurement, Units } from '@/storage/types'
import { formatValue, MetricRow, toDisplay, unitLabel } from './MetricRow'
import { PhotoStrip } from './PhotoStrip'

/** Converts an entered display value back into the stored metric unit. */
function fromDisplay(value: number, metric: MetricDefinition, units: Units): number {
  if (metric.kind === 'weight') return fromDisplayWeight(value, units)
  if (metric.kind === 'length') return fromDisplayLength(value, units)
  return value
}

function LogSheet({
  open,
  onClose,
  date,
  units,
}: {
  open: boolean
  onClose: () => void
  date: DateKey
  units: Units
}) {
  const [draft, setDraft] = useState<Measurement | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void getMeasurement(date).then((value) => {
      if (!cancelled) setDraft(value)
    })
    return () => {
      cancelled = true
    }
  }, [open, date])

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const { date: _d, updatedAt: _u, ...patch } = draft
      await saveMeasurement(date, patch)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Log measurements"
      description="Fill in only what you measured. Blanks stay blank — nothing is required."
      footer={
        <Button full size="lg" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      }
    >
      {draft ? (
        <div className="space-y-6">
          {METRIC_GROUPS.map((group) => (
            <section key={group}>
              <h3 className="mb-3 text-micro uppercase text-faint">{group}</h3>
              <div className="space-y-4">
                {metricsIn(group).map((metric) => {
                  const stored = draft[metric.field]
                  const shown =
                    stored == null ? null : roundTo(toDisplay(stored, metric, units), metric.decimals)

                  return (
                    <Field
                      key={metric.field}
                      label={`${metric.label}${unitLabel(metric, units) ? ` (${unitLabel(metric, units)})` : ''}`}
                      hint={metric.hint}
                    >
                      <NumberInput
                        value={shown}
                        min={metric.min}
                        max={metric.max}
                        step={metric.step}
                        decimals={metric.decimals}
                        onChange={(value) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  [metric.field]:
                                    value == null ? null : fromDisplay(value, metric, units),
                                }
                              : current,
                          )
                        }
                      />
                    </Field>
                  )
                })}
              </div>
            </section>
          ))}

          <Field label="Note">
            <TextInput
              value={draft.note}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, note: event.target.value } : current))
              }
              placeholder="Optional — time of day, how you felt"
            />
          </Field>
        </div>
      ) : (
        <BlockSkeleton rows={2} />
      )}
    </BottomSheet>
  )
}

/** Weight plus height, expressed as a band rather than a bare number. */
function BmiCard({
  weightKg,
  heightCm,
  onSetHeight,
}: {
  weightKg: number | null
  heightCm: number | null
  onSetHeight: () => void
}) {
  const value = bmi(weightKg, heightCm)

  if (value == null) {
    return (
      <Card tone="sunken" className="mb-section">
        <p className="text-label leading-relaxed text-muted">
          {weightKg == null
            ? 'Log a weight and set your height to see BMI.'
            : 'Set your height in Settings and BMI appears here.'}
        </p>
        {weightKg != null ? (
          <Button variant="secondary" className="mt-3" onClick={onSetHeight}>
            Set height
          </Button>
        ) : null}
      </Card>
    )
  }

  const band = bmiBand(value)
  const tone =
    band === 'healthy' ? 'text-mint' : band === 'under' ? 'text-sky' : band === 'over' ? 'text-amber' : 'text-rose'

  return (
    <Card className="mb-section flex items-center justify-between gap-4">
      <div>
        <p className="text-micro uppercase text-faint">BMI</p>
        <p className="mt-1 text-display tabular text-ink">{roundTo(value, 1)}</p>
      </div>
      <p className={cn('text-right text-label font-semibold', tone)}>{BMI_BAND_LABELS[band]}</p>
    </Card>
  )
}

export function BodyTab({
  today,
  units,
  heightCm,
  onOpenSettings,
}: {
  today: DateKey
  units: Units
  heightCm: number | null
  onOpenSettings: () => void
}) {
  const [logging, setLogging] = useState(false)
  const measurements = useLiveQuery(() => allMeasurements(), [])

  const trends = useMemo(
    () => (measurements ? METRICS.map((m) => trendFor(m.field, measurements)) : []),
    [measurements],
  )
  const byField = useMemo(() => new Map(trends.map((t) => [t.field, t])), [trends])

  if (!measurements) return <BlockSkeleton />

  const logged = trends.filter((t) => t.count > 0)
  const latestWeight = byField.get('weightKg')?.latest ?? null
  const lastEntry = measurements.at(-1)

  /* Left/right differences worth mentioning. */
  const pairs: Array<[string, number | null]> = [
    ['Arms', asymmetry(byField.get('armLeftCm')?.latest ?? null, byField.get('armRightCm')?.latest ?? null)],
    ['Thighs', asymmetry(byField.get('thighLeftCm')?.latest ?? null, byField.get('thighRightCm')?.latest ?? null)],
    ['Calves', asymmetry(byField.get('calfLeftCm')?.latest ?? null, byField.get('calfRightCm')?.latest ?? null)],
  ]
  const notable = pairs.filter(([, value]) => value != null && value >= 3)

  return (
    <div className="space-y-section">
      <Button full size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => setLogging(true)}>
        Log measurements
      </Button>

      {logged.length === 0 ? (
        <EmptyState
          icon={<Ruler className="h-6 w-6" />}
          title="No measurements yet"
          description="Weigh in weekly and take the tape measure out monthly. That cadence is often enough to see a trend and rare enough to ignore the noise."
        />
      ) : (
        <>
          <BmiCard weightKg={latestWeight} heightCm={heightCm} onSetHeight={onOpenSettings} />

          {lastEntry ? (
            <p className="-mt-2 px-1 text-caption text-faint">
              Last logged {formatRelative(lastEntry.date, today)}
              {lastEntry.note ? ` · ${lastEntry.note}` : ''}
            </p>
          ) : null}

          {METRIC_GROUPS.map((group) => {
            const rows = metricsIn(group).filter((m) => (byField.get(m.field)?.count ?? 0) > 0)
            if (rows.length === 0) return null

            return (
              <div key={group}>
                <SectionTitle>{group}</SectionTitle>
                <Card className="overflow-hidden p-0">
                  <ul>
                    {rows.map((metric) => (
                      <MetricRow
                        key={metric.field}
                        metric={metric}
                        trend={byField.get(metric.field)!}
                        units={units}
                      />
                    ))}
                  </ul>
                </Card>
              </div>
            )
          })}

          {notable.length > 0 ? (
            <Card tone="sunken" className="flex items-start gap-3">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              <p className="text-label leading-relaxed text-muted">
                {notable.map(([name, value]) => `${name} differ by ${roundTo(value!, 1)}%`).join(', ')}.
                Some difference is normal — single-sided work will even it out over time.
              </p>
            </Card>
          ) : null}
        </>
      )}

      <PhotoStrip today={today} />

      <LogSheet open={logging} onClose={() => setLogging(false)} date={today} units={units} />
    </div>
  )
}

export { formatValue }
