import { useState } from 'react'
import { Button } from '@/components/Button'
import { Field, ScalePicker, TextInput } from '@/components/Fields'
import { Sheet } from '@/components/Sheet'
import { formatMinutes } from '@/lib/format'
import type { SessionSummary } from '@/storage/session'

export interface FinishValues {
  rpe: number | null
  painAfter: number | null
  note: string
}

export function FinishSheet({
  open,
  onClose,
  onSave,
  summary,
  elapsedSeconds,
  saving,
}: {
  open: boolean
  onClose: () => void
  onSave: (values: FinishValues) => void
  summary: SessionSummary
  elapsedSeconds: number
  saving: boolean
}) {
  const [rpe, setRpe] = useState<number | null>(null)
  const [painAfter, setPainAfter] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const skipped = summary.plannedSets - summary.completedSets

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Finish session"
      description="Two quick answers, then it is saved and you are done."
      footer={
        <Button full size="lg" disabled={saving} onClick={() => onSave({ rpe, painAfter, note })}>
          {saving ? 'Saving…' : 'Save session'}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-sunken p-4 text-center">
          <div>
            <p className="text-xl font-semibold tabular text-ink">
              {formatMinutes(elapsedSeconds)}
            </p>
            <p className="text-xs text-faint">Duration</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular text-ink">
              {summary.completedSets}/{summary.plannedSets}
            </p>
            <p className="text-xs text-faint">Sets</p>
          </div>
          <div>
            <p className="text-xl font-semibold tabular text-ink">{summary.totalReps}</p>
            <p className="text-xs text-faint">Reps</p>
          </div>
        </div>

        {skipped > 0 ? (
          <p className="rounded-2xl bg-amber/10 px-4 py-3 text-sm leading-relaxed text-amber">
            {skipped} {skipped === 1 ? 'set was' : 'sets were'} left unticked. That is completely
            fine — the session still counts.
          </p>
        ) : null}

        <Field label="How hard did that feel?">
          <ScalePicker
            value={rpe}
            onChange={setRpe}
            min={1}
            max={10}
            lowLabel="Very easy"
            highLabel="All out"
          />
        </Field>

        <Field label="Lower back right now" hint="Tracking this is how the pattern becomes clear.">
          <ScalePicker
            value={painAfter}
            onChange={setPainAfter}
            min={0}
            max={10}
            lowLabel="No pain"
            highLabel="Severe"
            tone="rose"
          />
        </Field>

        <Field label="Anything worth remembering?">
          <TextInput
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>
    </Sheet>
  )
}
