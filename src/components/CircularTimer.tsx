import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'

/**
 * A countdown drawn as a depleting ring.
 *
 * The ring is driven straight from `remaining` rather than animated on a
 * timeline, so it stays exact if the tab is backgrounded and resumed. Only
 * `stroke-dashoffset` changes, which the compositor handles without layout.
 */
export function CircularTimer({
  remaining,
  total,
  size = 176,
  thickness = 10,
  label,
  tone = 'accent',
  className,
}: {
  remaining: number
  total: number
  size?: number
  thickness?: number
  label?: string
  tone?: 'accent' | 'teal'
  className?: string
}) {
  const gradientId = useId()
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0
  const seconds = Math.ceil(remaining)
  // The last few seconds get a colour and scale cue, for glancing at mid-set.
  const finishing = seconds <= 3 && seconds > 0

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={tone === 'teal' ? 'var(--teal)' : 'var(--accent)'} />
            <stop offset="100%" stopColor={tone === 'teal' ? 'var(--mint)' : 'var(--rose)'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sunken)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap={fraction > 0.01 ? 'round' : 'butt'}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ? (
          <span className="text-micro uppercase text-faint">{label}</span>
        ) : null}
        <motion.span
          key={seconds}
          initial={finishing ? { scale: 1.18 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 420 }}
          className={cn(
            'tabular text-[2.75rem] font-bold leading-none tracking-tight',
            finishing ? 'text-accent' : 'text-ink',
          )}
        >
          {formatDuration(seconds)}
        </motion.span>
      </div>
    </div>
  )
}
