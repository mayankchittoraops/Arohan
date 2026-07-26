import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, History, Trash2 } from 'lucide-react'
import { Card } from '@/components/Card'
import { ConfirmDialog, EmptyState } from '@/components/Feedback'
import { requireExercise } from '@/data/exercises'
import { cn } from '@/lib/cn'
import { formatRelative, type DateKey } from '@/lib/date'
import { formatMinutes } from '@/lib/format'
import { db } from '@/storage/db'
import { deleteHistoryEntry } from '@/storage/repo'
import type { WorkoutHistoryEntry } from '@/storage/types'

function EntryDetail({ entry }: { entry: WorkoutHistoryEntry }) {
  const logged = entry.logs.filter((log) => log.sets.some((set) => set.done))

  return (
    <div className="space-y-3 border-t border-line px-4 py-4">
      <dl className="grid grid-cols-4 gap-2 text-center">
        {[
          ['Time', formatMinutes(entry.durationSeconds)],
          ['Sets', `${entry.completedSets}/${entry.plannedSets}`],
          ['Reps', String(entry.totalReps)],
          ['Effort', entry.rpe ? `${entry.rpe}/10` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-sunken py-2">
            <dt className="text-[11px] text-faint">{label}</dt>
            <dd className="text-sm font-semibold tabular text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {entry.painBefore != null || entry.painAfter != null ? (
        <p className="text-sm text-muted">
          Back pain{' '}
          {entry.painBefore != null ? (
            <>
              <span className="font-semibold text-ink">{entry.painBefore}</span> before
            </>
          ) : null}
          {entry.painBefore != null && entry.painAfter != null ? ', ' : null}
          {entry.painAfter != null ? (
            <>
              <span className="font-semibold text-ink">{entry.painAfter}</span> after
            </>
          ) : null}
        </p>
      ) : null}

      {entry.note ? (
        <p className="rounded-xl bg-sunken px-3 py-2 text-sm italic leading-relaxed text-muted">
          “{entry.note}”
        </p>
      ) : null}

      <ul className="space-y-1.5">
        {logged.map((log, i) => {
          const exercise = requireExercise(log.exerciseId)
          const done = log.sets.filter((set) => set.done)
          const detail = done
            .map((set) => (set.seconds != null ? `${set.seconds}s` : `${set.reps ?? 0}`))
            .join(' · ')
          return (
            <li key={`${log.exerciseId}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-muted">{exercise.name}</span>
              <span className="shrink-0 tabular text-faint">{detail}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function HistoryTab({ today }: { today: DateKey }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const entries = useLiveQuery(async () => {
    const all = await db.workout_history.toArray()
    return all.toSorted((a, b) => b.finishedAt - a.finishedAt)
  }, [])

  if (!entries) return null

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="No sessions logged yet"
        description="Every workout and mobility routine you finish lands here, oldest at the bottom."
      />
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const open = expanded === entry.id
          return (
            <li key={entry.id}>
              <Card className="overflow-hidden p-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : entry.id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-sunken"
                >
                  <span
                    className={cn(
                      'h-10 w-1 shrink-0 rounded-full',
                      entry.source === 'mobility' ? 'bg-teal' : 'bg-accent',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{entry.templateName}</span>
                    <span className="block text-xs text-faint">
                      {formatRelative(entry.date, today)} · {formatMinutes(entry.durationSeconds)} ·{' '}
                      {entry.completedSets} sets
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 shrink-0 text-faint transition-transform',
                      open && 'rotate-180',
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <EntryDetail entry={entry} />
                      <div className="border-t border-line px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(entry.id)}
                          className="flex items-center gap-2 text-sm font-medium text-rose"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete this session
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Card>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete != null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void deleteHistoryEntry(pendingDelete)
          setPendingDelete(null)
        }}
        title="Delete this session?"
        description="It will be removed from your history and your totals. This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </>
  )
}
