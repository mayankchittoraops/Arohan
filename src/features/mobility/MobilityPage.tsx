import { Link } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import { Card } from '@/components/Card'
import { ExerciseGlyph } from '@/components/ExerciseGlyph'
import { Page, PageHeader } from '@/components/Page'
import { MOBILITY_ROUTINES, routineMinutes } from '@/data/mobility'
import { MOBILITY_CATEGORIES } from '@/data/types'
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

/** Why you would open this group, in one line. */
const CATEGORY_BLURB: Record<string, string> = {
  Morning: 'Undo the night and start the day moving well.',
  Office: 'Short enough to fit between meetings, at a desk.',
  Evening: 'Lower the volume before sleep.',
  Recovery: 'For the areas that complain. Safe to repeat.',
}

export function MobilityPage() {
  return (
    <Page>
      <PageHeader
        title="Mobility"
        subtitle="Short routines, grouped by when you need them."
      />

      <Card className="mb-section border-rose/25 bg-rose/8">
        <p className="text-label leading-relaxed text-muted">
          <span className="font-semibold text-rose">On a bad back day</span>, start with Lower Back
          under Recovery. Everything in it is gentle, and doing it twice is better than pushing
          through a workout.
        </p>
      </Card>

      <div className="space-y-section">
        {MOBILITY_CATEGORIES.map((category) => {
          const routines = MOBILITY_ROUTINES.filter((r) => r.category === category)
          if (routines.length === 0) return null

          return (
            <section key={category}>
              <div className="mb-2 px-1">
                <h2 className="text-micro uppercase text-faint">{category}</h2>
                <p className="mt-1 text-caption text-muted">{CATEGORY_BLURB[category]}</p>
              </div>

              <ul className="space-y-2">
                {routines.map((routine) => (
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
                        <p className="text-heading text-ink">{routine.name}</p>
                        <p className="truncate text-label text-muted">{routine.subtitle}</p>
                        <p className="mt-1 flex items-center gap-1 text-caption tabular text-faint">
                          <Clock className="h-3 w-3" />
                          {routineMinutes(routine)} min · {routine.moves.length} stretches
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </Page>
  )
}
