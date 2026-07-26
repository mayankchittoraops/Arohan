import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const TONES = {
  accent: 'text-accent',
  teal: 'text-teal',
  indigo: 'text-indigo',
  rose: 'text-rose',
  amber: 'text-amber',
  sky: 'text-sky',
  violet: 'text-violet',
  mint: 'text-mint',
  muted: 'text-muted',
} as const

export type Tone = keyof typeof TONES

export function StatTile({
  label,
  value,
  unit,
  icon,
  tone = 'muted',
  onClick,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  tone?: Tone
  onClick?: () => void
  className?: string
}) {
  const Element = onClick ? 'button' : 'div'
  return (
    <Element
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-4 text-left',
        onClick && 'transition-transform active:scale-[0.98]',
        className,
      )}
    >
      <span className={cn('flex items-center gap-1.5 text-xs font-medium', TONES[tone])}>
        {icon}
        <span className="text-faint">{label}</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular tracking-tight text-ink">{value}</span>
        {unit ? <span className="text-xs font-medium text-faint">{unit}</span> : null}
      </span>
    </Element>
  )
}
