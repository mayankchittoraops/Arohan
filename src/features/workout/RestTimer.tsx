import { motion } from 'framer-motion'
import { Plus, SkipForward } from 'lucide-react'
import { CircularTimer } from '@/components/CircularTimer'
import { SPRING } from '@/lib/motion'

/**
 * The rest panel. Large enough to read from the mat at arm's length, and it
 * keeps the set list above it reachable so a mistyped rep count can still be
 * corrected while resting.
 */
export function RestTimer({
  remaining,
  total,
  nextLabel,
  onSkip,
  onAdd,
}: {
  remaining: number
  total: number
  /** What is coming up, so the next set can be set up during the rest. */
  nextLabel?: string
  onSkip: () => void
  onAdd: () => void
}) {
  return (
    <motion.div
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={SPRING.panel}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pb-safe"
      role="status"
      aria-live="polite"
      aria-label={`Resting, ${Math.ceil(remaining)} seconds remaining`}
    >
      <div className="mx-auto max-w-lg overflow-hidden rounded-xl3 border border-line bg-raised/95 shadow-lifted backdrop-blur-xl">
        <div className="flex flex-col items-center px-5 pb-5 pt-6">
          <CircularTimer remaining={remaining} total={total} label="Rest" size={168} />

          {nextLabel ? (
            <p className="mt-4 text-center text-label text-muted">
              Next up · <span className="font-semibold text-ink">{nextLabel}</span>
            </p>
          ) : null}

          <div className="mt-5 flex w-full gap-3">
            <button
              type="button"
              onClick={onAdd}
              className="flex h-13 min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface text-label font-semibold text-muted transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              15 seconds
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="flex h-13 min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent text-label font-semibold text-accent-ink transition-transform active:scale-95"
            >
              <SkipForward className="h-4 w-4" />
              Skip rest
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
