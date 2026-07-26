import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function ProgressRing({
  value,
  size = 132,
  thickness = 12,
  children,
  className,
  label,
}: {
  /** 0–1. */
  value: number
  size?: number
  thickness?: number
  children?: ReactNode
  className?: string
  label?: string
}) {
  const gradientId = useId()
  const clamped = Math.min(1, Math.max(0, value))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role={label ? 'img' : 'presentation'}
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--rose)" />
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
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          // A rounded cap on a zero-length arc renders as a stray dot.
          strokeLinecap={clamped > 0.01 ? 'round' : 'butt'}
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      ) : null}
    </div>
  )
}

/** A slim horizontal bar for inline progress. */
export function ProgressBar({
  value,
  className,
  tone = 'accent',
}: {
  value: number
  className?: string
  tone?: 'accent' | 'teal' | 'mint'
}) {
  const clamped = Math.min(1, Math.max(0, value))
  const colour = tone === 'accent' ? 'bg-accent' : tone === 'teal' ? 'bg-teal' : 'bg-mint'
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <motion.div
        className={cn('h-full rounded-full', colour)}
        initial={false}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
