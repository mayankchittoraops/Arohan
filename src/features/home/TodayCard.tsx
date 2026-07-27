import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ProgressRing } from '@/components/ProgressRing'
import { cn } from '@/lib/cn'
import { formatMinutes } from '@/lib/format'
import type { CoachAdvice, Focus } from '@/data/coach'

const FOCUS_STYLES: Record<Focus, string> = {
  Workout: 'bg-accent-soft text-accent',
  Mobility: 'bg-teal/12 text-teal',
  Recovery: 'bg-violet/12 text-violet',
  Rest: 'bg-sunken text-muted',
}

/**
 * The one card the app is really for. It answers, in order: what is today
 * about, how far through am I, and what do I press.
 *
 * Starting the scheduled session is a single tap from a cold open, which is
 * the whole point of putting the primary action here rather than a tab away.
 */
export function TodayCard({
  advice,
  title,
  subtitle,
  durationSeconds,
  movementCount,
  ringValue,
  dayLabel,
  primaryLabel,
  onPrimary,
  onSecondary,
  secondaryLabel,
}: {
  advice: CoachAdvice
  title: string
  subtitle: string
  durationSeconds: number | null
  movementCount: number | null
  ringValue: number
  dayLabel: string
  primaryLabel: string
  onPrimary: () => void
  onSecondary?: () => void
  secondaryLabel?: string
}) {
  const complete = ringValue >= 1

  return (
    <Card className="mb-section">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'rounded-full px-3 py-1.5 text-micro uppercase',
            FOCUS_STYLES[advice.focus],
          )}
        >
          Today · {advice.focus}
        </span>
        <span className="text-caption text-faint">{dayLabel}</span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <ProgressRing
          value={ringValue}
          size={92}
          thickness={9}
          label={`Today ${Math.round(ringValue * 100)} per cent complete`}
        >
          <span className="text-heading tabular text-ink">{Math.round(ringValue * 100)}</span>
          <span className="text-micro text-faint">%</span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <h2 className="text-title text-ink">{title}</h2>
          <p className="mt-0.5 text-label text-muted">{subtitle}</p>
          {durationSeconds != null && movementCount != null ? (
            <p className="mt-1.5 text-caption tabular text-faint">
              {formatMinutes(durationSeconds)} · {movementCount} movements
            </p>
          ) : null}
        </div>
      </div>

      {/* The coach's read on today, above the button that acts on it. */}
      <div
        className={cn(
          'mt-5 rounded-2xl px-4 py-3.5',
          complete ? 'bg-mint/10' : 'bg-sunken',
        )}
      >
        <p className="flex items-start gap-2 text-label font-semibold text-ink">
          <Sparkles className={cn('mt-0.5 h-4 w-4 shrink-0', complete ? 'text-mint' : 'text-accent')} />
          {advice.headline}
        </p>
        <p className="mt-1.5 text-label leading-relaxed text-muted">{advice.detail}</p>
      </div>

      <Button
        className="mt-4"
        full
        size="lg"
        icon={complete ? <ArrowRight className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        variant={complete ? 'secondary' : 'primary'}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>

      {onSecondary && secondaryLabel ? (
        <Button className="mt-2" full variant="ghost" onClick={onSecondary}>
          {secondaryLabel}
        </Button>
      ) : null}
    </Card>
  )
}
