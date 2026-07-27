import { motion } from 'framer-motion'
import { Check, Flame } from 'lucide-react'
import { Button } from '@/components/Button'
import { ProgressRing } from '@/components/ProgressRing'
import { formatMinutes, pluralise } from '@/lib/format'
import { DURATION, EASE_OUT_SOFT, SPRING } from '@/lib/motion'

/** Fixed offsets, so the burst is identical every time rather than random. */
const SPARKS = [
  { x: -104, y: -46, d: 0.02, c: 'bg-accent' },
  { x: -58, y: -96, d: 0.06, c: 'bg-amber' },
  { x: 4, y: -114, d: 0.0, c: 'bg-mint' },
  { x: 66, y: -92, d: 0.08, c: 'bg-rose' },
  { x: 108, y: -40, d: 0.04, c: 'bg-teal' },
  { x: -92, y: 34, d: 0.1, c: 'bg-violet' },
  { x: 96, y: 30, d: 0.12, c: 'bg-sky' },
]

/**
 * Shown once, immediately after a session is saved. It is the only moment in
 * the app that celebrates, which is what keeps it from wearing thin.
 */
export function SessionComplete({
  templateName,
  durationSeconds,
  completedSets,
  plannedSets,
  totalReps,
  streak,
  message,
  onDone,
}: {
  templateName: string
  durationSeconds: number
  completedSets: number
  plannedSets: number
  totalReps: number
  streak: number
  message: string
  onDone: () => void
}) {
  const completion = plannedSets === 0 ? 1 : completedSets / plannedSets

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas px-6 pb-safe pt-safe"
    >
      <div className="relative">
        {SPARKS.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full ${s.c}`}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: s.x, y: s.y, scale: [0, 1, 0.4], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, delay: 0.18 + s.d, ease: EASE_OUT_SOFT }}
          />
        ))}

        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING.bounce}
        >
          <ProgressRing value={completion} size={172} thickness={14}>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SPRING.bounce, delay: 0.25 }}
            >
              <Check className="h-16 w-16 text-mint" strokeWidth={2.6} />
            </motion.span>
          </ProgressRing>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, delay: 0.2, ease: EASE_OUT_SOFT }}
        className="mt-8 w-full max-w-sm text-center"
      >
        <h1 className="text-display text-ink">Session complete</h1>
        <p className="mt-2 text-body text-muted">{templateName}</p>

        <dl className="mt-7 grid grid-cols-3 gap-2 rounded-xl2 border border-line bg-surface p-4">
          <div>
            <dd className="text-title tabular text-ink">{formatMinutes(durationSeconds)}</dd>
            <dt className="text-caption text-faint">Time</dt>
          </div>
          <div>
            <dd className="text-title tabular text-ink">{completedSets}</dd>
            <dt className="text-caption text-faint">Sets</dt>
          </div>
          <div>
            <dd className="text-title tabular text-ink">{totalReps}</dd>
            <dt className="text-caption text-faint">Reps</dt>
          </div>
        </dl>

        {streak > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-label font-semibold text-accent">
            <Flame className="h-4 w-4" />
            {pluralise(streak, 'day')} in a row
          </p>
        ) : null}

        <p className="mt-5 text-body leading-relaxed text-muted">{message}</p>

        <Button className="mt-8" full size="lg" onClick={onDone}>
          Done
        </Button>
      </motion.div>
    </motion.div>
  )
}
