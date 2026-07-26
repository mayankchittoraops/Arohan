import type { MobilityRoutine, MobilitySectionId, PlannedExercise, Section } from './types'

function step(exerciseId: string, target: { reps: number } | { seconds: number }): PlannedExercise {
  const section: Section = 'main'
  return {
    exerciseId,
    section,
    sets: 1,
    restSeconds: 10,
    ...('reps' in target ? { reps: target.reps } : { seconds: target.seconds }),
  }
}

/**
 * Short, self-contained routines you can reach for by symptom or by time of
 * day. Every one of them is safe to do daily.
 */
export const MOBILITY_ROUTINES: MobilityRoutine[] = [
  {
    id: 'morning',
    name: 'Morning',
    subtitle: 'Wake the body up',
    intent: 'Eight minutes to undo the night and start the day moving well.',
    minutes: 8,
    accent: 'amber',
    glyph: 'breathe',
    moves: [
      step('cat-cow', { reps: 10 }),
      step('prone-press-up', { reps: 8 }),
      step('glute-bridge', { reps: 12 }),
      step('worlds-greatest-stretch', { reps: 4 }),
      step('standing-side-bend', { seconds: 30 }),
      step('downward-dog', { seconds: 40 }),
    ],
  },
  {
    id: 'office',
    name: 'Office',
    subtitle: 'Between meetings',
    intent: 'Six minutes at your desk to reverse everything sitting does.',
    minutes: 6,
    accent: 'sky',
    glyph: 'neck',
    moves: [
      step('chin-tuck', { reps: 10 }),
      step('neck-side-bend', { seconds: 30 }),
      step('seated-twist', { seconds: 30 }),
      step('doorway-chest-stretch', { seconds: 30 }),
      step('standing-side-bend', { seconds: 25 }),
      step('hip-flexor-stretch', { seconds: 40 }),
    ],
  },
  {
    id: 'evening',
    name: 'Evening',
    subtitle: 'Wind down',
    intent: 'Twelve slow minutes to lower the volume before sleep.',
    minutes: 12,
    accent: 'violet',
    glyph: 'breathe',
    moves: [
      step('diaphragmatic-breathing', { seconds: 90 }),
      step('knee-to-chest', { seconds: 40 }),
      step('supine-twist', { seconds: 45 }),
      step('figure-four', { seconds: 45 }),
      step('childs-pose', { seconds: 60 }),
      step('legs-up-wall', { seconds: 150 }),
    ],
  },
  {
    id: 'lowerBack',
    name: 'Lower Back',
    subtitle: 'When it complains',
    intent: 'The routine to reach for on a bad back day — gentle, in this order.',
    minutes: 12,
    accent: 'rose',
    glyph: 'stretch',
    moves: [
      step('diaphragmatic-breathing', { seconds: 60 }),
      step('cat-cow', { reps: 10 }),
      step('prone-press-up', { reps: 10 }),
      step('knee-to-chest', { seconds: 40 }),
      step('bird-dog', { reps: 8 }),
      step('glute-bridge', { reps: 12 }),
      step('supine-twist', { seconds: 45 }),
      step('childs-pose', { seconds: 60 }),
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    subtitle: 'Open the front, wake the back',
    intent: 'For shoulders that have been rounded forward all day.',
    minutes: 8,
    accent: 'indigo',
    glyph: 'shoulder',
    moves: [
      step('shoulder-circles', { reps: 12 }),
      step('band-dislocate', { reps: 10 }),
      step('wall-angel', { reps: 10 }),
      step('doorway-chest-stretch', { seconds: 40 }),
      step('thread-the-needle', { seconds: 40 }),
    ],
  },
  {
    id: 'neck',
    name: 'Neck',
    subtitle: 'Screen recovery',
    intent: 'Six minutes for the tension that gathers at the base of the skull.',
    minutes: 6,
    accent: 'teal',
    glyph: 'neck',
    moves: [
      step('chin-tuck', { reps: 12 }),
      step('neck-side-bend', { seconds: 40 }),
      step('levator-stretch', { seconds: 40 }),
      step('seated-twist', { seconds: 30 }),
    ],
  },
  {
    id: 'hips',
    name: 'Hips',
    subtitle: 'Open and stable',
    intent: 'Tight hips make the lower back do their job. This gives it back.',
    minutes: 10,
    accent: 'mint',
    glyph: 'hip',
    moves: [
      step('ninety-ninety', { reps: 8 }),
      step('hip-flexor-stretch', { seconds: 45 }),
      step('figure-four', { seconds: 45 }),
      step('pigeon-stretch', { seconds: 60 }),
      step('clamshell', { reps: 12 }),
    ],
  },
  {
    id: 'hamstrings',
    name: 'Hamstrings',
    subtitle: 'The whole back line',
    intent: 'Lengthen the hamstrings without ever rounding the lower back.',
    minutes: 9,
    accent: 'amber',
    glyph: 'hamstring',
    moves: [
      step('forward-fold', { seconds: 45 }),
      step('hamstring-hinge-stretch', { seconds: 40 }),
      step('supine-hamstring-stretch', { seconds: 45 }),
      step('downward-dog', { seconds: 40 }),
      step('calf-stretch', { seconds: 35 }),
    ],
  },
]

const byId = new Map(MOBILITY_ROUTINES.map((r) => [r.id, r]))

export function getRoutine(id: MobilitySectionId | string): MobilityRoutine | undefined {
  return byId.get(id as MobilitySectionId)
}
