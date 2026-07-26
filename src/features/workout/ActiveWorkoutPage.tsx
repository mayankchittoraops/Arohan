import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { Button, IconButton } from '@/components/Button'
import { ConfirmDialog } from '@/components/Feedback'
import { ProgressBar } from '@/components/ProgressRing'
import { requireExercise } from '@/data/exercises'
import { useCountdown, useTicker } from '@/hooks/useTimer'
import { useFeedback } from '@/hooks/useFeedback'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/useToast'
import { useWakeLock } from '@/hooks/useWakeLock'
import { formatDuration } from '@/lib/format'
import { discardActiveSession, finishSession, saveDaily, setHabit } from '@/storage/repo'
import { elapsedOf, pauseSession, resumeSession, summarise, toHistoryEntry } from '@/storage/session'
import { ExerciseRunner } from './ExerciseRunner'
import { FinishSheet, type FinishValues } from './FinishSheet'
import { RestTimer } from './RestTimer'
import { useActiveSession } from './useActiveSession'

export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const { show } = useToast()
  const { session, loading, mutate, updateLog, updateSet } = useActiveSession()

  const [holdingSet, setHoldingSet] = useState<number | null>(null)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [saving, setSaving] = useState(false)

  const cue = useFeedback({
    sound: settings?.soundEnabled ?? true,
    haptics: settings?.hapticsEnabled ?? true,
  })

  const running = Boolean(session?.runningSince)
  useWakeLock(running)
  const now = useTicker(1000, running)

  const rest = useCountdown(() => cue('complete'))
  const hold = useCountdown(() => {
    cue('complete')
    setHoldingSet(null)
  })

  const index = session?.currentIndex ?? 0
  const log = session?.logs[index]
  const summary = useMemo(() => (session ? summarise(session) : null), [session])
  const elapsed = session ? elapsedOf(session, now) : 0

  // A session that was finished or discarded in another tab should not strand us.
  useEffect(() => {
    if (!loading && !session) navigate('/workout', { replace: true })
  }, [loading, session, navigate])

  const startRest = useCallback(
    (seconds: number) => {
      if (seconds > 0) {
        rest.start(seconds)
        cue('start')
      }
    },
    [rest, cue],
  )

  const goTo = useCallback(
    (next: number) => {
      void mutate((current) => ({
        ...current,
        currentIndex: Math.min(Math.max(0, next), current.logs.length - 1),
      }))
      hold.stop()
      setHoldingSet(null)
    },
    [mutate, hold],
  )

  const toggleSet = useCallback(
    (setIndex: number) => {
      if (!session || !log) return

      const wasDone = log.sets[setIndex]?.done ?? false
      const isLastSet = setIndex === log.sets.length - 1
      const isLastExercise = index === session.logs.length - 1
      // Moving on automatically is part of the same write, so the tick and the
      // index change cannot overwrite one another.
      const advance = !wasDone && isLastSet && !isLastExercise

      void mutate((current) => ({
        ...current,
        currentIndex: advance ? index + 1 : current.currentIndex,
        logs: current.logs.map((entry, i) =>
          i === index
            ? {
                ...entry,
                sets: entry.sets.map((set, j) =>
                  j === setIndex ? { ...set, done: !wasDone } : set,
                ),
              }
            : entry,
        ),
      }))

      if (wasDone) return
      cue('tick')
      if (!(isLastSet && isLastExercise)) startRest(log.restSeconds)
    },
    [session, log, index, mutate, cue, startRest],
  )

  const startHold = useCallback(
    (setIndex: number) => {
      const seconds = log?.sets[setIndex]?.seconds ?? 30
      setHoldingSet(setIndex)
      hold.start(seconds)
      cue('start')
    },
    [log, hold, cue],
  )

  // Marking the set done is a side effect of the hold reaching zero.
  useEffect(() => {
    if (holdingSet == null || hold.isActive) return
    const setIndex = holdingSet
    setHoldingSet(null)
    toggleSet(setIndex)
    // toggleSet is stable enough here; re-running on every render would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold.isActive])

  const togglePause = useCallback(() => {
    void mutate((current) => (current.runningSince ? pauseSession(current) : resumeSession(current)))
  }, [mutate])

  const handleFinish = useCallback(
    async (values: FinishValues) => {
      if (!session) return
      setSaving(true)
      try {
        const entry = toHistoryEntry(pauseSession(session), values)
        await finishSession(entry)
        await setHabit(session.date, session.source === 'mobility' ? 'mobility' : 'workout', true)
        if (values.painAfter != null) await saveDaily(session.date, { pain: values.painAfter })
        show('Session saved. Well done.', 'success')
        navigate('/', { replace: true })
      } finally {
        setSaving(false)
      }
    },
    [session, navigate, show],
  )

  const discard = useCallback(async () => {
    await discardActiveSession()
    setConfirmQuit(false)
    navigate('/workout', { replace: true })
  }, [navigate])

  if (!session || !log || !summary) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-faint">
        Loading session…
      </div>
    )
  }

  const exercise = requireExercise(log.exerciseId)
  const showWeight = Boolean(exercise.loadable) && (settings?.equipment.includes('dumbbell') ?? false)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-40 pt-safe">
      <header className="flex items-center gap-2 pt-4">
        <IconButton label="Leave session" onClick={() => setConfirmQuit(true)}>
          <X className="h-5 w-5" />
        </IconButton>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-ink">{session.templateName}</p>
          <p className="text-xs tabular text-faint">{formatDuration(elapsed)}</p>
        </div>
        <IconButton label={running ? 'Pause session' : 'Resume session'} onClick={togglePause}>
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </IconButton>
      </header>

      <div className="py-4">
        <ProgressBar value={summary.progress} tone="accent" />
        <p className="mt-2 text-center text-xs tabular text-faint">
          {summary.completedSets} of {summary.plannedSets} sets
        </p>
      </div>

      <AnimatePresence mode="wait">
        <ExerciseRunner
          key={index}
          log={log}
          index={index}
          total={session.logs.length}
          showWeight={showWeight}
          holdingSet={holdingSet}
          holdRemaining={hold.remaining}
          onSetChange={(setIndex, patch) => void updateSet(index, setIndex, patch)}
          onToggleSet={toggleSet}
          onStartHold={startHold}
          onStopHold={() => {
            hold.stop()
            setHoldingSet(null)
          }}
          onNote={(note) => void updateLog(index, (current) => ({ ...current, note }))}
          onSkip={() =>
            void updateLog(index, (current) => ({ ...current, skipped: !current.skipped }))
          }
        />
      </AnimatePresence>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="secondary"
          size="lg"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          icon={<ChevronLeft className="h-5 w-5" />}
          className="px-4"
        >
          Back
        </Button>
        {index === session.logs.length - 1 ? (
          <Button size="lg" full onClick={() => setFinishing(true)}>
            Finish session
          </Button>
        ) : (
          <Button
            size="lg"
            full
            onClick={() => goTo(index + 1)}
            icon={<ChevronRight className="order-2 h-5 w-5" />}
          >
            Next
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setFinishing(true)}
        className="mx-auto mt-5 text-sm font-medium text-faint underline underline-offset-4"
      >
        Finish early
      </button>

      <AnimatePresence>
        {rest.isActive ? (
          <RestTimer
            remaining={rest.remaining}
            total={rest.total}
            onSkip={rest.stop}
            onAdd={() => rest.adjust(15)}
          />
        ) : null}
      </AnimatePresence>

      <FinishSheet
        open={finishing}
        onClose={() => setFinishing(false)}
        onSave={(values) => void handleFinish(values)}
        summary={summary}
        elapsedSeconds={elapsed}
        saving={saving}
      />

      <ConfirmDialog
        open={confirmQuit}
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => void discard()}
        title="Leave this session?"
        description="Everything logged so far will be discarded. If you would rather keep it, close this and use Finish early instead."
        confirmLabel="Discard"
        destructive
      />
    </div>
  )
}
