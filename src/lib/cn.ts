type ClassValue = string | false | null | undefined

/** Joins truthy class names. Small on purpose — no conflict resolution needed. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
