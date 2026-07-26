import { Check, Minus, Play, Plus, Square } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import type { SetLog } from '@/storage/types'
import type { ExerciseKind } from '@/data/types'

function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  suffix,
  label,
}: {
  value: number
  onChange: (value: number) => void
  step: number
  min: number
  max: number
  suffix: string
  label: string
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-faint active:bg-sunken"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-14 text-center text-base font-semibold tabular text-ink">
        {value}
        <span className="ml-0.5 text-xs font-medium text-faint">{suffix}</span>
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-faint active:bg-sunken"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function SetRow({
  index,
  set,
  kind,
  loadable,
  showWeight,
  holdRemaining,
  isHolding,
  onChange,
  onToggleDone,
  onStartHold,
  onStopHold,
}: {
  index: number
  set: SetLog
  kind: ExerciseKind
  loadable: boolean
  showWeight: boolean
  holdRemaining: number | null
  isHolding: boolean
  onChange: (patch: Partial<SetLog>) => void
  onToggleDone: () => void
  onStartHold: () => void
  onStopHold: () => void
}) {
  const timed = kind === 'time' || kind === 'timePerSide'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors',
        set.done ? 'border-mint/30 bg-mint/10' : 'border-line bg-sunken',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular',
          set.done ? 'bg-mint/20 text-mint' : 'bg-raised text-faint',
        )}
      >
        {index + 1}
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        {timed ? (
          isHolding ? (
            <span className="text-lg font-semibold tabular text-accent">
              {formatDuration(Math.ceil(holdRemaining ?? 0))}
            </span>
          ) : (
            <Stepper
              value={set.seconds ?? 30}
              onChange={(seconds) => onChange({ seconds })}
              step={5}
              min={5}
              max={600}
              suffix="s"
              label="seconds"
            />
          )
        ) : (
          <Stepper
            value={set.reps ?? 0}
            onChange={(reps) => onChange({ reps })}
            step={1}
            min={0}
            max={100}
            suffix="reps"
            label="reps"
          />
        )}

        {loadable && showWeight ? (
          <Stepper
            value={set.weightKg ?? 0}
            onChange={(weightKg) => onChange({ weightKg })}
            step={1}
            min={0}
            max={200}
            suffix="kg"
            label="weight"
          />
        ) : null}
      </div>

      {timed && !set.done ? (
        <button
          type="button"
          aria-label={isHolding ? 'Stop hold' : 'Start hold'}
          onClick={isHolding ? onStopHold : onStartHold}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raised text-accent active:scale-95"
        >
          {isHolding ? <Square className="h-4 w-4" /> : <Play className="h-5 w-5" />}
        </button>
      ) : null}

      <button
        type="button"
        aria-label={set.done ? `Set ${index + 1} done, undo` : `Mark set ${index + 1} done`}
        aria-pressed={set.done}
        onClick={onToggleDone}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors active:scale-95',
          set.done ? 'bg-mint text-white' : 'border border-line-strong bg-raised text-faint',
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  )
}
