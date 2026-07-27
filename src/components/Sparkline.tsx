import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * A shape, not a chart. No axes, no grid, no legend — just enough to see
 * whether a number has been going up or down.
 *
 * Plain inline SVG on purpose: the Body screen shows a dozen of these at once,
 * and pulling Chart.js onto the route for that would cost more than it says.
 */
export function Sparkline({
  values,
  tone = 'accent',
  width = 84,
  height = 28,
  className,
}: {
  values: number[]
  tone?: 'accent' | 'mint' | 'amber' | 'muted'
  width?: number
  height?: number
  className?: string
}) {
  const gradientId = useId()

  if (values.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ width, height }}
        aria-hidden
      >
        <span className="h-px w-full bg-line" />
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width
    // Flat lines sit in the middle rather than pinned to the bottom.
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const stroke = `var(--${tone === 'muted' ? 'faint' : tone})`
  const [lastX, lastY] = points.at(-1)!

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  )
}
