import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from './exercises'
import { MOBILITY_ROUTINES } from './mobility'
import {
  ALL_TEMPLATES,
  BASE_EQUIPMENT,
  journeyDay,
  mainSetCount,
  ownsEquipment,
  phaseForDay,
  progressionFor,
  resolveSession,
  templateIdFor,
} from './program'
import type { Equipment } from './types'

const OWNS_ALL: Equipment[] = ['band', 'dumbbell', 'pullupBar']
const START = '2026-01-05' // a Monday

describe('progression', () => {
  it('builds for three weeks then deloads', () => {
    expect(progressionFor(0).deload).toBe(false)
    expect(progressionFor(1).deload).toBe(false)
    expect(progressionFor(2).deload).toBe(false)
    expect(progressionFor(3).deload).toBe(true)
    expect(progressionFor(7).deload).toBe(true)
    expect(progressionFor(11).deload).toBe(true)
  })

  it('adds volume as the block progresses', () => {
    expect(progressionFor(1).repDelta).toBeGreaterThan(progressionFor(0).repDelta)
    expect(progressionFor(2).repDelta).toBeGreaterThan(progressionFor(1).repDelta)
  })

  it('raises the baseline each block', () => {
    expect(progressionFor(4).repDelta).toBeGreaterThan(progressionFor(0).repDelta)
    expect(progressionFor(8).setDelta).toBeGreaterThanOrEqual(progressionFor(0).setDelta)
  })

  it('adds nothing on a deload week', () => {
    const d = progressionFor(3)
    expect(d.repDelta).toBe(0)
    expect(d.secondDelta).toBe(0)
  })

  it('clamps beyond the end of a phase rather than growing without bound', () => {
    expect(progressionFor(50)).toEqual(progressionFor(12))
    expect(progressionFor(-5)).toEqual(progressionFor(0))
  })
})

describe('phase boundaries', () => {
  it('maps journey days to phases', () => {
    expect(phaseForDay(1)).toBe(1)
    expect(phaseForDay(90)).toBe(1)
    expect(phaseForDay(91)).toBe(2)
    expect(phaseForDay(180)).toBe(2)
    expect(phaseForDay(181)).toBe(3)
    expect(phaseForDay(270)).toBe(3)
    expect(phaseForDay(271)).toBe(4)
    expect(phaseForDay(365)).toBe(4)
    expect(phaseForDay(500)).toBe(4)
  })

  it('counts journey day from one', () => {
    expect(journeyDay(START, START)).toBe(1)
    expect(journeyDay(START, '2026-01-06')).toBe(2)
  })
})

describe('weekly schedule', () => {
  it('gives every phase a full seven-day week', () => {
    for (const phase of [1, 2, 3, 4] as const) {
      const ids = Array.from({ length: 7 }, (_, i) =>
        templateIdFor(`2026-01-0${5 + i}`, phase),
      )
      expect(ids).toHaveLength(7)
      expect(ids.every(Boolean)).toBe(true)
      expect(ids).toContain('rest')
    }
  })
})

describe('resolveSession', () => {
  const opts = { startDate: START, phase: 1 as const, equipment: OWNS_ALL }

  it('produces a runnable session for every template', () => {
    for (const template of ALL_TEMPLATES) {
      const resolved = resolveSession(START, { ...opts, templateId: template.id })
      if (template.id === 'rest') {
        expect(resolved.blocks).toHaveLength(0)
        continue
      }
      expect(resolved.blocks.length).toBeGreaterThan(0)
      expect(mainSetCount(resolved.blocks)).toBeGreaterThan(0)
      for (const block of resolved.blocks) {
        expect(getExercise(block.exerciseId)).toBeDefined()
        expect(block.sets).toBeGreaterThan(0)
        // Every block must specify one target or the other, never neither.
        expect(block.reps != null || block.seconds != null).toBe(true)
      }
    }
  })

  it('substitutes down the chain when equipment is missing', () => {
    const withBands = resolveSession(START, { ...opts, templateId: 'p1-b' })
    const without = resolveSession(START, { ...opts, equipment: [], templateId: 'p1-b' })

    expect(withBands.blocks.some((b) => b.exerciseId.startsWith('band-'))).toBe(true)
    expect(without.blocks.some((b) => b.exerciseId.startsWith('band-'))).toBe(false)
    expect(without.blocks.length).toBeGreaterThan(0)
  })

  it('never prescribes a movement you cannot equip', () => {
    for (const equipment of [[], ['band'], ['band', 'dumbbell'], OWNS_ALL] as Equipment[][]) {
      for (const template of ALL_TEMPLATES) {
        const resolved = resolveSession(START, { ...opts, equipment, templateId: template.id })
        for (const block of resolved.blocks) {
          const exercise = getExercise(block.exerciseId)!
          expect(ownsEquipment(equipment, exercise.equipment)).toBe(true)
        }
      }
    }
  })

  it('never repeats a substituted movement inside one session', () => {
    const resolved = resolveSession(START, { ...opts, equipment: [], templateId: 'p1-b' })
    const ids = resolved.blocks.map((b) => b.exerciseId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reports what it dropped', () => {
    const resolved = resolveSession(START, { ...opts, equipment: [], templateId: 'p1-b' })
    expect(resolved.dropped.length).toBeGreaterThan(0)
  })
})

describe('library integrity', () => {
  it('has unique ids', () => {
    const ids = EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every exercise complete metadata', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.name.length).toBeGreaterThan(2)
      expect(exercise.summary.length).toBeGreaterThan(10)
      expect(exercise.instructions.length).toBeGreaterThan(1)
      expect(exercise.primary.length).toBeGreaterThan(0)
      expect(exercise.secondary.length).toBeGreaterThan(0)
      expect(exercise.regression.length).toBeGreaterThan(5)
      expect(exercise.progression.length).toBeGreaterThan(5)
      expect(['foundation', 'developing', 'advanced']).toContain(exercise.difficulty)
    }
  })

  it('never lists a secondary muscle that is already primary', () => {
    for (const exercise of EXERCISES) {
      for (const muscle of exercise.secondary) {
        expect(exercise.primary).not.toContain(muscle)
      }
    }
  })

  it('references only exercises that exist, from every template and routine', () => {
    for (const template of ALL_TEMPLATES) {
      for (const block of template.blocks) {
        expect(getExercise(block.exerciseId), `${template.id} -> ${block.exerciseId}`).toBeDefined()
      }
    }
    for (const routine of MOBILITY_ROUTINES) {
      for (const move of routine.moves) {
        expect(getExercise(move.exerciseId), `${routine.id} -> ${move.exerciseId}`).toBeDefined()
      }
    }
  })

  it('contains no orphan exercises', () => {
    const referenced = new Set<string>()
    for (const t of ALL_TEMPLATES) for (const b of t.blocks) referenced.add(b.exerciseId)
    for (const r of MOBILITY_ROUTINES) for (const m of r.moves) referenced.add(m.exerciseId)
    // A movement reachable only as a substitution is still reachable, so
    // resolve every template against every equipment combination too.
    for (const equipment of [[], ['band'], ['band', 'dumbbell'], OWNS_ALL] as Equipment[][]) {
      for (const t of ALL_TEMPLATES) {
        for (const b of resolveSession(START, { startDate: START, phase: 1, equipment, templateId: t.id }).blocks) {
          referenced.add(b.exerciseId)
        }
      }
    }
    const orphans = EXERCISES.filter((e) => !referenced.has(e.id)).map((e) => e.id)
    expect(orphans).toEqual([])
  })
})

describe('equipment', () => {
  it('treats the base kit as always owned', () => {
    expect(ownsEquipment([], BASE_EQUIPMENT)).toBe(true)
    expect(ownsEquipment([], ['band'])).toBe(false)
    expect(ownsEquipment(['band'], ['band', 'mat'])).toBe(true)
  })
})
