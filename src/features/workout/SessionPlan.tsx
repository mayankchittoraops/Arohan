import { requireExercise } from '@/data/exercises'
import type { PlannedExercise, Section } from '@/data/types'
import { ExerciseCard } from '@/components/ExerciseCard'

const SECTION_TITLE: Record<Section, string> = {
  warmup: 'Warm-up',
  main: 'Main work',
  cooldown: 'Cool-down',
}

const ORDER: Section[] = ['warmup', 'main', 'cooldown']

/**
 * The read-only list of everything a session contains, grouped by section.
 *
 * Rendered with the shared ExerciseCard, so every movement shows its duration
 * or rep target and the muscles it works — whether it appears in a workout
 * plan or a mobility routine.
 */
export function SessionPlan({ blocks }: { blocks: PlannedExercise[] }) {
  return (
    <div className="space-y-section">
      {ORDER.map((section) => {
        const items = blocks.filter((b) => b.section === section)
        if (items.length === 0) return null

        return (
          <section key={section}>
            <h3 className="mb-2 px-1 text-micro uppercase text-faint">
              {SECTION_TITLE[section]}
            </h3>
            <ul className="overflow-hidden rounded-xl2 border border-line bg-surface">
              {items.map((block, i) => {
                const exercise = requireExercise(block.exerciseId)
                const perSide = exercise.kind === 'repsPerSide' || exercise.kind === 'timePerSide'
                const target =
                  block.seconds != null
                    ? block.sets > 1
                      ? `${block.sets} × ${block.seconds}s`
                      : `${block.seconds}s`
                    : `${block.sets} × ${block.reps}`

                return (
                  <li
                    key={`${block.exerciseId}-${i}`}
                    className="border-b border-line last:border-0"
                  >
                    <ExerciseCard
                      exercise={exercise}
                      target={target}
                      detail={perSide ? 'each side' : undefined}
                    />
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
