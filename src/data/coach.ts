import type { MobilitySectionId, WorkoutKind } from './types'

/**
 * The coaching engine.
 *
 * Deterministic rules over what the user has already told us — no model, no
 * randomness, no network. The same inputs always produce the same advice,
 * which matters: advice that changes on refresh is not advice.
 *
 * Two principles hold throughout:
 *   1. Never guilt. A missed week is met with a way back in, not a scolding.
 *   2. Pain outranks the plan. The programme exists to calm a back, so a bad
 *      back day always wins over what the calendar says.
 *
 * Pure: no React, no storage, no clock.
 */

/** What today is really for, shown as Today's Focus. */
export type Focus = 'Workout' | 'Mobility' | 'Recovery' | 'Rest'

/**
 * How to approach the scheduled session.
 * - `go`    — as planned
 * - `ease`  — do it, but lighter
 * - `swap`  — leave the session, do mobility instead
 * - `rest`  — nothing scheduled
 * - `done`  — already trained today
 */
export type Verdict = 'go' | 'ease' | 'swap' | 'rest' | 'done'

export interface CoachInput {
  /** Today's scheduled session kind, from the programme. */
  scheduledKind: WorkoutKind | 'mobility'
  /** Whether a session has already been completed today. */
  trainedToday: boolean
  /** Today's check-in. Any of these may be unlogged. */
  sleepHours: number | null
  energy: number | null
  pain: number | null
  /** Whole days since the last completed session; null if there never was one. */
  daysSinceLastSession: number | null
  /** Perceived effort of the last session, 1–10. */
  lastRpe: number | null
  /** Current movement streak in days. */
  streak: number
  /** 1-based day of the twelve-month journey. */
  journeyDay: number
}

export interface CoachAdvice {
  focus: Focus
  verdict: Verdict
  /** One line naming what today is for. */
  headline: string
  /** What to actually do, and why. */
  detail: string
  /** A concrete recovery action, always present. */
  recovery: string
  /** Warm, never guilt-tripping. */
  encouragement: string
  /** Set when the advice is to do a specific routine instead. */
  suggestedRoutine?: MobilitySectionId
}

/* ----------------------------------------------------------------- limits */

/** Above this, the back leads the decision rather than the calendar. */
const PAIN_STOP = 6
/** Above this, train but take something off the top. */
const PAIN_EASE = 4
/** Below this, the body is not recovered enough for a hard session. */
const SLEEP_LOW = 6
/** 1–5 scale; at or below this, treat energy as depleted. */
const ENERGY_LOW = 2
/** At or above this, the last session was genuinely hard. */
const RPE_HARD = 9
/** Days away after which the plan should be re-entered gently. */
const LAYOFF_DAYS = 4

const isTraining = (kind: WorkoutKind | 'mobility') => kind === 'strength' || kind === 'core'

/* ------------------------------------------------------------- messaging */

/**
 * Encouragement is chosen from the streak band, then varied by the day number
 * so it changes over time without being random.
 */
function encouragementFor(streak: number, journeyDay: number, trainedToday: boolean): string {
  const pools: string[][] = trainedToday
    ? [
        [
          'That is today taken care of.',
          'Logged. The rest of the day is yours.',
          'Done is done — nicely handled.',
        ],
      ]
    : streak >= 30
      ? [
          [
            `${streak} days. This is simply what you do now.`,
            'A month of showing up. That is the whole trick.',
            'The habit is carrying you at this point.',
          ],
        ]
      : streak >= 7
        ? [
            [
              `${streak} days running. Momentum is on your side.`,
              'A full week of moving. Keep it unhurried.',
              'You have found the rhythm — protect it.',
            ],
          ]
        : streak >= 1
          ? [
              [
                'Back-to-back days. That is how it builds.',
                'Two in a row beats one perfect session.',
                'Small and repeated wins every time.',
              ],
            ]
          : [
              [
                'Today is a good day to start again.',
                'No catching up needed. Just today.',
                'The streak resets. The strength does not.',
              ],
            ]

  const pool = pools[0]
  return pool[journeyDay % pool.length]
}

/* ------------------------------------------------------------------ rules */

/**
 * Rules are ordered and the first match wins, so the output is easy to reason
 * about: read down the list and stop.
 */
export function coach(input: CoachInput): CoachAdvice {
  const {
    scheduledKind,
    trainedToday,
    sleepHours,
    energy,
    pain,
    daysSinceLastSession,
    lastRpe,
    streak,
    journeyDay,
  } = input

  const encouragement = encouragementFor(streak, journeyDay, trainedToday)
  const tiredSleep = sleepHours != null && sleepHours < SLEEP_LOW
  const tiredEnergy = energy != null && energy <= ENERGY_LOW
  const soreYesterday = lastRpe != null && lastRpe >= RPE_HARD && (daysSinceLastSession ?? 99) <= 1

  // 1. Already trained. Nothing to recommend but recovery.
  if (trainedToday) {
    return {
      focus: 'Recovery',
      verdict: 'done',
      headline: "Today's session is done",
      detail: 'Anything more today is optional. A walk or a short routine is plenty.',
      recovery:
        pain != null && pain >= PAIN_EASE
          ? 'Ten minutes on the Lower Back routine before bed will help it settle.'
          : 'Evening mobility and an early night is the best use of the next hour.',
      encouragement,
      suggestedRoutine: pain != null && pain >= PAIN_EASE ? 'lowerBack' : 'evening',
    }
  }

  // 2. The back overrides the plan.
  if (pain != null && pain >= PAIN_STOP) {
    return {
      focus: 'Recovery',
      verdict: 'swap',
      headline: 'Your back needs today',
      detail:
        'Skip the session. The Lower Back routine is built for exactly this — gentle, in order, and safe to repeat twice.',
      recovery: 'Move little and often. Short walks beat sitting still.',
      encouragement: 'Backing off today is what keeps next week intact.',
      suggestedRoutine: 'lowerBack',
    }
  }

  // 3. Nothing scheduled.
  if (scheduledKind === 'rest') {
    return {
      focus: 'Rest',
      verdict: 'rest',
      headline: 'Rest day',
      detail: 'Nothing is scheduled. Recovery is when the work from this week actually lands.',
      recovery: 'A twenty-minute walk and some evening mobility is the whole job.',
      encouragement,
      suggestedRoutine: 'evening',
    }
  }

  // 4. Sore from a hard session, and only a day out from it.
  if (soreYesterday && isTraining(scheduledKind)) {
    return {
      focus: 'Mobility',
      verdict: 'ease',
      headline: 'Take something off the top',
      detail:
        'The last session was hard and it was only yesterday. Do today at about two thirds — drop the last set of each exercise.',
      recovery: 'Warm up longer than usual and finish with the Hips routine.',
      encouragement,
      suggestedRoutine: 'hips',
    }
  }

  // 5. Under-slept or empty.
  if ((tiredSleep || tiredEnergy) && isTraining(scheduledKind)) {
    const reason = tiredSleep && tiredEnergy
      ? 'Short sleep and low energy'
      : tiredSleep
        ? 'Short sleep'
        : 'Low energy'
    return {
      focus: 'Workout',
      verdict: 'ease',
      headline: 'Lighter, but still worth doing',
      detail: `${reason} today. Keep the movements, drop a set, and stop the reps two short of failure. A shorter session still counts.`,
      recovery: 'Protect tonight — screens down early and lights out before eleven.',
      encouragement,
      suggestedRoutine: 'evening',
    }
  }

  // 6. Back is grumbling but not stopping anything.
  if (pain != null && pain >= PAIN_EASE && isTraining(scheduledKind)) {
    return {
      focus: 'Workout',
      verdict: 'ease',
      headline: 'Train around it',
      detail:
        'Your back is noticeable but not severe. Do the session, keep the hinges light, and skip anything that makes it worse rather than pushing through.',
      recovery: 'Finish with the Lower Back routine rather than the usual cool-down.',
      encouragement,
      suggestedRoutine: 'lowerBack',
    }
  }

  // 7. Coming back after time away.
  if (daysSinceLastSession != null && daysSinceLastSession >= LAYOFF_DAYS) {
    return {
      focus: 'Workout',
      verdict: 'ease',
      headline: 'Ease back in',
      detail: `It has been ${daysSinceLastSession} days. Do the session at a comfortable effort — the aim today is to be back, not to prove anything.`,
      recovery: 'Expect some stiffness in a day or two. Mobility on the days between will help.',
      encouragement: 'Nothing is lost. Picking it up again is the hard part, and you just did.',
      suggestedRoutine: 'morning',
    }
  }

  // 8. First session of the journey.
  if (daysSinceLastSession == null) {
    return {
      focus: 'Workout',
      verdict: 'go',
      headline: 'Day one',
      detail:
        'Take it steadily and learn the movements. Read the instructions on anything new — form now saves months later.',
      recovery: 'Some soreness in a day or two is normal and settles quickly.',
      encouragement: 'Starting is the whole thing. Everything else is repetition.',
      suggestedRoutine: 'morning',
    }
  }

  // 9. Mobility or recovery day as scheduled.
  if (!isTraining(scheduledKind)) {
    return {
      focus: 'Mobility',
      verdict: 'go',
      headline: 'Move gently today',
      detail:
        'A recovery day by design. Go slowly enough that each position gets a few full breaths.',
      recovery: 'This is the recovery. Add a walk if you have the time.',
      encouragement,
      suggestedRoutine: 'morning',
    }
  }

  // 10. Nothing in the way.
  return {
    focus: 'Workout',
    verdict: 'go',
    headline: journeyDay <= 7 ? 'Build the habit' : 'Good to go',
    detail:
      'Sleep, energy and back are all in reasonable shape. Take the session as written and aim to finish every set.',
    recovery: 'Cool down properly and get to bed on time — that is where the adaptation happens.',
    encouragement,
    suggestedRoutine: 'evening',
  }
}
