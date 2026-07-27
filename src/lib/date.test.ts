import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  fromKey,
  lastNDays,
  parseClock,
  startOfWeek,
  toKey,
  weekdayIndex,
  weekKeys,
} from './date'

describe('date keys', () => {
  it('builds keys from local calendar parts, not UTC', () => {
    // 23:30 local on the 5th is still the 5th, even where that is the 6th in UTC.
    expect(toKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    expect(toKey(new Date(2026, 0, 5, 0, 15))).toBe('2026-01-05')
  })

  it('round-trips through fromKey', () => {
    for (const key of ['2026-01-01', '2026-02-28', '2026-12-31', '2028-02-29']) {
      expect(toKey(fromKey(key))).toBe(key)
    }
  })

  it('pads single-digit months and days', () => {
    expect(toKey(new Date(2026, 8, 7))).toBe('2026-09-07')
  })
})

describe('addDays', () => {
  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('crosses year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('survives a spring-forward DST transition', () => {
    // Wherever the runner is, adding a day must always land on the next date —
    // a naive +86,400,000ms would land back on the same day across a DST jump.
    const spans = ['2026-03-28', '2026-03-29', '2026-10-24', '2026-11-01']
    for (const day of spans) {
      expect(daysBetween(day, addDays(day, 1))).toBe(1)
    }
  })
})

describe('daysBetween', () => {
  it('counts whole days regardless of clock time', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7)
    expect(daysBetween('2026-01-08', '2026-01-01')).toBe(-7)
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0)
  })

  it('is correct across a DST boundary in both directions', () => {
    expect(daysBetween('2026-03-27', '2026-03-30')).toBe(3)
    expect(daysBetween('2026-10-23', '2026-10-26')).toBe(3)
  })
})

describe('weeks', () => {
  it('treats Monday as the first day', () => {
    // 2026-07-27 is a Monday.
    expect(weekdayIndex('2026-07-27')).toBe(0)
    expect(weekdayIndex('2026-08-02')).toBe(6) // Sunday
    expect(startOfWeek('2026-08-02')).toBe('2026-07-27')
    expect(startOfWeek('2026-07-27')).toBe('2026-07-27')
  })

  it('returns seven consecutive keys', () => {
    const week = weekKeys('2026-07-30')
    expect(week).toHaveLength(7)
    expect(week[0]).toBe('2026-07-27')
    expect(week[6]).toBe('2026-08-02')
  })
})

describe('lastNDays', () => {
  it('ends on the given day and runs oldest first', () => {
    const days = lastNDays('2026-07-27', 3)
    expect(days).toEqual(['2026-07-25', '2026-07-26', '2026-07-27'])
  })
})

describe('parseClock', () => {
  it('parses valid times to minutes past midnight', () => {
    expect(parseClock('00:00')).toBe(0)
    expect(parseClock('09:30')).toBe(570)
    expect(parseClock('23:59')).toBe(1439)
  })

  it('rejects anything malformed', () => {
    for (const bad of ['24:00', '12:60', 'nine', '9', '', null, undefined]) {
      expect(parseClock(bad)).toBeNull()
    }
  })
})
