import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Field, NumberInput, ScalePicker, TextInput } from '@/components/Fields'
import { Sheet } from '@/components/Sheet'
import { getDaily, saveDaily } from '@/storage/repo'
import type { DailyHealth } from '@/storage/types'
import type { DateKey } from '@/lib/date'

const ENERGY_WORDS = ['Empty', 'Low', 'Okay', 'Good', 'Excellent']

export function DailyCheckInSheet({
  open,
  onClose,
  date,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  date: DateKey
  onSaved?: () => void
}) {
  const [draft, setDraft] = useState<DailyHealth | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void getDaily(date).then((value) => {
      if (!cancelled) setDraft(value)
    })
    return () => {
      cancelled = true
    }
  }, [open, date])

  const patch = (values: Partial<DailyHealth>) =>
    setDraft((current) => (current ? { ...current, ...values } : current))

  const save = async () => {
    if (!draft) return
    await saveDaily(date, {
      sleepHours: draft.sleepHours,
      steps: draft.steps,
      energy: draft.energy,
      pain: draft.pain,
      notes: draft.notes,
    })
    onSaved?.()
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Daily check-in"
      description="Only fill in what you know. Blanks are fine."
      footer={
        <Button full size="lg" onClick={() => void save()}>
          Save
        </Button>
      }
    >
      {draft ? (
        <div className="space-y-6">
          <Field label="Sleep">
            <NumberInput
              value={draft.sleepHours}
              onChange={(sleepHours) => patch({ sleepHours })}
              step={0.5}
              min={0}
              max={16}
              decimals={1}
              suffix="hrs"
            />
          </Field>

          <Field label="Steps">
            <NumberInput
              value={draft.steps}
              onChange={(steps) => patch({ steps })}
              step={500}
              min={0}
              max={60000}
            />
          </Field>

          <Field
            label="Energy"
            hint={draft.energy ? ENERGY_WORDS[draft.energy - 1] : 'How much is in the tank?'}
          >
            <ScalePicker
              value={draft.energy}
              onChange={(energy) => patch({ energy })}
              min={1}
              max={5}
              lowLabel="Empty"
              highLabel="Excellent"
              tone="mint"
            />
          </Field>

          <Field label="Lower back pain" hint="Zero is no pain at all.">
            <ScalePicker
              value={draft.pain}
              onChange={(pain) => patch({ pain })}
              min={0}
              max={10}
              lowLabel="None"
              highLabel="Severe"
              tone="rose"
            />
          </Field>

          <Field label="Notes">
            <TextInput
              value={draft.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Anything about today"
            />
          </Field>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-faint">Loading…</p>
      )}
    </Sheet>
  )
}
