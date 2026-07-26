import type { AchievementDefinition } from './types'

/**
 * A snapshot of everything the achievement rules can look at. Built once per
 * evaluation so each rule stays a cheap pure function.
 */
export interface AchievementStats {
  totalWorkouts: number
  totalMobilitySessions: number
  currentStreak: number
  longestStreak: number
  bestPushups: number
  bestPlankSeconds: number
  /** Consecutive logged days ending today with a recorded pain of 2 or less. */
  painFreeDays: number
  perfectHabitDays: number
  totalMinutes: number
  weightLostKg: number
  waistLostCm: number
  phase: number
  journeyDay: number
}

export interface AchievementRule extends AchievementDefinition {
  /** Whether the achievement is earned given the current stats. */
  test: (s: AchievementStats) => boolean
  /** Progress towards it, 0–1, for the locked state. */
  progress: (s: AchievementStats) => number
}

const ratio = (value: number, target: number) => Math.min(1, Math.max(0, value / target))

export const ACHIEVEMENTS: AchievementRule[] = [
  {
    id: 'first-workout',
    name: 'First Step',
    description: 'Finish your first workout.',
    tier: 'bronze',
    icon: 'flag',
    test: (s) => s.totalWorkouts >= 1,
    progress: (s) => ratio(s.totalWorkouts, 1),
  },
  {
    id: 'streak-7',
    name: 'Seven Days',
    description: 'Move for seven days in a row.',
    tier: 'bronze',
    icon: 'flame',
    test: (s) => s.longestStreak >= 7,
    progress: (s) => ratio(s.longestStreak, 7),
  },
  {
    id: 'streak-30',
    name: 'A Full Month',
    description: 'Thirty consecutive days of movement.',
    tier: 'silver',
    icon: 'flame',
    test: (s) => s.longestStreak >= 30,
    progress: (s) => ratio(s.longestStreak, 30),
  },
  {
    id: 'streak-100',
    name: 'Hundred Days Lit',
    description: 'A hundred days in a row. Remarkable.',
    tier: 'gold',
    icon: 'flame',
    test: (s) => s.longestStreak >= 100,
    progress: (s) => ratio(s.longestStreak, 100),
  },
  {
    id: 'workouts-10',
    name: 'Ten Sessions',
    description: 'Complete ten workouts.',
    tier: 'bronze',
    icon: 'dumbbell',
    test: (s) => s.totalWorkouts >= 10,
    progress: (s) => ratio(s.totalWorkouts, 10),
  },
  {
    id: 'workouts-50',
    name: 'Fifty Sessions',
    description: 'Complete fifty workouts.',
    tier: 'silver',
    icon: 'dumbbell',
    test: (s) => s.totalWorkouts >= 50,
    progress: (s) => ratio(s.totalWorkouts, 50),
  },
  {
    id: 'workouts-100',
    name: 'Century',
    description: 'Complete one hundred workouts.',
    tier: 'gold',
    icon: 'trophy',
    test: (s) => s.totalWorkouts >= 100,
    progress: (s) => ratio(s.totalWorkouts, 100),
  },
  {
    id: 'pushups-20',
    name: 'Twenty Push-Ups',
    description: 'Record a set of twenty push-ups.',
    tier: 'silver',
    icon: 'zap',
    test: (s) => s.bestPushups >= 20,
    progress: (s) => ratio(s.bestPushups, 20),
  },
  {
    id: 'plank-60',
    name: 'One Minute Plank',
    description: 'Hold a plank for sixty seconds.',
    tier: 'silver',
    icon: 'timer',
    test: (s) => s.bestPlankSeconds >= 60,
    progress: (s) => ratio(s.bestPlankSeconds, 60),
  },
  {
    id: 'plank-120',
    name: 'Two Minute Plank',
    description: 'Hold a plank for two full minutes.',
    tier: 'gold',
    icon: 'timer',
    test: (s) => s.bestPlankSeconds >= 120,
    progress: (s) => ratio(s.bestPlankSeconds, 120),
  },
  {
    id: 'pain-free-week',
    name: 'Pain-Free Week',
    description: 'Seven days logged with your back at 2 out of 10 or better.',
    tier: 'gold',
    icon: 'heart-pulse',
    test: (s) => s.painFreeDays >= 7,
    progress: (s) => ratio(s.painFreeDays, 7),
  },
  {
    id: 'mobility-30',
    name: 'Supple',
    description: 'Complete thirty mobility routines.',
    tier: 'silver',
    icon: 'wind',
    test: (s) => s.totalMobilitySessions >= 30,
    progress: (s) => ratio(s.totalMobilitySessions, 30),
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Tick every habit on seven separate days.',
    tier: 'silver',
    icon: 'check-check',
    test: (s) => s.perfectHabitDays >= 7,
    progress: (s) => ratio(s.perfectHabitDays, 7),
  },
  {
    id: 'hours-24',
    name: 'A Full Day',
    description: 'Twenty-four hours of training, all told.',
    tier: 'gold',
    icon: 'clock',
    test: (s) => s.totalMinutes >= 1440,
    progress: (s) => ratio(s.totalMinutes, 1440),
  },
  {
    id: 'phase-2',
    name: 'Loaded',
    description: 'Reach phase two of the journey.',
    tier: 'bronze',
    icon: 'mountain',
    test: (s) => s.phase >= 2,
    progress: (s) => ratio(s.journeyDay, 91),
  },
  {
    id: 'phase-3',
    name: 'Strong',
    description: 'Reach phase three of the journey.',
    tier: 'silver',
    icon: 'mountain',
    test: (s) => s.phase >= 3,
    progress: (s) => ratio(s.journeyDay, 181),
  },
  {
    id: 'phase-4',
    name: 'The Long Game',
    description: 'Reach the final phase of the year.',
    tier: 'gold',
    icon: 'mountain-snow',
    test: (s) => s.phase >= 4,
    progress: (s) => ratio(s.journeyDay, 271),
  },
  {
    id: 'waist-5',
    name: 'Five Centimetres',
    description: 'Lose five centimetres from your waist.',
    tier: 'gold',
    icon: 'ruler',
    test: (s) => s.waistLostCm >= 5,
    progress: (s) => ratio(s.waistLostCm, 5),
  },
]

export function getAchievement(id: string): AchievementRule | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
