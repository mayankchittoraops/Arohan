import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flame, Quote as QuoteIcon, Sparkles, Wind } from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { Page, PageHeader, PageSkeleton } from '@/components/Page'
import { estimateSeconds } from '@/data/program'
import { quoteForDate } from '@/data/quotes'
import { useAchievementWatcher } from '@/hooks/useAchievementWatcher'
import { useCoach } from '@/hooks/useCoach'
import { useJourney, useSession } from '@/hooks/useJourney'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { useStats } from '@/hooks/useStats'
import { useToday } from '@/hooks/useToday'
import { formatFriendly, greetingFor } from '@/lib/date'
import { getDaily, historyForDate } from '@/storage/repo'
import { summarise } from '@/storage/session'
import { beginSession } from '../workout/start'
import { useActiveSession } from '../workout/useActiveSession'
import { DailyCheckInSheet } from './DailyCheckInSheet'
import { HabitChecklist } from './HabitChecklist'
import { CheckInRow, ConsistencyCard } from './Insights'
import { OnboardingSheet } from './OnboardingSheet'
import { TodayCard } from './TodayCard'

export function HomePage() {
  const navigate = useNavigate()
  const today = useToday()
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const journey = useJourney(settings, today)
  const resolved = useSession(settings, today)
  const stats = useStats(settings, today)
  const { session: active } = useActiveSession()

  const [checkingIn, setCheckingIn] = useState(false)

  const daily = useLiveQuery(() => getDaily(today), [today])
  const finishedToday = useLiveQuery(() => historyForDate(today), [today])

  const completed = finishedToday ?? []
  const doneToday = completed.length > 0

  const advice = useCoach({
    today,
    scheduledKind: resolved?.template.kind,
    trainedToday: doneToday,
    daily,
    stats,
    journeyDay: journey?.day,
  })

  useAchievementWatcher(stats)

  if (!settings || !journey || !resolved || !advice) return <PageSkeleton />

  const { template, blocks } = resolved
  const isRest = template.kind === 'rest'
  const ringValue = active ? summarise(active).progress : doneToday ? 1 : 0
  const quote = quoteForDate(today)

  const startToday = async () => {
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

  /* The primary action follows the coach's verdict, so the button on screen is
     always the thing that actually makes sense today. */
  const primary: { label: string; run: () => void } = active
    ? { label: 'Resume session', run: () => navigate('/workout/active') }
    : advice.verdict === 'swap' || advice.verdict === 'rest'
      ? {
          label: advice.suggestedRoutine ? 'Open the routine' : 'Open mobility',
          run: () =>
            navigate(advice.suggestedRoutine ? `/mobility/${advice.suggestedRoutine}` : '/mobility'),
        }
      : doneToday
        ? { label: 'Train again', run: () => void startToday() }
        : { label: 'Start workout', run: () => void startToday() }

  const secondary =
    !active && (advice.verdict === 'swap' || advice.verdict === 'rest') && !isRest
      ? { label: 'Do the session anyway', run: () => void startToday() }
      : !active && !doneToday && !isRest && advice.suggestedRoutine
        ? {
            label: 'Mobility instead',
            run: () => navigate(`/mobility/${advice.suggestedRoutine}`),
          }
        : undefined

  return (
    <Page>
      <PageHeader
        title={settings.name ? `${greetingFor()}, ${settings.name}` : greetingFor()}
        subtitle={formatFriendly(today)}
        action={
          <div
            className="flex h-11 items-center gap-1.5 rounded-2xl bg-accent-soft px-3 text-accent"
            title={`${stats?.streak.current ?? 0} day streak`}
          >
            <Flame className="h-4 w-4" />
            <span className="text-label font-bold tabular">{stats?.streak.current ?? 0}</span>
          </div>
        }
      />

      <TodayCard
        advice={advice}
        title={isRest ? 'Rest day' : template.name}
        subtitle={isRest ? 'Recovery is part of the plan' : template.subtitle}
        durationSeconds={isRest ? null : estimateSeconds(blocks)}
        movementCount={isRest ? null : blocks.length}
        ringValue={ringValue}
        dayLabel={`Day ${journey.day} · ${journey.phase.name}`}
        primaryLabel={primary.label}
        onPrimary={primary.run}
        secondaryLabel={secondary?.label}
        onSecondary={secondary?.run}
      />

      {/* Recovery is advice too, and it is the half people skip. */}
      <Card tone="sunken" className="mb-section flex items-start gap-3">
        <Wind className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <p className="text-label leading-relaxed text-muted">{advice.recovery}</p>
      </Card>

      {journey.canUnlockNext && settings.phasePromptDismissedFor !== journey.calendarPhase ? (
        <Card className="mb-section border-accent/30">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <h3 className="text-heading text-ink">Phase {journey.nextPhase.number} is ready</h3>
              <p className="mt-1 text-label leading-relaxed text-muted">
                {journey.nextPhase.name} — {journey.nextPhase.tagline} Only move on if the current
                sessions feel comfortable.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="secondary"
              full
              onClick={() => void updateSettings({ phasePromptDismissedFor: journey.calendarPhase })}
            >
              Not yet
            </Button>
            <Button
              full
              onClick={() =>
                void updateSettings({
                  phase: journey.nextPhase.number,
                  phasePromptDismissedFor: null,
                })
              }
            >
              Unlock it
            </Button>
          </div>
        </Card>
      ) : null}

      <CheckInRow today={today} daily={daily} onOpen={() => setCheckingIn(true)} />

      {stats ? <ConsistencyCard today={today} activeDates={stats.activeDates} /> : null}

      <SectionTitle>Habits</SectionTitle>
      <div className="mb-section">
        <HabitChecklist date={today} />
      </div>

      <Card tone="sunken">
        <QuoteIcon className="h-5 w-5 text-accent" />
        <p className="mt-3 text-heading font-medium leading-relaxed text-ink">{quote.text}</p>
        <p className="mt-2 text-label text-faint">{quote.author}</p>
      </Card>

      <DailyCheckInSheet open={checkingIn} onClose={() => setCheckingIn(false)} date={today} />
      <OnboardingSheet settings={settings} />
    </Page>
  )
}
