import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Info, Repeat2, SkipForward } from 'lucide-react'
import { ExerciseGlyph } from '@/components/ExerciseGlyph'
import { cn } from '@/lib/cn'
import { requireExercise } from '@/data/exercises'
import type { ExerciseLog, SetLog } from '@/storage/types'
import { SetRow } from './SetRow'

const SECTION_LABEL = {
  warmup: 'Warm-up',
  main: 'Working set',
  cooldown: 'Cool-down',
} as const

export function ExerciseRunner({
  log,
  index,
  total,
  showWeight,
  holdingSet,
  holdRemaining,
  onSetChange,
  onToggleSet,
  onStartHold,
  onStopHold,
  onNote,
  onSkip,
}: {
  log: ExerciseLog
  index: number
  total: number
  showWeight: boolean
  holdingSet: number | null
  holdRemaining: number | null
  onSetChange: (setIndex: number, patch: Partial<SetLog>) => void
  onToggleSet: (setIndex: number) => void
  onStartHold: (setIndex: number) => void
  onStopHold: () => void
  onNote: (note: string) => void
  onSkip: () => void
}) {
  const [showHow, setShowHow] = useState(false)
  const exercise = requireExercise(log.exerciseId)
  const perSide = exercise.kind === 'repsPerSide' || exercise.kind === 'timePerSide'

  const target =
    log.plannedSeconds != null
      ? `${log.plannedSets} × ${log.plannedSeconds}s`
      : `${log.plannedSets} × ${log.plannedReps ?? '—'}`

  return (
    <motion.section
      key={log.exerciseId + index}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn('space-y-4', log.skipped && 'opacity-50')}
    >
      <div className="rounded-xl3 border border-line bg-surface p-5 shadow-card">
        <div className="flex items-start gap-4">
          <ExerciseGlyph glyph={exercise.glyph} className="h-20 w-20" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-faint">
              {SECTION_LABEL[log.section]} · {index + 1} of {total}
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-ink">
              {exercise.name}
            </h2>
            <p className="mt-1 text-sm leading-snug text-muted">{exercise.summary}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent tabular">
            {target}
            {perSide ? ' each side' : ''}
          </span>
          <span className="rounded-full bg-sunken px-3 py-1.5 text-xs font-medium text-muted tabular">
            {log.restSeconds}s rest
          </span>
          {log.coachNote ? (
            <span className="rounded-full bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber">
              {log.coachNote}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setShowHow((open) => !open)}
          aria-expanded={showHow}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-sunken px-4 py-3 text-left active:bg-line"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Info className="h-4 w-4 text-accent" />
            How to do it
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-faint transition-transform', showHow && 'rotate-180')}
          />
        </button>

        <AnimatePresence initial={false}>
          {showHow ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <ol className="mt-4 space-y-2.5">
                {exercise.instructions.map((line, i) => (
                  <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sunken text-[11px] font-bold text-faint">
                      {i + 1}
                    </span>
                    {line}
                  </li>
                ))}
              </ol>

              {exercise.cues.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {exercise.cues.map((cue) => (
                    <span
                      key={cue}
                      className="rounded-full border border-line bg-sunken px-3 py-1.5 text-xs font-medium text-muted"
                    >
                      {cue}
                    </span>
                  ))}
                </div>
              ) : null}

              {exercise.regression || exercise.progression ? (
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  {exercise.regression ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-teal">Easier</dt>
                      <dd className="text-muted">{exercise.regression}</dd>
                    </div>
                  ) : null}
                  {exercise.progression ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-accent">Harder</dt>
                      <dd className="text-muted">{exercise.progression}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        {log.sets.map((set, setIndex) => (
          <SetRow
            key={setIndex}
            index={setIndex}
            set={set}
            kind={exercise.kind}
            loadable={Boolean(exercise.loadable)}
            showWeight={showWeight}
            isHolding={holdingSet === setIndex}
            holdRemaining={holdRemaining}
            onChange={(patch) => onSetChange(setIndex, patch)}
            onToggleDone={() => onToggleSet(setIndex)}
            onStartHold={() => onStartHold(setIndex)}
            onStopHold={onStopHold}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          value={log.note ?? ''}
          onChange={(event) => onNote(event.target.value)}
          placeholder="Note for this exercise…"
          aria-label="Exercise note"
          className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={onSkip}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold text-muted active:scale-95"
        >
          {log.skipped ? <Repeat2 className="h-4 w-4" /> : <SkipForward className="h-4 w-4" />}
          {log.skipped ? 'Restore' : 'Skip'}
        </button>
      </div>
    </motion.section>
  )
}
