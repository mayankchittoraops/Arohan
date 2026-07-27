import type { Transition, Variants } from 'framer-motion'

/**
 * Motion tokens. These mirror the `--duration-*` and `--ease-*` custom
 * properties in `index.css` so a CSS transition and a Framer Motion animation
 * of the same intent move at the same speed.
 *
 * Durations are in seconds because that is what Framer Motion takes.
 */
export const DURATION = {
  instant: 0.12,
  fast: 0.18,
  base: 0.26,
  slow: 0.42,
} as const

/** Matches `--ease-out-soft`: decisive start, gentle settle. */
export const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const

/** Springs used for anything the user has directly grabbed or toggled. */
export const SPRING = {
  /** Sheets and overlays. */
  panel: { type: 'spring', damping: 30, stiffness: 320 } as Transition,
  /** Small controls: pills, toggles, badges. */
  control: { type: 'spring', damping: 26, stiffness: 400 } as Transition,
  /** Celebration and emphasis. */
  bounce: { type: 'spring', damping: 14, stiffness: 260 } as Transition,
} as const

export const TRANSITION = {
  fast: { duration: DURATION.fast, ease: EASE_OUT_SOFT } as Transition,
  base: { duration: DURATION.base, ease: EASE_OUT_SOFT } as Transition,
  slow: { duration: DURATION.slow, ease: EASE_OUT_SOFT } as Transition,
} as const

/** Page enter. Kept small — a long slide makes navigation feel sluggish. */
export const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

/** Horizontal advance between exercises in the session runner. */
export const ADVANCE_VARIANTS: Variants = {
  initial: (back: boolean) => ({ opacity: 0, x: back ? -28 : 28 }),
  animate: { opacity: 1, x: 0 },
  exit: (back: boolean) => ({ opacity: 0, x: back ? 28 : -28 }),
}

/** Collapsible disclosure. */
export const COLLAPSE_VARIANTS: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
}
