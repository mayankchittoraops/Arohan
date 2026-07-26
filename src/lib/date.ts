/**
 * Every date in Arohan is a local `YYYY-MM-DD` key. The app is single-user and
 * single-timezone, so keys are built from local calendar parts and never from
 * `toISOString()`, which would shift the day for anyone east or west of UTC.
 */

export type DateKey = string

export function toKey(date: Date): DateKey {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key)
  d.setDate(d.getDate() + days)
  return toKey(d)
}

/** Whole days from `a` to `b` (b - a), ignoring clock time. */
export function daysBetween(a: DateKey, b: DateKey): number {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: DateKey): number {
  return (fromKey(key).getDay() + 6) % 7
}

export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayIndex(key))
}

/** The seven date keys of the week containing `key`, Monday first. */
export function weekKeys(key: DateKey): DateKey[] {
  const start = startOfWeek(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** The `count` most recent date keys ending at `key`, oldest first. */
export function lastNDays(key: DateKey, count: number): DateKey[] {
  return Array.from({ length: count }, (_, i) => addDays(key, i - count + 1))
}

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function weekdayShort(key: DateKey): string {
  return WEEKDAY_SHORT[weekdayIndex(key)]
}

export function weekdayInitial(key: DateKey): string {
  return WEEKDAY_SHORT[weekdayIndex(key)].slice(0, 1)
}

export function formatFriendly(key: DateKey): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatShort(key: DateKey): string {
  return fromKey(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatRelative(key: DateKey, today = todayKey()): string {
  const diff = daysBetween(key, today)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff === -1) return 'Tomorrow'
  if (diff > 1 && diff < 7) return `${diff} days ago`
  return formatShort(key)
}

/** Greeting bucket for the current hour. */
export function greetingFor(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

/** Parses an `HH:MM` string into minutes past midnight, or null. */
export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}
