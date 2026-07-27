import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * `tone` rather than a background class in `className`: both would be the same
 * specificity, so which one won would depend on stylesheet order rather than
 * intent. This makes the choice explicit and impossible to get wrong.
 */
export function Card({
  className,
  children,
  tone = 'surface',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  tone?: 'surface' | 'sunken'
}) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-line p-5',
        tone === 'sunken' ? 'bg-sunken' : 'bg-surface shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3 px-1', className)}>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">
        {children}
      </h2>
      {action}
    </div>
  )
}
