/** Content types: the exercise library and the twelve-month programme. */

export type Equipment = 'bodyweight' | 'mat' | 'band' | 'dumbbell' | 'pullupBar' | 'chair' | 'wall'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'fullBody'
  | 'mobility'

/** How a set is counted, which decides what the logger asks for. */
export type ExerciseKind = 'reps' | 'repsPerSide' | 'time' | 'timePerSide'

/**
 * How demanding a movement is, independent of the load on it. Used to sort the
 * library and to explain why a substitution happened.
 */
export type Difficulty = 'foundation' | 'developing' | 'advanced'

/** Illustration key — see `ExerciseGlyph`. */
export type GlyphKey =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push'
  | 'pull'
  | 'row'
  | 'press'
  | 'curl'
  | 'plank'
  | 'core'
  | 'bridge'
  | 'twist'
  | 'stretch'
  | 'catcow'
  | 'hip'
  | 'hamstring'
  | 'shoulder'
  | 'neck'
  | 'breathe'
  | 'balance'
  | 'walk'
  | 'calf'

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  equipment: Equipment[]
  /** What the movement is chiefly training. */
  primary: MuscleGroup[]
  /** What assists, and what will also feel it the next day. */
  secondary: MuscleGroup[]
  difficulty: Difficulty
  glyph: GlyphKey
  /** One line shown under the name — what this movement is for. */
  summary: string
  /** Ordered setup and execution steps. */
  instructions: string[]
  /** Short form reminders surfaced during the set. */
  cues: string[]
  /** Safe to perform, and generally helpful, with an irritable lower back. */
  backFriendly: boolean
  /** An easier variation to fall back on. Every movement has one. */
  regression: string
  /** A harder variation once the top of the rep range feels easy. */
  progression: string
  /** Loadable movements get a weight field in the logger. */
  loadable?: boolean
}

export type WorkoutKind = 'strength' | 'mobility' | 'core' | 'recovery' | 'rest'

export type Section = 'warmup' | 'main' | 'cooldown'

export interface PlannedExercise {
  exerciseId: string
  section: Section
  sets: number
  /** Target reps per set — present for rep-counted movements. */
  reps?: number
  /** Target seconds per set — present for timed movements. */
  seconds?: number
  restSeconds: number
  note?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  subtitle: string
  kind: WorkoutKind
  phase: PhaseNumber
  estimatedMinutes: number
  /** What the session is trying to move forward, in one sentence. */
  intent: string
  blocks: PlannedExercise[]
}

export type PhaseNumber = 1 | 2 | 3 | 4

export interface Phase {
  number: PhaseNumber
  name: string
  tagline: string
  startDay: number
  endDay: number
  /** Equipment the phase assumes you have by then. */
  equipment: Equipment[]
  focus: string[]
}

export type MobilitySectionId =
  | 'morning'
  | 'office'
  | 'evening'
  | 'lowerBack'
  | 'shoulders'
  | 'neck'
  | 'hips'
  | 'hamstrings'

export interface MobilityRoutine {
  id: MobilitySectionId
  name: string
  subtitle: string
  /** Why you would reach for this routine. */
  intent: string
  minutes: number
  accent: string
  glyph: GlyphKey
  moves: PlannedExercise[]
}

export interface HabitDefinition {
  id: string
  name: string
  detail: string
  icon: string
  accent: string
}

export type AchievementTier = 'bronze' | 'silver' | 'gold'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  tier: AchievementTier
  icon: string
}

export interface Quote {
  id: string
  text: string
  author: string
}
