import { describe, expect, it } from 'vitest'
import { activeDates, computeStreak, painFreeRun, perfectHabitDays, personalRecords } from './stats'
import { EMPTY_MEASUREMENT } from './repo'
import type { DailyHealth, HabitLog, WorkoutHistoryEntry } from './types'

const entry = (date: string, extra: Partial<WorkoutHistoryEntry> = {}): WorkoutHistoryEntry => ({
  id: `w-${date}`,
  date,
  source: 'program',
  templateId: 'p1-a',
  templateName: 'Foundation A',
  templateSubtitle: 'Push & legs',
  kind: 'strength',
  startedAt: 0,
  finishedAt: 0,
  durationSeconds: 1800,
  logs: [],
  completedSets: 12,
  plannedSets: 12,
  totalReps: 100,
  volumeKg: 0,
  rpe: 7,
  painBefore: null,
  painAfter: null,
  note: '',
  ...extra,
})

const habit = (date: string, habitId: string, done = true): HabitLog => ({
  id: `${date}:${habitId}`,
  date,
  habitId,
  done,
  updatedAt: 0,
})

const daily = (date: string, pain: number | null): DailyHealth => ({
  date,
  sleepHours: null,
  steps: null,
  energy: null,
  pain,
  notes: '',
  updatedAt: 0,
})

describe('activeDates', () => {
  it('counts a completed session', () => {
    expect(activeDates([entry('2026-07-27')], [])).toEqual(new Set(['2026-07-27']))
  })

  it('counts a ticked workout or mobility habit', () => {
    const dates = activeDates([], [habit('2026-07-27', 'workout'), habit('2026-07-28', 'mobility')])
    expect(dates).toEqual(new Set(['2026-07-27', '2026-07-28']))
  })

  it('ignores other habits and unticked ones', () => {
    const logs = [habit('2026-07-27', 'hydration'), habit('2026-07-28', 'workout', false)]
    expect(activeDates([], logs).size).toBe(0)
  })
})

describe('computeStreak', () => {
  const today = '2026-07-27'

  it('is zero with no activity', () => {
    expect(computeStreak(new Set(), today)).toEqual({ current: 0, longest: 0 })
  })

  it('counts back from today', () => {
    const dates = new Set(['2026-07-25', '2026-07-26', '2026-07-27'])
    expect(computeStreak(dates, today).current).toBe(3)
  })

  it('does not break when today is not yet done', () => {
    // Yesterday and before still count — today has not finished.
    const dates = new Set(['2026-07-25', '2026-07-26'])
    expect(computeStreak(dates, today).current).toBe(2)
  })

  it('breaks on a genuine gap', () => {
    const dates = new Set(['2026-07-20', '2026-07-21', '2026-07-25'])
    expect(computeStreak(dates, today).current).toBe(0)
  })

  it('finds the longest historical run', () => {
    const dates = new Set([
      '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04',
      '2026-07-10',
      '2026-07-26', '2026-07-27',
    ])
    const result = computeStreak(dates, today)
    expect(result.longest).toBe(4)
    expect(result.current).toBe(2)
  })

  it('counts a run that crosses a month boundary', () => {
    const dates = new Set(['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02'])
    expect(computeStreak(dates, '2026-07-02').current).toBe(4)
  })

  it('counts a run that crosses a year boundary', () => {
    const dates = new Set(['2026-12-30', '2026-12-31', '2027-01-01'])
    expect(computeStreak(dates, '2027-01-01').current).toBe(3)
  })
})

describe('painFreeRun', () => {
  const today = '2026-07-27'

  it('counts consecutive days at or below 2', () => {
    const rows = [daily('2026-07-25', 1), daily('2026-07-26', 2), daily('2026-07-27', 0)]
    expect(painFreeRun(rows, today)).toBe(3)
  })

  it('stops at the first day above 2', () => {
    const rows = [daily('2026-07-25', 5), daily('2026-07-26', 1), daily('2026-07-27', 1)]
    expect(painFreeRun(rows, today)).toBe(2)
  })

  it('does not count an unlogged day', () => {
    const rows = [daily('2026-07-25', 1), daily('2026-07-27', 1)]
    expect(painFreeRun(rows, today)).toBe(1)
  })

  it('tolerates today being unlogged and counts back from yesterday', () => {
    const rows = [daily('2026-07-25', 1), daily('2026-07-26', 1)]
    expect(painFreeRun(rows, today)).toBe(2)
  })
})

describe('perfectHabitDays', () => {
  it('needs every habit on the same day', () => {
    const ids = ['workout', 'mobility', 'walk', 'hydration', 'sleep', 'stretch']
    const full = ids.map((id) => habit('2026-07-27', id))
    const partial = ids.slice(0, 4).map((id) => habit('2026-07-26', id))
    expect(perfectHabitDays([...full, ...partial])).toBe(1)
  })
})

describe('personalRecords', () => {
  it('takes the best from logged sets and from manual tests', () => {
    const history = [
      entry('2026-07-20', {
        logs: [
          {
            exerciseId: 'push-up',
            section: 'main',
            plannedSets: 3,
            restSeconds: 60,
            skipped: false,
            sets: [
              { done: true, reps: 14 },
              { done: true, reps: 12 },
              { done: false, reps: 99 }, // not done, must be ignored
            ],
          },
          {
            exerciseId: 'front-plank',
            section: 'main',
            plannedSets: 1,
            restSeconds: 45,
            skipped: false,
            sets: [{ done: true, seconds: 50 }],
          },
        ],
      }),
    ]
    const records = personalRecords(history, [
      { ...EMPTY_MEASUREMENT('2026-07-21'), pushupMax: 18 },
    ])
    expect(records.pushups).toBe(18)
    expect(records.plankSeconds).toBe(50)
  })

  it('is zero with nothing recorded', () => {
    expect(personalRecords([], [])).toEqual({ pushups: 0, plankSeconds: 0 })
  })
})
