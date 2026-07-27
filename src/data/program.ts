import { getExercise } from './exercises'
import type {
  Equipment,
  Phase,
  PhaseNumber,
  PlannedExercise,
  Section,
  WorkoutTemplate,
} from './types'
import { clamp } from '@/lib/format'
import { daysBetween, weekdayIndex, type DateKey } from '@/lib/date'

/* --------------------------------------------------------------- phases */

export const PHASES: Phase[] = [
  {
    number: 1,
    name: 'Foundation',
    tagline: 'Learn the patterns, calm the back.',
    startDay: 1,
    endDay: 90,
    equipment: ['bodyweight', 'mat', 'band', 'wall', 'chair'],
    focus: ['Hip hinge and bracing', 'Daily mobility', 'Consistency over intensity'],
  },
  {
    number: 2,
    name: 'Load',
    tagline: 'Add weight to the patterns you now own.',
    startDay: 91,
    endDay: 180,
    equipment: ['dumbbell'],
    focus: ['Dumbbell strength', 'Upper / lower split', 'Progressive overload'],
  },
  {
    number: 3,
    name: 'Strength',
    tagline: 'Harder variations, heavier days.',
    startDay: 181,
    endDay: 270,
    equipment: ['dumbbell', 'pullupBar'],
    focus: ['Push / pull / legs', 'Single-leg strength', 'First pull-up'],
  },
  {
    number: 4,
    name: 'Sustain',
    tagline: 'Hold what you built and enjoy it.',
    startDay: 271,
    endDay: 365,
    equipment: ['dumbbell', 'pullupBar'],
    focus: ['Full-body maintenance', 'Mobility as default', 'Year in review'],
  },
]

export function phaseFor(number: PhaseNumber): Phase {
  return PHASES.find((p) => p.number === number) ?? PHASES[0]
}

/** The phase the calendar says you have reached, ignoring what is unlocked. */
export function phaseForDay(day: number): PhaseNumber {
  const match = PHASES.find((p) => day >= p.startDay && day <= p.endDay)
  return match?.number ?? 4
}

/* ---------------------------------------------------------- equipment */

/** Always available: you have a body, a mat, a wall and a chair. */
export const BASE_EQUIPMENT: Equipment[] = ['bodyweight', 'mat', 'wall', 'chair']

/** Toggleable in Settings. */
export const OPTIONAL_EQUIPMENT: Equipment[] = ['band', 'dumbbell', 'pullupBar']

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Bodyweight',
  mat: 'Yoga mat',
  wall: 'Wall',
  chair: 'Sturdy chair',
  band: 'Resistance bands',
  dumbbell: 'Adjustable dumbbells',
  pullupBar: 'Pull-up bar',
}

/** What to reach for when the prescribed movement needs kit you do not own. */
const FALLBACKS: Record<string, string> = {
  'band-row': 'prone-ytw',
  'band-bent-row': 'prone-ytw',
  'band-lat-pulldown': 'prone-ytw',
  'band-face-pull': 'prone-ytw',
  'band-reverse-fly': 'prone-ytw',
  'band-pull-apart': 'prone-ytw',
  'band-rdl': 'single-leg-rdl',
  'band-chest-press': 'push-up',
  'band-overhead-press': 'pike-push-up',
  'band-triceps-extension': 'chair-dip',
  'band-dislocate': 'wall-angel',
  'pallof-press': 'side-plank',
  'lateral-band-walk': 'clamshell',
  'goblet-squat': 'bodyweight-squat',
  'db-rdl': 'band-rdl',
  'db-lunge': 'reverse-lunge',
  'db-shoulder-press': 'pike-push-up',
  'db-floor-press': 'band-chest-press',
  'db-row': 'band-row',
  'db-curl': 'band-curl',
  'db-lateral-raise': 'band-reverse-fly',
  'db-overhead-extension': 'chair-dip',
  'renegade-row': 'plank-shoulder-tap',
  'weighted-plank': 'front-plank',
  'bulgarian-split-squat': 'split-squat',
  'pull-up': 'negative-pull-up',
  'negative-pull-up': 'band-lat-pulldown',
}

export function ownsEquipment(owned: Equipment[], required: Equipment[]): boolean {
  return required.every((item) => BASE_EQUIPMENT.includes(item) || owned.includes(item))
}

/**
 * Swaps a planned movement for one you can actually do. Follows the fallback
 * chain (dumbbell → band → bodyweight) and gives up rather than looping.
 */
function substitute(planned: PlannedExercise, owned: Equipment[]): PlannedExercise | null {
  let id: string | undefined = planned.exerciseId
  const seen = new Set<string>()

  while (id && !seen.has(id)) {
    seen.add(id)
    const exercise = getExercise(id)
    if (!exercise) return null
    if (ownsEquipment(owned, exercise.equipment)) {
      return id === planned.exerciseId ? planned : { ...planned, exerciseId: id }
    }
    id = FALLBACKS[id]
  }

  return null
}

/* ------------------------------------------------------- progression */

export interface Progression {
  /** 0-based week inside the current phase, capped at the phase length. */
  week: number
  /** 0-based four-week block. Each block raises the baseline. */
  block: number
  deload: boolean
  setDelta: number
  repDelta: number
  secondDelta: number
}

/**
 * Three weeks of building, then an easier fourth. Volume climbs inside each
 * block and the baseline steps up when a new block starts.
 */
export function progressionFor(weekInPhase: number): Progression {
  const week = clamp(Math.floor(weekInPhase), 0, 12)
  const block = Math.floor(week / 4)
  const step = week % 4

  if (step === 3) {
    return { week, block, deload: true, setDelta: 0, repDelta: 0, secondDelta: 0 }
  }

  return {
    week,
    block,
    deload: false,
    setDelta: block >= 2 ? 1 : 0,
    repDelta: step * 2 + block * 2,
    secondDelta: step * 5 + block * 5,
  }
}

function applyProgression(block: PlannedExercise, p: Progression): PlannedExercise {
  if (block.section !== 'main') return block

  const next: PlannedExercise = { ...block }
  next.sets = clamp(block.sets + p.setDelta, 1, 6)
  if (block.reps != null) next.reps = clamp(block.reps + p.repDelta, 1, 40)
  if (block.seconds != null) next.seconds = clamp(block.seconds + p.secondDelta, 10, 180)
  if (p.deload) next.sets = Math.max(1, block.sets - 1)
  return next
}

/* -------------------------------------------------------- templates */

type Target = { reps: number } | { seconds: number }

function move(
  exerciseId: string,
  sets: number,
  target: Target,
  restSeconds: number,
  section: Section = 'main',
  note?: string,
): PlannedExercise {
  return {
    exerciseId,
    section,
    sets,
    restSeconds,
    note,
    ...('reps' in target ? { reps: target.reps } : { seconds: target.seconds }),
  }
}

const warm = (exerciseId: string, sets: number, target: Target, note?: string) =>
  move(exerciseId, sets, target, 15, 'warmup', note)

const cool = (exerciseId: string, target: Target, note?: string) =>
  move(exerciseId, 1, target, 10, 'cooldown', note)

const TEMPLATES: WorkoutTemplate[] = [
  /* ------------------------------------------------------- phase one */
  {
    id: 'p1-a',
    name: 'Foundation A',
    subtitle: 'Push & legs',
    kind: 'strength',
    phase: 1,
    estimatedMinutes: 35,
    intent: 'Build the squat and the push, and finish with a braced trunk.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('glute-bridge', 1, { reps: 10 }),
      warm('band-pull-apart', 1, { reps: 12 }),
      warm('ankle-rocks', 1, { reps: 8 }),
      move('bodyweight-squat', 3, { reps: 10 }, 60),
      move('incline-push-up', 3, { reps: 8 }, 60, 'main', 'Lower the surface as this gets easy.'),
      move('reverse-lunge', 3, { reps: 8 }, 60),
      move('band-overhead-press', 3, { reps: 10 }, 45),
      move('front-plank', 3, { seconds: 25 }, 45),
      cool('hip-flexor-stretch', { seconds: 30 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },
  {
    id: 'p1-b',
    name: 'Foundation B',
    subtitle: 'Pull & hinge',
    kind: 'strength',
    phase: 1,
    estimatedMinutes: 35,
    intent: 'Own the hip hinge — the pattern that protects your lower back.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('bird-dog', 1, { reps: 6 }),
      warm('shoulder-circles', 1, { reps: 10 }),
      warm('standing-march', 1, { reps: 10 }),
      move('band-rdl', 3, { reps: 10 }, 60, 'main', 'Flat back. Hinge, never round.'),
      move('band-row', 3, { reps: 12 }, 60),
      move('glute-bridge', 3, { reps: 12 }, 45),
      move('band-lat-pulldown', 3, { reps: 10 }, 45),
      move('band-face-pull', 2, { reps: 15 }, 40),
      move('side-plank', 2, { seconds: 20 }, 40),
      cool('supine-hamstring-stretch', { seconds: 30 }),
      cool('figure-four', { seconds: 30 }),
    ],
  },
  {
    id: 'p1-c',
    name: 'Foundation C',
    subtitle: 'Full body',
    kind: 'strength',
    phase: 1,
    estimatedMinutes: 40,
    intent: 'Touch every pattern once, and finish the week strong.',
    blocks: [
      warm('standing-march', 1, { reps: 10 }),
      warm('cat-cow', 1, { reps: 8 }),
      warm('band-pull-apart', 1, { reps: 12 }),
      move('split-squat', 3, { reps: 8 }, 60),
      move('knee-push-up', 3, { reps: 8 }, 60),
      move('band-bent-row', 3, { reps: 12 }, 60),
      move('calf-raise', 3, { reps: 15 }, 40),
      move('band-curl', 2, { reps: 12 }, 40),
      move('band-triceps-extension', 2, { reps: 12 }, 40),
      move('dead-bug', 2, { reps: 8 }, 40),
      cool('forward-fold', { seconds: 40 }),
      cool('doorway-chest-stretch', { seconds: 30 }),
    ],
  },

  /* ------------------------------------------------------- phase two */
  {
    id: 'p2-lower',
    name: 'Lower Body',
    subtitle: 'Squat & hinge, loaded',
    kind: 'strength',
    phase: 2,
    estimatedMinutes: 40,
    intent: 'Put real load on the legs now that the patterns are solid.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('glute-bridge', 1, { reps: 12 }),
      warm('lateral-band-walk', 1, { reps: 10 }),
      warm('ankle-rocks', 1, { reps: 8 }),
      move('goblet-squat', 4, { reps: 10 }, 75),
      move('db-rdl', 4, { reps: 10 }, 75),
      move('db-lunge', 3, { reps: 10 }, 60),
      move('calf-raise', 3, { reps: 15 }, 40),
      move('side-plank', 3, { seconds: 25 }, 45),
      cool('figure-four', { seconds: 30 }),
      cool('hip-flexor-stretch', { seconds: 30 }),
    ],
  },
  {
    id: 'p2-upper',
    name: 'Upper Body',
    subtitle: 'Press & row',
    kind: 'strength',
    phase: 2,
    estimatedMinutes: 40,
    intent: 'Balance every press with a pull. Your shoulders will thank you.',
    blocks: [
      warm('shoulder-circles', 1, { reps: 10 }),
      warm('band-pull-apart', 1, { reps: 15 }),
      warm('wall-angel', 1, { reps: 8 }),
      move('db-floor-press', 4, { reps: 10 }, 75),
      move('db-row', 4, { reps: 10 }, 75),
      move('db-shoulder-press', 3, { reps: 10 }, 60),
      move('band-face-pull', 3, { reps: 15 }, 45),
      move('db-curl', 3, { reps: 12 }, 45),
      move('db-overhead-extension', 3, { reps: 12 }, 45),
      cool('doorway-chest-stretch', { seconds: 30 }),
      cool('thread-the-needle', { seconds: 30 }),
    ],
  },
  {
    id: 'p2-full',
    name: 'Full Body',
    subtitle: 'Everything, moderately',
    kind: 'strength',
    phase: 2,
    estimatedMinutes: 40,
    intent: 'A complete session that leaves something in the tank for the weekend.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('standing-march', 1, { reps: 10 }),
      warm('band-pull-apart', 1, { reps: 12 }),
      move('goblet-squat', 3, { reps: 12 }, 60),
      move('push-up', 3, { reps: 10 }, 60),
      move('db-rdl', 3, { reps: 12 }, 60),
      move('band-row', 3, { reps: 12 }, 60),
      move('farmer-carry', 3, { seconds: 40 }, 45),
      move('pallof-press', 2, { reps: 10 }, 40),
      cool('forward-fold', { seconds: 40 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },

  /* ----------------------------------------------------- phase three */
  {
    id: 'p3-push',
    name: 'Push',
    subtitle: 'Chest, shoulders, triceps',
    kind: 'strength',
    phase: 3,
    estimatedMinutes: 45,
    intent: 'Harder push variations, and volume where it counts.',
    blocks: [
      warm('shoulder-circles', 1, { reps: 10 }),
      warm('band-pull-apart', 1, { reps: 15 }),
      warm('wall-angel', 1, { reps: 10 }),
      move('decline-push-up', 4, { reps: 10 }, 75),
      move('db-shoulder-press', 4, { reps: 8 }, 75),
      move('archer-push-up', 3, { reps: 6 }, 60),
      move('pike-push-up', 3, { reps: 8 }, 60),
      move('db-lateral-raise', 3, { reps: 15 }, 45),
      move('chair-dip', 3, { reps: 12 }, 45),
      cool('doorway-chest-stretch', { seconds: 30 }),
      cool('band-dislocate', { reps: 10 }),
    ],
  },
  {
    id: 'p3-pull',
    name: 'Pull',
    subtitle: 'Back and biceps',
    kind: 'strength',
    phase: 3,
    estimatedMinutes: 45,
    intent: 'Everything here builds towards a clean, full-range pull-up.',
    blocks: [
      warm('band-pull-apart', 1, { reps: 15 }),
      warm('prone-ytw', 1, { reps: 6 }),
      warm('dead-hang', 1, { seconds: 20 }),
      move('negative-pull-up', 4, { reps: 5 }, 90, 'main', 'Five seconds down, every rep.'),
      move('db-row', 4, { reps: 10 }, 75),
      move('band-lat-pulldown', 3, { reps: 12 }, 60),
      move('band-face-pull', 3, { reps: 15 }, 45),
      move('db-curl', 3, { reps: 12 }, 45),
      move('dead-hang', 3, { seconds: 30 }, 60),
      cool('thread-the-needle', { seconds: 30 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },
  {
    id: 'p3-legs',
    name: 'Legs',
    subtitle: 'Single leg and posterior chain',
    kind: 'strength',
    phase: 3,
    estimatedMinutes: 45,
    intent: 'Single-leg strength is what keeps the hips and back honest.',
    blocks: [
      warm('glute-bridge', 1, { reps: 12 }),
      warm('lateral-band-walk', 1, { reps: 10 }),
      warm('ninety-ninety', 1, { reps: 6 }),
      move('bulgarian-split-squat', 4, { reps: 8 }, 75),
      move('db-rdl', 4, { reps: 10 }, 75),
      move('goblet-squat', 3, { reps: 12 }, 60),
      move('single-leg-rdl', 3, { reps: 8 }, 60),
      move('calf-raise', 4, { reps: 15 }, 40),
      move('wall-sit', 2, { seconds: 45 }, 45),
      cool('pigeon-stretch', { seconds: 40 }),
      cool('supine-hamstring-stretch', { seconds: 30 }),
    ],
  },

  /* ------------------------------------------------------ phase four */
  {
    id: 'p4-a',
    name: 'Sustain A',
    subtitle: 'Push emphasis',
    kind: 'strength',
    phase: 4,
    estimatedMinutes: 35,
    intent: 'Keep the strength you built without living in the workout.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('band-pull-apart', 1, { reps: 15 }),
      move('push-up', 3, { reps: 12 }, 60),
      move('db-shoulder-press', 3, { reps: 10 }, 60),
      move('goblet-squat', 3, { reps: 12 }, 60),
      move('db-row', 3, { reps: 10 }, 60),
      move('front-plank', 3, { seconds: 45 }, 45),
      cool('forward-fold', { seconds: 40 }),
      cool('doorway-chest-stretch', { seconds: 30 }),
    ],
  },
  {
    id: 'p4-b',
    name: 'Sustain B',
    subtitle: 'Pull emphasis',
    kind: 'strength',
    phase: 4,
    estimatedMinutes: 35,
    intent: 'Hold on to the pulling strength — it fades fastest.',
    blocks: [
      warm('shoulder-circles', 1, { reps: 10 }),
      warm('prone-ytw', 1, { reps: 6 }),
      move('pull-up', 3, { reps: 5 }, 90),
      move('db-row', 3, { reps: 12 }, 60),
      move('db-rdl', 3, { reps: 12 }, 60),
      move('band-face-pull', 3, { reps: 15 }, 45),
      move('side-plank', 3, { seconds: 30 }, 45),
      cool('thread-the-needle', { seconds: 30 }),
      cool('figure-four', { seconds: 30 }),
    ],
  },
  {
    id: 'p4-c',
    name: 'Sustain C',
    subtitle: 'Legs and trunk',
    kind: 'strength',
    phase: 4,
    estimatedMinutes: 35,
    intent: 'Legs, glutes and a trunk that holds everything together.',
    blocks: [
      warm('glute-bridge', 1, { reps: 12 }),
      warm('ankle-rocks', 1, { reps: 8 }),
      move('bulgarian-split-squat', 3, { reps: 10 }, 75),
      move('db-rdl', 3, { reps: 12 }, 60),
      move('calf-raise', 3, { reps: 15 }, 40),
      move('pallof-press', 3, { reps: 12 }, 45),
      move('farmer-carry', 3, { seconds: 45 }, 45),
      cool('pigeon-stretch', { seconds: 40 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },

  /* ------------------------------------------------------ core & rest */
  {
    id: 'core-foundation',
    name: 'Core & Lower Back',
    subtitle: 'The big three, plus friends',
    kind: 'core',
    phase: 1,
    estimatedMinutes: 25,
    intent: 'Build a trunk that resists movement, which is what a sore back needs.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('glute-bridge', 1, { reps: 10 }),
      move('curl-up', 3, { seconds: 10 }, 30, 'main', 'Swap the bent knee each side.'),
      move('side-plank', 3, { seconds: 20 }, 40),
      move('bird-dog', 3, { reps: 8 }, 40),
      move('pallof-press', 2, { reps: 10 }, 40),
      move('leg-lowering', 2, { reps: 8 }, 40),
      cool('knee-to-chest', { seconds: 30 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },
  {
    id: 'core-advanced',
    name: 'Core & Carry',
    subtitle: 'Loaded trunk work',
    kind: 'core',
    phase: 3,
    estimatedMinutes: 30,
    intent: 'Add load to the trunk rather than adding minutes to the plank.',
    blocks: [
      warm('cat-cow', 1, { reps: 8 }),
      warm('dead-bug', 1, { reps: 8 }),
      move('weighted-plank', 3, { seconds: 30 }, 45),
      move('renegade-row', 3, { reps: 8 }, 60),
      move('pallof-press', 3, { reps: 12 }, 45),
      move('hollow-hold', 3, { seconds: 25 }, 45),
      move('farmer-carry', 3, { seconds: 45 }, 60),
      cool('supine-twist', { seconds: 40 }),
      cool('childs-pose', { seconds: 45 }),
    ],
  },
  {
    id: 'recovery-flow',
    name: 'Recovery Flow',
    subtitle: 'Move everything, gently',
    kind: 'recovery',
    phase: 1,
    estimatedMinutes: 20,
    intent: 'Blood to the tissue, range to the joints, calm to the system.',
    blocks: [
      warm('diaphragmatic-breathing', 1, { seconds: 60 }),
      move('cat-cow', 1, { reps: 10 }, 15),
      move('thoracic-rotation', 1, { reps: 8 }, 15),
      move('worlds-greatest-stretch', 1, { reps: 4 }, 20),
      move('hip-flexor-stretch', 1, { seconds: 40 }, 15),
      move('figure-four', 1, { seconds: 40 }, 15),
      move('supine-hamstring-stretch', 1, { seconds: 40 }, 15),
      move('downward-dog', 1, { seconds: 40 }, 15),
      cool('legs-up-wall', { seconds: 120 }),
    ],
  },
  {
    id: 'rest',
    name: 'Rest Day',
    subtitle: 'Recovery is part of the plan',
    kind: 'rest',
    phase: 1,
    estimatedMinutes: 0,
    intent: 'Walk, sleep well, and let the work from this week land.',
    blocks: [],
  },
]

const templatesById = new Map(TEMPLATES.map((t) => [t.id, t]))

export function getTemplate(id: string): WorkoutTemplate | undefined {
  return templatesById.get(id)
}

export const ALL_TEMPLATES = TEMPLATES

/* --------------------------------------------------------- scheduling */

/** Monday-first weekly plan per phase. */
const SCHEDULES: Record<PhaseNumber, string[]> = {
  1: ['p1-a', 'recovery-flow', 'p1-b', 'core-foundation', 'p1-c', 'recovery-flow', 'rest'],
  2: ['p2-lower', 'recovery-flow', 'p2-upper', 'core-foundation', 'p2-full', 'recovery-flow', 'rest'],
  3: ['p3-push', 'recovery-flow', 'p3-pull', 'core-advanced', 'p3-legs', 'recovery-flow', 'rest'],
  4: ['p4-a', 'recovery-flow', 'p4-b', 'core-advanced', 'p4-c', 'recovery-flow', 'rest'],
}

export function templateIdFor(date: DateKey, phase: PhaseNumber): string {
  return SCHEDULES[phase][weekdayIndex(date)]
}

/** 1-based day of the twelve-month journey. */
export function journeyDay(startDate: DateKey, date: DateKey): number {
  return daysBetween(startDate, date) + 1
}

export interface ResolvedSession {
  template: WorkoutTemplate
  /** Progression-adjusted, equipment-substituted blocks. */
  blocks: PlannedExercise[]
  progression: Progression
  journeyDay: number
  phase: Phase
  /** Movements dropped because the kit for them is missing. */
  dropped: string[]
}

/**
 * Resolves the session for a date: picks the template from the weekly plan,
 * applies this week's progression, and swaps anything you cannot equip.
 */
export function resolveSession(
  date: DateKey,
  options: { startDate: DateKey; phase: PhaseNumber; equipment: Equipment[]; templateId?: string },
): ResolvedSession {
  const phase = phaseFor(options.phase)
  const day = journeyDay(options.startDate, date)
  const templateId = options.templateId ?? templateIdFor(date, options.phase)
  const template = getTemplate(templateId) ?? getTemplate('rest')!

  const weekInPhase = Math.floor(Math.max(0, day - phase.startDay) / 7)
  const progression = progressionFor(weekInPhase)

  const dropped: string[] = []
  const blocks: PlannedExercise[] = []
  const included = new Set<string>()

  for (const planned of template.blocks) {
    const resolved = substitute(planned, options.equipment)
    const original = getExercise(planned.exerciseId)

    // Several band movements share a bodyweight fallback. Without this, a
    // session with no bands would prescribe the same substitute three times.
    const isDuplicateSubstitute =
      resolved != null &&
      resolved.exerciseId !== planned.exerciseId &&
      included.has(resolved.exerciseId)

    if (!resolved || isDuplicateSubstitute) {
      if (original) dropped.push(original.name)
      continue
    }

    included.add(resolved.exerciseId)
    blocks.push(applyProgression(resolved, progression))
  }

  return { template, blocks, progression, journeyDay: day, phase, dropped }
}

/**
 * Applies equipment substitution to a standalone list of moves.
 *
 * Mobility routines used to be handed to the session runner untouched, so a
 * user without bands was shown the band pass-through in the Shoulders routine
 * with no way to do it. They now resolve through the same chain as workouts,
 * minus the progression — a stretch is not something you overload.
 */
export function resolveMoves(moves: PlannedExercise[], equipment: Equipment[]): PlannedExercise[] {
  const included = new Set<string>()
  const out: PlannedExercise[] = []

  for (const planned of moves) {
    const resolved = substitute(planned, equipment)
    if (!resolved || included.has(resolved.exerciseId)) continue
    included.add(resolved.exerciseId)
    out.push(resolved)
  }

  return out
}

/** Total planned sets in the working portion of a session. */
export function mainSetCount(blocks: PlannedExercise[]): number {
  return blocks.reduce((total, b) => total + (b.section === 'main' ? b.sets : 0), 0)
}

/** Rough duration: work time plus rest, warm-up and cool-down included. */
export function estimateSeconds(blocks: PlannedExercise[]): number {
  return blocks.reduce((total, b) => {
    const perSet = b.seconds != null ? b.seconds : (b.reps ?? 10) * 3.5
    const sides = b.exerciseId && isPerSide(b) ? 2 : 1
    return total + b.sets * (perSet * sides + b.restSeconds)
  }, 0)
}

function isPerSide(block: PlannedExercise): boolean {
  const kind = getExercise(block.exerciseId)?.kind
  return kind === 'repsPerSide' || kind === 'timePerSide'
}
