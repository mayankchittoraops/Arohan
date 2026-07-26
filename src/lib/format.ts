/** `M:SS`, or `H:MM:SS` once the duration passes an hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = hours > 0 ? `${minutes}`.padStart(2, '0') : `${minutes}`
  return hours > 0
    ? `${hours}:${mm}:${`${seconds}`.padStart(2, '0')}`
    : `${mm}:${`${seconds}`.padStart(2, '0')}`
}

/** Compact human duration for summaries: `45 sec`, `42 min`, `1 h 05 min`. */
export function formatMinutes(totalSeconds: number): string {
  // A four-minute mobility routine should never round down to "0 min".
  if (totalSeconds < 60) return `${Math.max(0, Math.round(totalSeconds))} sec`
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${`${m}`.padStart(2, '0')} min`
}

export function formatWeight(kg: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (kg == null) return '—'
  return units === 'metric' ? `${kg.toFixed(1)} kg` : `${(kg * 2.20462).toFixed(1)} lb`
}

export function formatLength(cm: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (cm == null) return '—'
  return units === 'metric' ? `${cm.toFixed(1)} cm` : `${(cm / 2.54).toFixed(1)} in`
}

export function toDisplayWeight(kg: number, units: 'metric' | 'imperial'): number {
  return units === 'metric' ? kg : kg * 2.20462
}

export function fromDisplayWeight(value: number, units: 'metric' | 'imperial'): number {
  return units === 'metric' ? value : value / 2.20462
}

export function toDisplayLength(cm: number, units: 'metric' | 'imperial'): number {
  return units === 'metric' ? cm : cm / 2.54
}

export function fromDisplayLength(value: number, units: 'metric' | 'imperial'): number {
  return units === 'metric' ? value : value * 2.54
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
