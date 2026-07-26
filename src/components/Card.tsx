import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-line bg-surface p-5 shadow-card',
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
