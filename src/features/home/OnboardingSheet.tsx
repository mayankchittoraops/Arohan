import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/Button'
import { Field, Segmented, TextInput } from '@/components/Fields'
import { Sheet } from '@/components/Sheet'
import { EQUIPMENT_LABELS, OPTIONAL_EQUIPMENT } from '@/data/program'
import { useUpdateSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/cn'
import type { Equipment } from '@/data/types'
import type { Settings, Units } from '@/storage/types'

/** Shown once, on the very first launch. Three questions, then out of the way. */
export function OnboardingSheet({ settings }: { settings: Settings }) {
  const updateSettings = useUpdateSettings()
  const [name, setName] = useState(settings.name)
  const [units, setUnits] = useState<Units>(settings.units)
  const [equipment, setEquipment] = useState<Equipment[]>(settings.equipment)

  if (settings.onboarded) return null

  const toggle = (item: Equipment) =>
    setEquipment((current) =>
      current.includes(item) ? current.filter((e) => e !== item) : [...current, item],
    )

  return (
    <Sheet
      open
      onClose={() => void updateSettings({ onboarded: true })}
      title="Welcome to Arohan"
      description="A twelve-month climb, one session at a time. Everything stays on this device."
      footer={
        <Button
          full
          size="lg"
          onClick={() => void updateSettings({ name: name.trim(), units, equipment, onboarded: true })}
        >
          Start day one
        </Button>
      }
    >
      <div className="space-y-6">
        <Field label="What should I call you?">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="given-name"
          />
        </Field>

        <Field label="Units">
          <Segmented
            value={units}
            onChange={setUnits}
            ariaLabel="Units"
            options={[
              { value: 'metric', label: 'kg · cm' },
              { value: 'imperial', label: 'lb · in' },
            ]}
          />
        </Field>

        <Field
          label="What do you have?"
          hint="A mat, a wall and a chair are assumed. Add the rest when it arrives."
        >
          <div className="space-y-2">
            {OPTIONAL_EQUIPMENT.map((item) => {
              const owned = equipment.includes(item)
              return (
                <button
                  key={item}
                  type="button"
                  role="checkbox"
                  aria-checked={owned}
                  onClick={() => toggle(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                    owned ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
                  )}
                >
                  <span className={cn('flex-1 font-medium', owned ? 'text-accent' : 'text-ink')}>
                    {EQUIPMENT_LABELS[item]}
                  </span>
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      owned ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-transparent',
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                  </span>
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </Sheet>
  )
}
