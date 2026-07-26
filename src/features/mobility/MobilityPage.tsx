import { Link } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import { Card } from '@/components/Card'
import { ExerciseGlyph } from '@/components/ExerciseGlyph'
import { Page, PageHeader } from '@/components/Page'
import { MOBILITY_ROUTINES } from '@/data/mobility'
import { cn } from '@/lib/cn'

const ACCENT_BG: Record<string, string> = {
  accent: 'bg-accent-soft text-accent',
  teal: 'bg-teal/12 text-teal',
  mint: 'bg-mint/12 text-mint',
  sky: 'bg-sky/12 text-sky',
  violet: 'bg-violet/12 text-violet',
  amber: 'bg-amber/12 text-amber',
  rose: 'bg-rose/12 text-rose',
  indigo: 'bg-indigo/12 text-indigo',
}

export function MobilityPage() {
  return (
    <Page>
      <PageHeader
        title="Mobility"
        subtitle="Short routines you can reach for by symptom or by time of day."
      />

      <Card className="mb-5 border-rose/25 bg-rose/8">
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-rose">On a bad back day</span>, start with Lower Back.
          Everything in it is gentle, and doing it twice is better than pushing through a workout.
        </p>
      </Card>

      <ul className="space-y-2">
        {MOBILITY_ROUTINES.map((routine) => (
          <li key={routine.id}>
            <Link
              to={`/mobility/${routine.id}`}
              className="flex items-center gap-4 rounded-xl2 border border-line bg-surface p-4 transition-transform active:scale-[0.99]"
            >
              <ExerciseGlyph
                glyph={routine.glyph}
                className={cn('h-14 w-14', ACCENT_BG[routine.accent])}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-tight text-ink">{routine.name}</p>
                <p className="truncate text-sm text-muted">{routine.subtitle}</p>
                <p className="mt-1 flex items-center gap-1 text-xs tabular text-faint">
                  <Clock className="h-3 w-3" />
                  {routine.minutes} min · {routine.moves.length} moves
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
