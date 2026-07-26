import { createContext, useContext, useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * A field is deliberately not a `<label>`. Several of the controls below are
 * composites of buttons rather than a single input, and wrapping those in a
 * label both mangles their accessible name and forwards a second click into the
 * first control inside. Instead the label text gets an id and each control
 * points at it with `aria-labelledby`.
 */
const FieldLabelContext = createContext<string | undefined>(undefined)

function useFieldLabel(): string | undefined {
  return useContext(FieldLabelContext)
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('block', className)}>
      <span id={id} className="mb-2 block text-sm font-medium text-muted">
        {label}
      </span>
      <FieldLabelContext.Provider value={id}>{children}</FieldLabelContext.Provider>
      {hint ? <span className="mt-2 block text-xs text-faint">{hint}</span> : null}
    </div>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const labelledBy = useFieldLabel()
  return (
    <input
      aria-labelledby={props['aria-label'] ? undefined : labelledBy}
      className={cn(
        'h-12 w-full rounded-2xl border border-line bg-sunken px-4 text-ink',
        'placeholder:text-faint focus:border-accent focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  decimals = 0,
  className,
}: {
  value: number | null
  onChange: (value: number | null) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  decimals?: number
  className?: string
}) {
  const labelledBy = useFieldLabel()
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  const display = value == null ? '' : String(Number(value.toFixed(decimals)))

  return (
    <div role="group" aria-labelledby={labelledBy} className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label="Decrease"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-raised text-muted active:scale-95 active:bg-sunken"
        onClick={() => onChange(clamp((value ?? 0) - step))}
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="relative flex-1">
        <input
          inputMode="decimal"
          aria-labelledby={labelledBy}
          value={display}
          placeholder="—"
          onChange={(event) => {
            const raw = event.target.value.replace(',', '.').trim()
            if (raw === '') return onChange(null)
            const parsed = Number(raw)
            if (Number.isFinite(parsed)) onChange(clamp(parsed))
          }}
          className="h-12 w-full rounded-2xl border border-line bg-sunken px-4 text-center text-lg font-semibold tabular text-ink focus:border-accent focus:outline-none"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-faint">
            {suffix}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Increase"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-raised text-muted active:scale-95 active:bg-sunken"
        onClick={() => onChange(clamp((value ?? 0) + step))}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}) {
  const labelledBy = useFieldLabel()
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : labelledBy}
      className={cn('flex gap-1 rounded-2xl bg-sunken p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-10 flex-1 rounded-xl px-3 text-sm font-medium transition-colors',
              active ? 'bg-surface text-ink shadow-card' : 'text-muted active:bg-line',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-4 py-3 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm leading-snug text-muted">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          'relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-out-soft)]',
            checked ? 'translate-x-[22px]' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}

/** A row of numbered buttons — used for pain, energy and effort scores. */
export function ScalePicker({
  value,
  onChange,
  min,
  max,
  lowLabel,
  highLabel,
  tone = 'accent',
}: {
  value: number | null
  onChange: (value: number | null) => void
  min: number
  max: number
  lowLabel: string
  highLabel: string
  tone?: 'accent' | 'rose' | 'mint'
}) {
  const labelledBy = useFieldLabel()
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const activeTone =
    tone === 'rose' ? 'bg-rose text-white' : tone === 'mint' ? 'bg-mint text-white' : 'bg-accent text-accent-ink'

  return (
    <div role="group" aria-labelledby={labelledBy}>
      <div className="flex flex-wrap gap-1.5">
        {values.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : option)}
              className={cn(
                'h-11 min-w-11 flex-1 rounded-xl text-sm font-semibold tabular transition-colors',
                active ? activeTone : 'bg-sunken text-muted active:bg-line',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-faint">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
