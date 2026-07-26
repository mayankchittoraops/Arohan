import { motion } from 'framer-motion'
import { Plus, SkipForward } from 'lucide-react'
import { formatDuration } from '@/lib/format'

/**
 * The rest bar. Sits above the navigation while a set is resting and stays out
 * of the way — one tap skips it, one tap adds fifteen seconds.
 */
export function RestTimer({
  remaining,
  total,
  onSkip,
  onAdd,
}: {
  remaining: number
  total: number
  onSkip: () => void
  onAdd: () => void
}) {
  const progress = total > 0 ? 1 - remaining / total : 1

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 340 }}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pb-safe"
    >
      <div className="mx-auto max-w-lg overflow-hidden rounded-xl3 border border-line bg-raised/95 shadow-card backdrop-blur-xl">
        <div className="h-1 w-full bg-sunken">
          <div
            className="h-full bg-accent transition-[width] duration-200 ease-linear"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-3 p-3 pl-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-faint">Rest</p>
            <p className="text-2xl font-semibold tabular tracking-tight text-ink">
              {formatDuration(Math.ceil(remaining))}
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-12 items-center gap-1 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold text-muted active:scale-95"
          >
            <Plus className="h-4 w-4" />
            15s
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex h-12 items-center gap-1.5 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-ink active:scale-95"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  )
}
