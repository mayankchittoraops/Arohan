import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Standard page frame: safe areas, a max width for iPad, room for the nav. */
export function Page({
  children,
  className,
  wide,
}: {
  children?: ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'mx-auto w-full px-4 pb-32 pt-safe',
        wide ? 'max-w-3xl' : 'max-w-xl',
        className,
      )}
    >
      {children}
    </motion.main>
  )
}

/** Placeholder while IndexedDB opens — a beat, not a spinner. */
export function PageSkeleton({ wide }: { wide?: boolean }) {
  return (
    <Page wide={wide}>
      <div className="animate-pulse space-y-4 pt-10">
        <div className="h-8 w-1/2 rounded-xl bg-sunken" />
        <div className="h-4 w-1/3 rounded-lg bg-sunken" />
        <div className="h-44 rounded-xl2 bg-sunken" />
        <div className="h-28 rounded-xl2 bg-sunken" />
      </div>
    </Page>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex items-start justify-between gap-4 px-1 pb-6 pt-8', className)}>
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] leading-snug text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </header>
  )
}
