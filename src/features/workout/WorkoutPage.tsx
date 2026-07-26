import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Moon, Play, Repeat, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { Page, PageHeader, PageSkeleton } from '@/components/Page'
import { Sheet } from '@/components/Sheet'
import { ALL_TEMPLATES, estimateSeconds, mainSetCount, resolveSession } from '@/data/program'
import { useSession } from '@/hooks/useJourney'
import { useSettings } from '@/hooks/useSettings'
import { useToday } from '@/hooks/useToday'
import { formatFriendly } from '@/lib/date'
import { formatMinutes, pluralise } from '@/lib/format'
import { SessionPlan } from './SessionPlan'
import { beginSession } from './start'
import { useActiveSession } from './useActiveSession'

export function WorkoutPage() {
  const navigate = useNavigate()
  const today = useToday()
  const settings = useSettings()
  const { session: active } = useActiveSession()

  const [override, setOverride] = useState<string | undefined>()
  const [picking, setPicking] = useState(false)

  const resolved = useSession(settings, today, override)

  const alternatives = useMemo(() => {
    if (!settings) return []
    return ALL_TEMPLATES.filter((t) => t.id !== 'rest' && t.phase <= settings.phase)
  }, [settings])

  if (!settings || !resolved) return <PageSkeleton />

  const { template, blocks, dropped, progression } = resolved
  const isRest = template.kind === 'rest'
  const duration = estimateSeconds(blocks)

  const start = async () => {
    await beginSession({
      date: today,
      source: 'program',
      templateId: template.id,
      templateName: template.name,
      templateSubtitle: template.subtitle,
      kind: template.kind,
      blocks,
    })
    navigate('/workout/active')
  }

  return (
    <Page>
      <PageHeader
        title={isRest ? 'Rest day' : template.name}
        subtitle={formatFriendly(today)}
        action={
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex h-11 items-center gap-1.5 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold text-muted active:scale-95"
          >
            <Repeat className="h-4 w-4" />
            Change
          </button>
        }
      />

      {active ? (
        <Card className="mb-5 border-accent/30 bg-accent-soft">
          <p className="text-sm font-semibold text-accent">Session in progress</p>
          <p className="mt-1 text-[15px] leading-snug text-ink">
            {active.templateName} · {active.templateSubtitle}
          </p>
          <Button
            className="mt-4"
            full
            size="lg"
            onClick={() => navigate('/workout/active')}
            icon={<Play className="h-5 w-5" />}
          >
            Resume session
          </Button>
        </Card>
      ) : null}

      {isRest ? (
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-violet">
            <Moon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Nothing scheduled today</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
            {template.intent} If you feel like moving, a mobility routine is a good use of ten
            minutes.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" full onClick={() => navigate('/mobility')}>
              Open mobility
            </Button>
            <Button variant="secondary" full onClick={() => setPicking(true)}>
              Pick a session
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-5">
            <p className="text-sm font-medium text-accent">{template.subtitle}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{template.intent}</p>

            <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-sunken p-4 text-center">
              <div>
                <dt className="text-xs text-faint">Time</dt>
                <dd className="text-lg font-semibold tabular text-ink">
                  {formatMinutes(duration)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Sets</dt>
                <dd className="text-lg font-semibold tabular text-ink">{mainSetCount(blocks)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Week</dt>
                <dd className="text-lg font-semibold tabular text-ink">{progression.week + 1}</dd>
              </div>
            </dl>

            {progression.deload ? (
              <p className="mt-4 rounded-2xl bg-teal/10 px-4 py-3 text-sm leading-relaxed text-teal">
                This is a lighter week by design. One set fewer on everything — let the last three
                weeks catch up with you.
              </p>
            ) : null}

            {dropped.length > 0 ? (
              <p className="mt-4 flex gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-sm leading-relaxed text-amber">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Skipped for want of equipment: {dropped.join(', ')}. Update what you own in
                  Settings.
                </span>
              </p>
            ) : null}

            <Button
              className="mt-5"
              full
              size="lg"
              onClick={() => void start()}
              icon={<Play className="h-5 w-5" />}
            >
              {active ? 'Start over' : 'Start workout'}
            </Button>
          </Card>

          <SectionTitle>{pluralise(blocks.length, 'movement')}</SectionTitle>
          <SessionPlan blocks={blocks} />
        </>
      )}

      <Sheet
        open={picking}
        onClose={() => setPicking(false)}
        title="Choose a session"
        description="Anything unlocked in your current phase. Today's plan comes back tomorrow."
      >
        <ul className="space-y-2">
          {alternatives.map((option) => {
            const preview = resolveSession(today, {
              startDate: settings.startDate,
              phase: settings.phase,
              equipment: settings.equipment,
              templateId: option.id,
            })
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOverride(option.id)
                    setPicking(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{option.name}</p>
                    <p className="truncate text-sm text-muted">{option.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-sm tabular text-faint">
                    {formatMinutes(estimateSeconds(preview.blocks))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {override ? (
          <Button
            variant="ghost"
            full
            className="mt-4"
            icon={<CalendarDays className="h-4 w-4" />}
            onClick={() => {
              setOverride(undefined)
              setPicking(false)
            }}
          >
            Back to today's plan
          </Button>
        ) : null}
      </Sheet>
    </Page>
  )
}
