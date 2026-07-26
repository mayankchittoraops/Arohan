import { requireExercise } from '@/data/exercises'
import type { PlannedExercise } from '@/data/types'
import { ExerciseGlyph } from '@/components/ExerciseGlyph'

const SECTION_TITLE = {
  warmup: 'Warm-up',
  main: 'Main work',
  cooldown: 'Cool-down',
} as const

const ORDER = ['warmup', 'main', 'cooldown'] as const

/** The read-only list of everything a session contains. */
export function SessionPlan({ blocks }: { blocks: PlannedExercise[] }) {
  return (
    <div className="space-y-6">
      {ORDER.map((section) => {
        const items = blocks.filter((b) => b.section === section)
        if (items.length === 0) return null

        return (
          <section key={section}>
            <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">
              {SECTION_TITLE[section]}
            </h3>
            <ul className="overflow-hidden rounded-xl2 border border-line bg-surface">
              {items.map((block, i) => {
                const exercise = requireExercise(block.exerciseId)
                const perSide =
                  exercise.kind === 'repsPerSide' || exercise.kind === 'timePerSide'
                const target =
                  block.seconds != null
                    ? `${block.sets} × ${block.seconds}s`
                    : `${block.sets} × ${block.reps}`

                return (
                  <li
                    key={`${block.exerciseId}-${i}`}
                    className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0"
                  >
                    <ExerciseGlyph
                      glyph={exercise.glyph}
                      tone={section === 'main' ? 'accent' : 'muted'}
                      className="h-12 w-12"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{exercise.name}</p>
                      <p className="truncate text-xs text-faint">{exercise.summary}</p>
                    </div>
                    <span className="shrink-0 text-right text-sm font-semibold tabular text-muted">
                      {target}
                      {perSide ? (
                        <span className="block text-[10px] font-medium text-faint">each side</span>
                      ) : null}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
