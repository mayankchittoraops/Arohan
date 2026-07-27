import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BatteryMedium,
  Check,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Play,
  Quote as QuoteIcon,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { Page, PageHeader, PageSkeleton } from '@/components/Page'
import { ProgressRing } from '@/components/ProgressRing'
import { StatCard } from '@/components/StatCard'
import { estimateSeconds } from '@/data/program'
import { quoteForDate } from '@/data/quotes'
import { useAchievementWatcher } from '@/hooks/useAchievementWatcher'
import { useJourney, useSession } from '@/hooks/useJourney'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { useStats } from '@/hooks/useStats'
import { useToday } from '@/hooks/useToday'
import { formatFriendly, greetingFor, lastNDays, weekdayInitial } from '@/lib/date'
import { formatMinutes, pluralise } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getDaily, historyForDate } from '@/storage/repo'
import { summarise } from '@/storage/session'
import { beginSession } from '../workout/start'
import { useActiveSession } from '../workout/useActiveSession'
import { DailyCheckInSheet } from './DailyCheckInSheet'
import { HabitChecklist } from './HabitChecklist'
import { OnboardingSheet } from './OnboardingSheet'

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

  useAchievementWatcher(stats)

  if (!settings || !journey || !resolved) return <PageSkeleton />

  const { template, blocks } = resolved
  const isRest = template.kind === 'rest'
  const completed = finishedToday ?? []
  const doneToday = completed.length > 0

  const ringValue = active
    ? summarise(active).progress
    : doneToday
      ? 1
      : 0

  const quote = quoteForDate(today)
  const week = lastNDays(today, 7)

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

  return (
    <Page>
      <PageHeader
        title={settings.name ? `${greetingFor()}, ${settings.name}` : greetingFor()}
        subtitle={formatFriendly(today)}
        action={
          <div className="flex h-11 items-center gap-1.5 rounded-2xl bg-accent-soft px-3 text-accent">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-bold tabular">{stats?.streak.current ?? 0}</span>
          </div>
        }
      />

      {/* ------------------------------------------------ today's session */}
      <Card className="mb-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={ringValue}
            size={104}
            thickness={10}
            label={`Today's session ${Math.round(ringValue * 100)} per cent complete`}
          >
            {doneToday ? (
              <Check className="h-8 w-8 text-mint" strokeWidth={3} />
            ) : (
              <>
                <span className="text-xl font-bold tabular text-ink">
                  {Math.round(ringValue * 100)}
                </span>
                <span className="text-[10px] font-medium text-faint">per cent</span>
              </>
            )}
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-faint">
              Day {journey.day} · {journey.phase.name}
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-ink">
              {isRest ? 'Rest day' : template.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {isRest ? 'Recovery is part of the plan' : template.subtitle}
            </p>
            {!isRest ? (
              <p className="mt-2 text-xs tabular text-faint">
                {formatMinutes(estimateSeconds(blocks))} · {blocks.length} movements
              </p>
            ) : null}
          </div>
        </div>

        {doneToday ? (
          <div className="mt-5 rounded-2xl bg-mint/10 px-4 py-3.5 text-center">
            <p className="text-sm font-semibold text-mint">
              {completed.length === 1
                ? `${completed[0].templateName} done`
                : `${completed.length} sessions done today`}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {formatMinutes(completed.reduce((total, e) => total + e.durationSeconds, 0))} of
              movement
            </p>
          </div>
        ) : null}

        <Button
          className="mt-5"
          full
          size="lg"
          variant={doneToday ? 'secondary' : 'primary'}
          icon={<Play className="h-5 w-5" />}
          onClick={() => {
            if (active) return navigate('/workout/active')
            if (isRest) return navigate('/mobility')
            void startToday()
          }}
        >
          {active
            ? 'Resume session'
            : isRest
              ? 'Open mobility'
              : doneToday
                ? 'Another session'
                : 'Start workout'}
        </Button>
      </Card>

      {/* ------------------------------------------------------ phase gate */}
      {journey.canUnlockNext && settings.phasePromptDismissedFor !== journey.calendarPhase ? (
        <Card className="mb-5 border-accent/30">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">
                Phase {journey.nextPhase.number} is ready
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {journey.nextPhase.name} — {journey.nextPhase.tagline} Only move on if the current
                sessions feel comfortable.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="secondary"
              full
              onClick={() =>
                void updateSettings({ phasePromptDismissedFor: journey.calendarPhase })
              }
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

      {/* ----------------------------------------------------- quick stats */}
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => setCheckingIn(true)}
            className="text-sm font-semibold text-accent"
          >
            Check in
          </button>
        }
      >
        Today
      </SectionTitle>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Sleep"
          tone="violet"
          icon={<Moon className="h-3.5 w-3.5" />}
          value={daily?.sleepHours ?? '—'}
          unit={daily?.sleepHours != null ? 'hrs' : undefined}
          onClick={() => setCheckingIn(true)}
        />
        <StatCard
          label="Steps"
          tone="mint"
          icon={<Footprints className="h-3.5 w-3.5" />}
          value={daily?.steps?.toLocaleString() ?? '—'}
          onClick={() => setCheckingIn(true)}
        />
        <StatCard
          label="Energy"
          tone="amber"
          icon={<BatteryMedium className="h-3.5 w-3.5" />}
          value={daily?.energy ?? '—'}
          unit={daily?.energy != null ? '/ 5' : undefined}
          onClick={() => setCheckingIn(true)}
        />
        <StatCard
          label="Pain"
          tone="rose"
          icon={<HeartPulse className="h-3.5 w-3.5" />}
          value={daily?.pain ?? '—'}
          unit={daily?.pain != null ? '/ 10' : undefined}
          onClick={() => setCheckingIn(true)}
        />
      </div>

      {/* ---------------------------------------------------------- streak */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">
              Current streak
            </p>
            <p className="mt-1 text-3xl font-bold tabular tracking-tight text-ink">
              {stats?.streak.current ?? 0}
              <span className="ml-1.5 text-sm font-medium text-faint">
                {stats?.streak.current === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
          <p className="text-right text-xs leading-relaxed text-faint">
            Longest
            <br />
            <span className="text-base font-semibold tabular text-muted">
              {pluralise(stats?.streak.longest ?? 0, 'day')}
            </span>
          </p>
        </div>

        <div className="mt-4 flex justify-between gap-1.5">
          {week.map((day) => {
            const activeDay = stats?.activeDates.has(day) ?? false
            const isToday = day === today
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition-colors',
                    activeDay
                      ? 'bg-accent text-accent-ink'
                      : isToday
                        ? 'border-2 border-dashed border-line-strong text-faint'
                        : 'bg-sunken text-faint',
                  )}
                >
                  {activeDay ? <Check className="h-4 w-4" strokeWidth={3} /> : ''}
                </div>
                <span className="text-[10px] font-medium text-faint">{weekdayInitial(day)}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ---------------------------------------------------------- habits */}
      <SectionTitle>Habits</SectionTitle>
      <div className="mb-5">
        <HabitChecklist date={today} />
      </div>

      {/* ----------------------------------------------------------- quote */}
      <Card className="bg-sunken">
        <QuoteIcon className="h-5 w-5 text-accent" />
        <p className="mt-3 text-[17px] font-medium leading-relaxed tracking-tight text-ink">
          {quote.text}
        </p>
        <p className="mt-2 text-sm text-faint">{quote.author}</p>
      </Card>

      <DailyCheckInSheet open={checkingIn} onClose={() => setCheckingIn(false)} date={today} />
      <OnboardingSheet settings={settings} />
    </Page>
  )
}
