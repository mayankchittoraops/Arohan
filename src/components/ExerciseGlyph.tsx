import type { GlyphKey } from '@/data/types'
import { cn } from '@/lib/cn'

/**
 * Stand-in illustrations for the movement library. Each glyph is a small stick
 * figure drawn in the position the exercise starts or finishes in — enough to
 * recognise the shape at a glance without shipping a photo library.
 */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const head = (cx: number, cy: number, r = 5) => <circle cx={cx} cy={cy} r={r} fill="currentColor" />

function Figure({ glyph }: { glyph: GlyphKey }) {
  switch (glyph) {
    case 'squat':
      return (
        <>
          {head(32, 12)}
          <path d="M32 18v13" {...stroke} />
          <path d="M32 31 22 39v11M32 31l10 8v11" {...stroke} />
          <path d="M32 24h13" {...stroke} />
        </>
      )
    case 'hinge':
      return (
        <>
          {head(18, 20)}
          <path d="M22 23 38 31" {...stroke} />
          <path d="M38 31v19" {...stroke} />
          <path d="M28 27v14" {...stroke} />
          <path d="M38 50h8" {...stroke} />
        </>
      )
    case 'lunge':
      return (
        <>
          {head(30, 11)}
          <path d="M30 17v14" {...stroke} />
          <path d="M30 31 19 40v10M30 31l12 10 6 9" {...stroke} />
        </>
      )
    case 'push':
      return (
        <>
          {head(13, 25)}
          <path d="M18 28h30" {...stroke} />
          <path d="M18 28v16M48 28l8 16" {...stroke} />
          <path d="M12 44h52" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'pull':
      return (
        <>
          <path d="M10 12h44" {...stroke} />
          {head(32, 26)}
          <path d="M22 13 29 22M42 13l-7 9" {...stroke} />
          <path d="M32 32v12" {...stroke} />
          <path d="M32 44l-6 8M32 44l6 8" {...stroke} />
        </>
      )
    case 'row':
      return (
        <>
          {head(24, 14)}
          <path d="M24 20v16" {...stroke} />
          <path d="M24 26h16l-6-6M40 26l-6 6" {...stroke} />
          <path d="M24 36l-5 14M24 36l6 14" {...stroke} />
        </>
      )
    case 'press':
      return (
        <>
          {head(32, 24)}
          <path d="M32 30v14" {...stroke} />
          <path d="M22 18 27 26M42 18l-5 8" {...stroke} />
          <path d="M18 12h10M36 12h10" {...stroke} />
          <path d="M32 44l-6 8M32 44l6 8" {...stroke} />
        </>
      )
    case 'curl':
      return (
        <>
          {head(32, 13)}
          <path d="M32 19v18" {...stroke} />
          <path d="M24 26v-6l-3 12M40 26v-6l3 12" {...stroke} />
          <path d="M32 37l-5 13M32 37l5 13" {...stroke} />
        </>
      )
    case 'plank':
      return (
        <>
          {head(12, 24)}
          <path d="M17 27 52 40" {...stroke} />
          <path d="M17 27v13h-6" {...stroke} />
          <path d="M52 40l6 8" {...stroke} />
          <path d="M8 48h50" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'core':
      return (
        <>
          {head(14, 34)}
          <path d="M19 36h20" {...stroke} />
          <path d="M39 36l6-12M45 24l8 6" {...stroke} />
          <path d="M22 30l6-10" {...stroke} />
          <path d="M8 44h50" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'bridge':
      return (
        <>
          {head(12, 40)}
          <path d="M17 40q14-20 24 -2" {...stroke} />
          <path d="M41 38v10" {...stroke} />
          <path d="M8 48h50" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'twist':
      return (
        <>
          {head(32, 13)}
          <path d="M32 19v16" {...stroke} />
          <path d="M22 25h20" {...stroke} />
          <path d="M32 35l-8 15M32 35l8 15" {...stroke} />
          <path d="M46 20a14 14 0 0 1 0 12" {...stroke} strokeWidth={2.5} />
          <path d="M43 30l3 3 3-4" {...stroke} strokeWidth={2.5} />
        </>
      )
    case 'stretch':
      return (
        <>
          {head(22, 34)}
          <path d="M26 32 40 24" {...stroke} />
          <path d="M40 24v22" {...stroke} />
          <path d="M40 46h10" {...stroke} />
          <path d="M28 36l-8 8" {...stroke} />
        </>
      )
    case 'catcow':
      return (
        <>
          {head(13, 30)}
          <path d="M18 30q14-12 28 0" {...stroke} />
          <path d="M20 32v14M44 32v14" {...stroke} />
          <path d="M8 46h50" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'hip':
      return (
        <>
          {head(16, 22)}
          <path d="M20 26 34 34" {...stroke} />
          <path d="M34 34l14-6M34 34l6 14" {...stroke} />
          <path d="M40 48l10-4" {...stroke} />
        </>
      )
    case 'hamstring':
      return (
        <>
          {head(16, 40)}
          <path d="M21 40h14" {...stroke} />
          <path d="M35 40 48 18" {...stroke} />
          <path d="M48 18l6 4" {...stroke} />
          <path d="M35 40l4 10" {...stroke} />
        </>
      )
    case 'shoulder':
      return (
        <>
          {head(32, 16)}
          <path d="M32 22v18" {...stroke} />
          <path d="M32 40l-6 12M32 40l6 12" {...stroke} />
          <path d="M16 30a16 16 0 0 1 32 0" {...stroke} strokeWidth={2.5} />
          <path d="M44 24l4 6-6 2" {...stroke} strokeWidth={2.5} />
        </>
      )
    case 'neck':
      return (
        <>
          <circle cx="26" cy="20" r="8" fill="currentColor" />
          <path d="M30 28 34 40" {...stroke} />
          <path d="M20 40h26" {...stroke} />
          <path d="M40 14a10 10 0 0 1 6 8" {...stroke} strokeWidth={2.5} />
        </>
      )
    case 'breathe':
      return (
        <>
          <circle cx="32" cy="32" r="9" fill="currentColor" />
          <path d="M32 12a20 20 0 0 1 0 40" {...stroke} strokeWidth={2.5} opacity={0.7} />
          <path d="M32 6a26 26 0 0 1 0 52" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    case 'balance':
      return (
        <>
          {head(32, 12)}
          <path d="M32 18v16" {...stroke} />
          <path d="M32 34v18" {...stroke} />
          <path d="M32 34l12 8" {...stroke} />
          <path d="M18 24h28" {...stroke} />
        </>
      )
    case 'walk':
      return (
        <>
          {head(30, 12)}
          <path d="M30 18v14" {...stroke} />
          <path d="M30 32l-8 8v10M30 32l9 9 3 11" {...stroke} />
          <path d="M30 22l-8 6M30 22l9 4" {...stroke} />
        </>
      )
    case 'calf':
      return (
        <>
          {head(32, 12)}
          <path d="M32 18v16" {...stroke} />
          <path d="M32 34v12" {...stroke} />
          <path d="M28 46h10l4 6" {...stroke} />
          <path d="M14 52h36" {...stroke} strokeWidth={2} opacity={0.35} />
        </>
      )
    default:
      return (
        <>
          {head(32, 16)}
          <path d="M32 22v16" {...stroke} />
          <path d="M32 38l-7 13M32 38l7 13" {...stroke} />
          <path d="M20 28h24" {...stroke} />
        </>
      )
  }
}

export function ExerciseGlyph({
  glyph,
  className,
  tone = 'accent',
}: {
  glyph: GlyphKey
  className?: string
  tone?: 'accent' | 'muted'
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-2xl',
        tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-[70%] w-[70%]">
        <Figure glyph={glyph} />
      </svg>
    </div>
  )
}
