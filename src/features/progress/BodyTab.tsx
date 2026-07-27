import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Ruler, Timer, TrendingDown, Zap } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { LineChart } from '@/components/Chart'
import { EmptyState } from '@/components/Feedback'
import { Field, NumberInput, TextInput } from '@/components/Fields'
import { BottomSheet } from '@/components/Overlay'
import { StatCard } from '@/components/StatCard'
import { formatShort, type DateKey } from '@/lib/date'
import {
  formatDuration,
  formatLength,
  formatWeight,
  fromDisplayLength,
  fromDisplayWeight,
  roundTo,
  toDisplayLength,
  toDisplayWeight,
} from '@/lib/format'
import { allMeasurements, getMeasurement, saveMeasurement } from '@/storage/repo'
import type { Measurement, Units } from '@/storage/types'
import { PhotoStrip } from './PhotoStrip'

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

  const patch = (values: Partial<Measurement>) =>
    setDraft((current) => (current ? { ...current, ...values } : current))

  const save = async () => {
    if (!draft) return
    await saveMeasurement(date, {
      weightKg: draft.weightKg,
      waistCm: draft.waistCm,
      pushupMax: draft.pushupMax,
      plankSeconds: draft.plankSeconds,
      note: draft.note,
    })
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Log measurements"
      description="Weigh yourself at the same time of day — first thing works best."
      footer={
        <Button full size="lg" onClick={() => void save()}>
          Save
        </Button>
      }
    >
      {draft ? (
        <div className="space-y-6">
          <Field label={`Weight (${units === 'metric' ? 'kg' : 'lb'})`}>
            <NumberInput
              value={draft.weightKg == null ? null : roundTo(toDisplayWeight(draft.weightKg, units), 1)}
              onChange={(value) =>
                patch({ weightKg: value == null ? null : fromDisplayWeight(value, units) })
              }
              step={0.1}
              min={0}
              max={400}
              decimals={1}
            />
          </Field>

          <Field label={`Waist (${units === 'metric' ? 'cm' : 'in'})`}>
            <NumberInput
              value={draft.waistCm == null ? null : roundTo(toDisplayLength(draft.waistCm, units), 1)}
              onChange={(value) =>
                patch({ waistCm: value == null ? null : fromDisplayLength(value, units) })
              }
              step={0.5}
              min={0}
              max={250}
              decimals={1}
            />
          </Field>

          <Field label="Push-up max" hint="One all-out set, good form only.">
            <NumberInput
              value={draft.pushupMax}
              onChange={(pushupMax) => patch({ pushupMax })}
              step={1}
              min={0}
              max={200}
            />
          </Field>

          <Field label="Plank hold (seconds)">
            <NumberInput
              value={draft.plankSeconds}
              onChange={(plankSeconds) => patch({ plankSeconds })}
              step={5}
              min={0}
              max={900}
            />
          </Field>

          <Field label="Note">
            <TextInput
              value={draft.note}
              onChange={(event) => patch({ note: event.target.value })}
              placeholder="Optional"
            />
          </Field>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-faint">Loading…</p>
      )}
    </BottomSheet>
  )
}

export function BodyTab({ today, units }: { today: DateKey; units: Units }) {
  const [logging, setLogging] = useState(false)
  const measurements = useLiveQuery(() => allMeasurements(), [])

  const rows = measurements ?? []
  const withWeight = rows.filter((m) => m.weightKg != null)
  const withWaist = rows.filter((m) => m.waistCm != null)
  const latest = rows.at(-1)
  const first = rows[0]

  const weightDelta =
    withWeight.length >= 2
      ? (withWeight.at(-1)!.weightKg ?? 0) - (withWeight[0].weightKg ?? 0)
      : null

  return (
    <div className="space-y-6">
      <Button full size="lg" icon={<Plus className="h-5 w-5" />} onClick={() => setLogging(true)}>
        Log today's numbers
      </Button>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Ruler className="h-6 w-6" />}
          title="No measurements yet"
          description="Log your weight and waist once a week. That cadence is frequent enough to see a trend and slow enough to ignore the noise."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Weight"
              tone="accent"
              value={formatWeight(latest?.weightKg, units).split(' ')[0]}
              unit={units === 'metric' ? 'kg' : 'lb'}
            />
            <StatCard
              label="Waist"
              tone="indigo"
              value={formatLength(latest?.waistCm, units).split(' ')[0]}
              unit={units === 'metric' ? 'cm' : 'in'}
            />
            <StatCard
              label="Push-up max"
              tone="amber"
              icon={<Zap className="h-3.5 w-3.5" />}
              value={latest?.pushupMax ?? '—'}
            />
            <StatCard
              label="Plank"
              tone="sky"
              icon={<Timer className="h-3.5 w-3.5" />}
              value={latest?.plankSeconds ? formatDuration(latest.plankSeconds) : '—'}
            />
          </div>

          {weightDelta != null ? (
            <Card className="flex items-center gap-3">
              <TrendingDown
                className={weightDelta <= 0 ? 'h-5 w-5 text-mint' : 'h-5 w-5 rotate-180 text-amber'}
              />
              <p className="text-sm leading-relaxed text-muted">
                {weightDelta <= 0 ? 'Down' : 'Up'}{' '}
                <span className="font-semibold text-ink">
                  {formatWeight(Math.abs(weightDelta), units)}
                </span>{' '}
                since {first ? formatShort(first.date) : 'the start'}.
              </p>
            </Card>
          ) : null}

          {withWeight.length >= 2 ? (
            <div>
              <SectionTitle>Weight</SectionTitle>
              <Card>
                <LineChart
                  labels={withWeight.map((m) => formatShort(m.date))}
                  series={[
                    {
                      label: units === 'metric' ? 'kg' : 'lb',
                      points: withWeight.map((m) => roundTo(toDisplayWeight(m.weightKg!, units), 1)),
                      token: 'accent',
                      fill: true,
                    },
                  ]}
                />
              </Card>
            </div>
          ) : null}

          {withWaist.length >= 2 ? (
            <div>
              <SectionTitle>Waist</SectionTitle>
              <Card>
                <LineChart
                  labels={withWaist.map((m) => formatShort(m.date))}
                  series={[
                    {
                      label: units === 'metric' ? 'cm' : 'in',
                      points: withWaist.map((m) => roundTo(toDisplayLength(m.waistCm!, units), 1)),
                      token: 'teal',
                      fill: true,
                    },
                  ]}
                />
              </Card>
            </div>
          ) : null}
        </>
      )}

      <PhotoStrip today={today} />

      <LogSheet open={logging} onClose={() => setLogging(false)} date={today} units={units} />
    </div>
  )
}
