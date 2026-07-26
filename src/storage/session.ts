import type { PlannedExercise, WorkoutKind } from '@/data/types'
import type { DateKey } from '@/lib/date'
import { uid } from './repo'
import type { ActiveWorkout, ExerciseLog, SessionSource, WorkoutHistoryEntry } from './types'

export interface BuildSessionInput {
  date: DateKey
  source: SessionSource
  templateId: string
  templateName: string
  templateSubtitle: string
  kind: WorkoutKind | 'mobility'
  blocks: PlannedExercise[]
  painBefore?: number | null
}

function emptyLog(block: PlannedExercise): ExerciseLog {
  return {
    exerciseId: block.exerciseId,
    section: block.section,
    plannedSets: block.sets,
    plannedReps: block.reps,
    plannedSeconds: block.seconds,
    restSeconds: block.restSeconds,
    coachNote: block.note,
    skipped: false,
    sets: Array.from({ length: block.sets }, () => ({
      done: false,
      ...(block.reps != null ? { reps: block.reps } : {}),
      ...(block.seconds != null ? { seconds: block.seconds } : {}),
    })),
  }
}

export function buildSession(input: BuildSessionInput): ActiveWorkout {
  const now = Date.now()
  return {
    id: uid(),
    date: input.date,
    source: input.source,
    templateId: input.templateId,
    templateName: input.templateName,
    templateSubtitle: input.templateSubtitle,
    kind: input.kind,
    startedAt: now,
    updatedAt: now,
    currentIndex: 0,
    elapsedSeconds: 0,
    runningSince: now,
    logs: input.blocks.map(emptyLog),
    painBefore: input.painBefore ?? null,
  }
}

export interface SessionSummary {
  completedSets: number
  plannedSets: number
  totalReps: number
  volumeKg: number
  completedExercises: number
  /** 0–1 across every planned set. */
  progress: number
}

export function summarise(session: ActiveWorkout): SessionSummary {
  let completedSets = 0
  let plannedSets = 0
  let totalReps = 0
  let volumeKg = 0
  let completedExercises = 0

  for (const log of session.logs) {
    plannedSets += log.plannedSets
    if (log.skipped) continue

    let doneInLog = 0
    for (const set of log.sets) {
      if (!set.done) continue
      doneInLog++
      completedSets++
      totalReps += set.reps ?? 0
      if (set.weightKg && set.reps) volumeKg += set.weightKg * set.reps
    }
    if (doneInLog >= log.plannedSets) completedExercises++
  }

  return {
    completedSets,
    plannedSets,
    totalReps,
    volumeKg,
    completedExercises,
    progress: plannedSets === 0 ? 0 : completedSets / plannedSets,
  }
}

/** Live elapsed seconds, including the stretch since the clock last resumed. */
export function elapsedOf(session: ActiveWorkout, now = Date.now()): number {
  const running = session.runningSince ? Math.max(0, (now - session.runningSince) / 1000) : 0
  return Math.round(session.elapsedSeconds + running)
}

export function pauseSession(session: ActiveWorkout, now = Date.now()): ActiveWorkout {
  if (!session.runningSince) return session
  return {
    ...session,
    elapsedSeconds: elapsedOf(session, now),
    runningSince: null,
  }
}

export function resumeSession(session: ActiveWorkout, now = Date.now()): ActiveWorkout {
  if (session.runningSince) return session
  return { ...session, runningSince: now }
}

export interface FinishInput {
  rpe?: number | null
  painAfter?: number | null
  note?: string
}

export function toHistoryEntry(
  session: ActiveWorkout,
  finish: FinishInput = {},
  now = Date.now(),
): WorkoutHistoryEntry {
  const summary = summarise(session)
  return {
    id: session.id,
    date: session.date,
    source: session.source,
    templateId: session.templateId,
    templateName: session.templateName,
    templateSubtitle: session.templateSubtitle,
    kind: session.kind,
    startedAt: session.startedAt,
    finishedAt: now,
    durationSeconds: elapsedOf(session, now),
    logs: session.logs,
    completedSets: summary.completedSets,
    plannedSets: summary.plannedSets,
    totalReps: summary.totalReps,
    volumeKg: summary.volumeKg,
    rpe: finish.rpe ?? null,
    painBefore: session.painBefore,
    painAfter: finish.painAfter ?? null,
    note: finish.note ?? '',
  }
}
