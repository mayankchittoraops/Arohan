import { describe, expect, it } from 'vitest'
import { coach, completionMessage, type CoachInput } from './coach'

/** A neutral day: nothing wrong, nothing notable, strength session scheduled. */
const base: CoachInput = {
  scheduledKind: 'strength',
  trainedToday: false,
  sleepHours: 8,
  energy: 4,
  pain: 1,
  daysSinceLastSession: 2,
  lastRpe: 6,
  streak: 3,
  journeyDay: 20,
}

const on = (patch: Partial<CoachInput>) => coach({ ...base, ...patch })

describe('rule ordering', () => {
  it('having trained already outranks everything else', () => {
    const advice = on({ trainedToday: true, pain: 9, sleepHours: 3 })
    expect(advice.verdict).toBe('done')
    expect(advice.focus).toBe('Recovery')
  })

  it('pain outranks the plan', () => {
    const advice = on({ pain: 7 })
    expect(advice.verdict).toBe('swap')
    expect(advice.suggestedRoutine).toBe('lowerBack')
  })

  it('pain outranks short sleep and a long layoff', () => {
    expect(on({ pain: 8, sleepHours: 3, daysSinceLastSession: 10 }).verdict).toBe('swap')
  })

  it('a rest day is a rest day even when everything else is fine', () => {
    const advice = on({ scheduledKind: 'rest' })
    expect(advice.verdict).toBe('rest')
    expect(advice.focus).toBe('Rest')
  })

  it('a bad back still overrides a scheduled rest day', () => {
    expect(on({ scheduledKind: 'rest', pain: 9 }).verdict).toBe('swap')
  })
})

describe('pain thresholds', () => {
  it('stops the session at 6 and above', () => {
    expect(on({ pain: 6 }).verdict).toBe('swap')
    expect(on({ pain: 10 }).verdict).toBe('swap')
  })

  it('eases the session between 4 and 5', () => {
    expect(on({ pain: 4 }).verdict).toBe('ease')
    expect(on({ pain: 5 }).verdict).toBe('ease')
  })

  it('leaves the session alone below 4', () => {
    expect(on({ pain: 3 }).verdict).toBe('go')
    expect(on({ pain: 0 }).verdict).toBe('go')
  })
})

describe('recovery signals', () => {
  it('eases after short sleep', () => {
    expect(on({ sleepHours: 5 }).verdict).toBe('ease')
    expect(on({ sleepHours: 6 }).verdict).toBe('go')
  })

  it('eases when energy is depleted', () => {
    expect(on({ energy: 2 }).verdict).toBe('ease')
    expect(on({ energy: 3 }).verdict).toBe('go')
  })

  it('eases the day after a maximal session', () => {
    expect(on({ lastRpe: 9, daysSinceLastSession: 1 }).verdict).toBe('ease')
    // Two days out, it no longer applies.
    expect(on({ lastRpe: 9, daysSinceLastSession: 2 }).verdict).toBe('go')
  })

  it('eases back in after four days away', () => {
    const advice = on({ daysSinceLastSession: 4 })
    expect(advice.verdict).toBe('ease')
    expect(advice.detail).toContain('4 days')
  })
})

describe('unlogged inputs never trigger a rule', () => {
  it('treats null sleep, energy and pain as absent rather than zero', () => {
    const advice = on({ sleepHours: null, energy: null, pain: null })
    expect(advice.verdict).toBe('go')
  })
})

describe('first session', () => {
  it('is recognised when there is no history at all', () => {
    const advice = on({ daysSinceLastSession: null, lastRpe: null, streak: 0, journeyDay: 1 })
    expect(advice.headline).toBe('Day one')
    expect(advice.verdict).toBe('go')
  })
})

describe('tone', () => {
  it('never guilts after a layoff', () => {
    const advice = on({ daysSinceLastSession: 21, streak: 0 })
    const text = `${advice.headline} ${advice.detail} ${advice.encouragement}`.toLowerCase()
    for (const word of ['fail', 'lazy', 'should have', 'missed', 'behind', 'excuse', 'guilt']) {
      expect(text).not.toContain(word)
    }
  })

  it('always supplies a recovery suggestion', () => {
    const cases: Array<Partial<CoachInput>> = [
      {},
      { pain: 9 },
      { scheduledKind: 'rest' },
      { trainedToday: true },
      { sleepHours: 4 },
      { daysSinceLastSession: null },
      { scheduledKind: 'recovery' },
      { scheduledKind: 'mobility' },
    ]
    for (const patch of cases) {
      const advice = on(patch)
      expect(advice.recovery.length).toBeGreaterThan(10)
      expect(advice.encouragement.length).toBeGreaterThan(5)
      expect(advice.headline.length).toBeGreaterThan(3)
    }
  })
})

describe('determinism', () => {
  it('gives the same answer for the same input', () => {
    for (let i = 0; i < 20; i++) {
      expect(on({ journeyDay: 42 })).toEqual(on({ journeyDay: 42 }))
    }
  })
})

describe('encouragement variety', () => {
  it('does not repeat on consecutive days within a streak band', () => {
    for (let day = 1; day < 120; day++) {
      const a = on({ journeyDay: day, streak: 10 }).encouragement
      const b = on({ journeyDay: day + 1, streak: 10 }).encouragement
      expect(a).not.toBe(b)
    }
  })

  it('offers at least ten distinct lines over a month in every band', () => {
    for (const streak of [0, 1, 3, 8, 20, 45, 200]) {
      const seen = new Set<string>()
      for (let day = 1; day <= 30; day++) {
        seen.add(on({ journeyDay: day, streak }).encouragement)
      }
      expect(seen.size).toBeGreaterThanOrEqual(10)
    }
  })

  it('varies the completion message across a month too', () => {
    const seen = new Set<string>()
    for (let day = 1; day <= 30; day++) seen.add(completionMessage(5, day))
    expect(seen.size).toBeGreaterThanOrEqual(10)
  })
})
