import { describe, expect, it } from 'vitest'
import { buildSession, elapsedOf, pauseSession, resumeSession, summarise, toHistoryEntry } from './session'
import type { PlannedExercise } from '@/data/types'

const blocks: PlannedExercise[] = [
  { exerciseId: 'cat-cow', section: 'warmup', sets: 1, reps: 8, restSeconds: 15 },
  { exerciseId: 'bodyweight-squat', section: 'main', sets: 3, reps: 10, restSeconds: 60 },
  { exerciseId: 'front-plank', section: 'main', sets: 2, seconds: 30, restSeconds: 45 },
]

const build = () =>
  buildSession({
    date: '2026-07-27',
    source: 'program',
    templateId: 'p1-a',
    templateName: 'Foundation A',
    templateSubtitle: 'Push & legs',
    kind: 'strength',
    blocks,
  })

describe('buildSession', () => {
  it('creates one log per block with the planned targets pre-filled', () => {
    const session = build()
    expect(session.logs).toHaveLength(3)
    expect(session.logs[1].sets).toHaveLength(3)
    expect(session.logs[1].sets.every((s) => s.reps === 10 && !s.done)).toBe(true)
    expect(session.logs[2].sets.every((s) => s.seconds === 30)).toBe(true)
  })

  it('starts running and at zero', () => {
    const session = build()
    expect(session.elapsedSeconds).toBe(0)
    expect(session.runningSince).not.toBeNull()
    expect(session.currentIndex).toBe(0)
  })

  it('keeps the coach note separate from the user note', () => {
    const session = buildSession({
      date: '2026-07-27',
      source: 'program',
      templateId: 't',
      templateName: 'T',
      templateSubtitle: 's',
      kind: 'strength',
      blocks: [{ ...blocks[0], note: 'Lower the surface.' }],
    })
    expect(session.logs[0].coachNote).toBe('Lower the surface.')
    expect(session.logs[0].note).toBeUndefined()
  })
})

describe('summarise', () => {
  it('is zero on a fresh session but knows the plan', () => {
    const s = summarise(build())
    expect(s.completedSets).toBe(0)
    expect(s.plannedSets).toBe(6)
    expect(s.progress).toBe(0)
  })

  it('counts only completed sets', () => {
    const session = build()
    session.logs[1].sets[0].done = true
    session.logs[1].sets[1].done = true
    const s = summarise(session)
    expect(s.completedSets).toBe(2)
    expect(s.totalReps).toBe(20)
    expect(s.progress).toBeCloseTo(2 / 6)
  })

  it('multiplies weight by reps for volume, and ignores unweighted sets', () => {
    const session = build()
    session.logs[1].sets[0] = { done: true, reps: 10, weightKg: 20 }
    session.logs[1].sets[1] = { done: true, reps: 10 }
    expect(summarise(session).volumeKg).toBe(200)
  })

  it('excludes a skipped exercise from completed work but not from the plan', () => {
    const session = build()
    session.logs[1].sets.forEach((s) => (s.done = true))
    session.logs[1].skipped = true
    const s = summarise(session)
    expect(s.completedSets).toBe(0)
    expect(s.plannedSets).toBe(6)
  })

  it('never divides by zero on an empty session', () => {
    const empty = buildSession({
      date: '2026-07-27',
      source: 'program',
      templateId: 'rest',
      templateName: 'Rest',
      templateSubtitle: '',
      kind: 'rest',
      blocks: [],
    })
    expect(summarise(empty).progress).toBe(0)
  })
})

describe('the session clock', () => {
  it('accumulates while running', () => {
    const session = { ...build(), runningSince: 1000, elapsedSeconds: 0 }
    expect(elapsedOf(session, 11_000)).toBe(10)
  })

  it('stops accumulating once paused', () => {
    const paused = pauseSession({ ...build(), runningSince: 1000, elapsedSeconds: 0 }, 11_000)
    expect(paused.runningSince).toBeNull()
    expect(paused.elapsedSeconds).toBe(10)
    // Time passing while paused must not count.
    expect(elapsedOf(paused, 999_999)).toBe(10)
  })

  it('resumes without losing what was banked', () => {
    const paused = pauseSession({ ...build(), runningSince: 1000, elapsedSeconds: 0 }, 11_000)
    const resumed = resumeSession(paused, 20_000)
    expect(elapsedOf(resumed, 25_000)).toBe(15)
  })

  it('is idempotent', () => {
    const paused = pauseSession({ ...build(), runningSince: 1000 }, 11_000)
    expect(pauseSession(paused, 50_000)).toEqual(paused)
    const running = build()
    expect(resumeSession(running, 50_000)).toEqual(running)
  })

  it('never reports negative time if the clock jumps backwards', () => {
    const session = { ...build(), runningSince: 10_000, elapsedSeconds: 0 }
    expect(elapsedOf(session, 5_000)).toBe(0)
  })
})

describe('toHistoryEntry', () => {
  it('carries the totals and the finishing answers', () => {
    // A real runningSince is always Date.now(), never 0 — 0 is falsy and would
    // read as already paused.
    const session = pauseSession({ ...build(), runningSince: 1_000, elapsedSeconds: 0 }, 61_000)
    session.logs[1].sets.forEach((s) => (s.done = true))

    const entry = toHistoryEntry(session, { rpe: 7, painAfter: 2, note: 'felt good' }, 61_000)
    expect(entry.durationSeconds).toBe(60)
    expect(entry.completedSets).toBe(3)
    expect(entry.plannedSets).toBe(6)
    expect(entry.totalReps).toBe(30)
    expect(entry.rpe).toBe(7)
    expect(entry.painAfter).toBe(2)
    expect(entry.note).toBe('felt good')
    expect(entry.id).toBe(session.id)
    expect(entry.date).toBe('2026-07-27')
  })

  it('defaults the optional answers rather than dropping them', () => {
    const entry = toHistoryEntry(build())
    expect(entry.rpe).toBeNull()
    expect(entry.painAfter).toBeNull()
    expect(entry.note).toBe('')
  })
})
