import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Play } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { Page } from '@/components/Page'
import { getRoutine } from '@/data/mobility'
import { useToday } from '@/hooks/useToday'
import { pluralise } from '@/lib/format'
import { SessionPlan } from '../workout/SessionPlan'
import { beginSession } from '../workout/start'

export function MobilityRoutinePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const today = useToday()
  const routine = id ? getRoutine(id) : undefined

  if (!routine) return <Navigate to="/mobility" replace />

  const start = async () => {
    await beginSession({
      date: today,
      source: 'mobility',
      templateId: routine.id,
      templateName: routine.name,
      templateSubtitle: routine.subtitle,
      kind: 'mobility',
      blocks: routine.moves,
    })
    navigate('/workout/active')
  }

  return (
    <Page>
      <div className="pt-6">
        <button
          type="button"
          onClick={() => navigate('/mobility')}
          className="-ml-2 flex h-11 items-center gap-1 rounded-2xl px-2 text-sm font-semibold text-muted active:bg-sunken"
        >
          <ChevronLeft className="h-5 w-5" />
          Mobility
        </button>
      </div>

      <header className="px-1 pb-6 pt-3">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">
          {routine.name}
        </h1>
        <p className="mt-1 text-[15px] text-muted">{routine.subtitle}</p>
      </header>

      <Card className="mb-5">
        <p className="text-[15px] leading-relaxed text-muted">{routine.intent}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-sunken p-4 text-center">
          <div>
            <dt className="text-xs text-faint">Time</dt>
            <dd className="text-lg font-semibold tabular text-ink">{routine.minutes} min</dd>
          </div>
          <div>
            <dt className="text-xs text-faint">Moves</dt>
            <dd className="text-lg font-semibold tabular text-ink">{routine.moves.length}</dd>
          </div>
        </dl>
        <Button
          className="mt-5"
          full
          size="lg"
          icon={<Play className="h-5 w-5" />}
          onClick={() => void start()}
        >
          Start routine
        </Button>
      </Card>

      <SectionTitle>{pluralise(routine.moves.length, 'movement')}</SectionTitle>
      <SessionPlan blocks={routine.moves} />
    </Page>
  )
}
