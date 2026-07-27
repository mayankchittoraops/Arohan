import { describe, expect, it } from 'vitest'
import { getRoutine, MOBILITY_ROUTINES, routineMinutes } from './mobility'
import { requireExercise } from './exercises'
import { estimateSeconds, ownsEquipment, resolveMoves } from './program'
import { MOBILITY_CATEGORIES } from './types'
import type { Equipment } from './types'

describe('routine content', () => {
  it('has unique ids and a category each', () => {
    const ids = MOBILITY_ROUTINES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const routine of MOBILITY_ROUTINES) {
      expect(MOBILITY_CATEGORIES).toContain(routine.category)
    }
  })

  it('fills every category', () => {
    for (const category of MOBILITY_CATEGORIES) {
      expect(MOBILITY_ROUTINES.some((r) => r.category === category), category).toBe(true)
    }
  })

  it('gives every routine a name, subtitle and intent', () => {
    for (const routine of MOBILITY_ROUTINES) {
      expect(routine.name.length).toBeGreaterThan(2)
      expect(routine.subtitle.length).toBeGreaterThan(3)
      expect(routine.intent.length).toBeGreaterThan(20)
      expect(routine.moves.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('states a duration that matches its own content', () => {
    for (const routine of MOBILITY_ROUTINES) {
      const stated = routineMinutes(routine)
      const actual = estimateSeconds(routine.moves) / 60
      // Derived, so this is really a guard against the derivation drifting.
      expect(Math.abs(stated - actual), routine.id).toBeLessThan(1)
      expect(stated).toBeGreaterThan(0)
    }
  })

  it('keeps every routine short enough to actually do', () => {
    for (const routine of MOBILITY_ROUTINES) {
      expect(routineMinutes(routine), routine.id).toBeLessThanOrEqual(15)
    }
  })

  it('uses only movements that are safe for an irritable back', () => {
    for (const routine of MOBILITY_ROUTINES) {
      for (const move of routine.moves) {
        expect(requireExercise(move.exerciseId).backFriendly, move.exerciseId).toBe(true)
      }
    }
  })

  it('never repeats a movement inside one routine', () => {
    for (const routine of MOBILITY_ROUTINES) {
      const ids = routine.moves.map((m) => m.exerciseId)
      expect(new Set(ids).size, routine.id).toBe(ids.length)
    }
  })

  it('gives every move a target and a single set', () => {
    for (const routine of MOBILITY_ROUTINES) {
      for (const move of routine.moves) {
        expect(move.reps != null || move.seconds != null, move.exerciseId).toBe(true)
        expect(move.sets).toBe(1)
      }
    }
  })
})

describe('sequencing', () => {
  it('opens the wind-down routines with breathing', () => {
    for (const id of ['evening', 'lowerBack'] as const) {
      expect(getRoutine(id)!.moves[0].exerciseId).toBe('diaphragmatic-breathing')
    }
  })

  it('ends the evening routine on the most passive position', () => {
    const evening = getRoutine('evening')!
    expect(evening.moves.at(-1)!.exerciseId).toBe('legs-up-wall')
  })

  it('puts mobilising before stretching in the lower back routine', () => {
    const ids = getRoutine('lowerBack')!.moves.map((m) => m.exerciseId)
    // Cat-cow mobilises; child's pose is the long hold it finishes on.
    expect(ids.indexOf('cat-cow')).toBeLessThan(ids.indexOf('childs-pose'))
    expect(ids.at(-1)).toBe('childs-pose')
  })
})

describe('equipment resolution', () => {
  const combos: Equipment[][] = [[], ['band'], ['band', 'dumbbell', 'pullupBar']]

  it('never prescribes a stretch you cannot equip', () => {
    for (const equipment of combos) {
      for (const routine of MOBILITY_ROUTINES) {
        const moves = resolveMoves(routine.moves, equipment)
        expect(moves.length, routine.id).toBeGreaterThan(0)
        for (const move of moves) {
          const exercise = requireExercise(move.exerciseId)
          expect(ownsEquipment(equipment, exercise.equipment), `${routine.id}/${move.exerciseId}`).toBe(true)
        }
      }
    }
  })

  it('substitutes the band pass-through for someone without bands', () => {
    const withBands = resolveMoves(getRoutine('shoulders')!.moves, ['band'])
    const without = resolveMoves(getRoutine('shoulders')!.moves, [])

    expect(withBands.map((m) => m.exerciseId)).toContain('band-dislocate')
    expect(without.map((m) => m.exerciseId)).not.toContain('band-dislocate')
  })

  it('leaves a fully bodyweight routine untouched', () => {
    const neck = getRoutine('neck')!
    expect(resolveMoves(neck.moves, [])).toEqual(neck.moves)
  })
})
