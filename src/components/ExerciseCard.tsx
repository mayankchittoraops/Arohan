import type { ReactNode } from 'react'
import { ExerciseGlyph } from './ExerciseGlyph'
import { cn } from '@/lib/cn'
import type { Difficulty, Exercise, MuscleGroup } from '@/data/types'

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  fullBody: 'Full body',
  mobility: 'Mobility',
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  foundation: 'Foundation',
  developing: 'Developing',
  advanced: 'Advanced',
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  foundation: 'bg-mint/12 text-mint',
  developing: 'bg-sky/12 text-sky',
  advanced: 'bg-rose/12 text-rose',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-micro uppercase',
        DIFFICULTY_STYLES[difficulty],
      )}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}

/** Primary groups first and emphasised, then the assisting ones. */
export function MuscleTags({
  primary,
  secondary,
  className,
}: {
  primary: MuscleGroup[]
  secondary?: MuscleGroup[]
  className?: string
}) {
  const shown = primary.filter((m) => m !== 'mobility')
  const assisting = (secondary ?? []).filter((m) => m !== 'mobility')

  if (shown.length === 0 && assisting.length === 0) return null

  return (
    <p className={cn('text-caption text-faint', className)}>
      <span className="text-muted">{shown.map((m) => MUSCLE_LABELS[m]).join(' · ')}</span>
      {assisting.length > 0 ? (
        <span> + {assisting.map((m) => MUSCLE_LABELS[m]).join(', ')}</span>
      ) : null}
    </p>
  )
}

/**
 * The single presentation of an exercise, used everywhere one appears.
 *
 * `row` is the dense list form used in session plans and routines. `hero` is
 * the large form the session runner shows for the movement in progress.
 */
export function ExerciseCard({
  exercise,
  target,
  detail,
  variant = 'row',
  showMuscles = true,
  showDifficulty = false,
  onClick,
  children,
  className,
}: {
  exercise: Exercise
  /** e.g. "3 × 10" or "45s". */
  target?: string
  /** Small print under the target, e.g. "each side". */
  detail?: string
  variant?: 'row' | 'hero'
  showMuscles?: boolean
  showDifficulty?: boolean
  onClick?: () => void
  children?: ReactNode
  className?: string
}) {
  const hero = variant === 'hero'
  const Element = onClick ? 'button' : 'div'

  return (
    <Element
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'w-full text-left',
        hero
          ? 'rounded-xl3 border border-line bg-surface p-5 shadow-card'
          : 'flex items-center gap-3 px-3 py-3',
        onClick && 'transition-transform active:scale-[0.99]',
        className,
      )}
    >
      <div className={cn('flex gap-4', hero ? 'items-start' : 'w-full items-center')}>
        <ExerciseGlyph
          glyph={exercise.glyph}
          tone={hero ? 'accent' : 'muted'}
          className={hero ? 'h-24 w-24 shrink-0' : 'h-12 w-12'}
        />

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'truncate text-ink',
              hero ? 'text-title' : 'font-medium',
            )}
          >
            {exercise.name}
          </h3>
          <p className={cn('text-muted', hero ? 'mt-1 text-body' : 'truncate text-caption')}>
            {exercise.summary}
          </p>
          {showMuscles ? (
            <MuscleTags
              primary={exercise.primary}
              secondary={hero ? exercise.secondary : undefined}
              className={hero ? 'mt-2' : 'mt-0.5 truncate'}
            />
          ) : null}
        </div>

        {!hero && target ? (
          <span className="shrink-0 text-right text-label tabular text-muted">
            {target}
            {detail ? <span className="block text-micro text-faint">{detail}</span> : null}
          </span>
        ) : null}
      </div>

      {hero && (target || showDifficulty) ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {target ? (
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-label tabular font-semibold text-accent">
              {target}
              {detail ? ` ${detail}` : ''}
            </span>
          ) : null}
          {showDifficulty ? <DifficultyBadge difficulty={exercise.difficulty} /> : null}
        </div>
      ) : null}

      {children}
    </Element>
  )
}
