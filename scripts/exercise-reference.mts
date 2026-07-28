/**
 * Generates docs/EXERCISE_REFERENCE.md from the live content modules.
 *
 * The point is that it is generated: the app's exercise library, programme
 * templates and mobility routines are the source, so the reference cannot drift
 * from what the app actually prescribes. Re-run it after changing content:
 *
 *   npx vite-node scripts/exercise-reference.mts
 */
import { writeFileSync } from 'node:fs'
import { EXERCISES, requireExercise } from '../src/data/exercises'
import { ALL_TEMPLATES as TEMPLATES, EQUIPMENT_LABELS, PHASES } from '../src/data/program'
import { MOBILITY_ROUTINES, routineMinutes } from '../src/data/mobility'
import type { Equipment, Exercise, PlannedExercise } from '../src/data/types'

/** The app's own labels, so this page reads the same as the Settings screen. */
const kitOf = (equipment: Equipment[]) => equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')

const MUSCLE_LABEL: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  fullBody: 'Full body',
  mobility: 'Mobility',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  developing: 'Developing',
  advanced: 'Advanced',
}

/** A YouTube search that lands on form tutorials rather than workout montages. */
function searchUrl(exercise: Exercise): string {
  const terms = `${exercise.name} exercise proper form technique tutorial`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(terms)}`
}

function target(move: PlannedExercise): string {
  const exercise = requireExercise(move.exerciseId)
  const perSide = exercise.kind === 'repsPerSide' || exercise.kind === 'timePerSide'
  const amount = move.seconds != null ? `${move.seconds}s` : `${move.reps} reps`
  return `${move.sets} × ${amount}${perSide ? ' per side' : ''}`
}

/* Where each movement is used, so you can see what to prioritise. */
const usage = new Map<string, string[]>()
const note = (id: string, where: string) => {
  const list = usage.get(id) ?? []
  if (!list.includes(where)) list.push(where)
  usage.set(id, list)
}
for (const template of TEMPLATES) {
  for (const block of template.blocks) note(block.exerciseId, template.name)
}
for (const routine of MOBILITY_ROUTINES) {
  for (const move of routine.moves) note(move.exerciseId, `${routine.name} (mobility)`)
}

const out: string[] = []
const w = (line = '') => out.push(line)

w('# Arohan — Exercise Reference')
w()
w('Every movement the app can prescribe, with a YouTube search link for each so you can')
w('watch the form once and build a playlist. Generated from the app itself by')
w('`scripts/exercise-reference.mts`, so it cannot drift from what Arohan actually asks of you.')
w()
w(`**${EXERCISES.length} movements** · **${TEMPLATES.length} workout templates** across 4 phases ·`)
w(`**${MOBILITY_ROUTINES.length} mobility routines**`)
w()
w('> The search links are searches, not specific videos — a link to one channel rots, a')
w('> search does not. Pick a video where the coach explains the setup and shows a side angle.')
w()
w('---')
w()
w('## How to use this')
w()
w('Do not try to watch all 83. Phase 1 is the only thing you will touch for three months, and')
w('**[Start here](#start-here)** lists exactly what it uses — ordered by how often each')
w('movement actually comes up, so the top of that list is where the value is. The first dozen')
w('cover most of what you will do in a given week.')
w()
w('---')
w()

/* ---------------------------------------------------------- start here */

const phase1 = TEMPLATES.filter((t) => t.phase === 1)
const phase1Count = new Map<string, number>()
for (const template of phase1) {
  for (const id of new Set(template.blocks.map((b) => b.exerciseId))) {
    phase1Count.set(id, (phase1Count.get(id) ?? 0) + 1)
  }
}
const phase1Ids = [...phase1Count.keys()].toSorted(
  (a, b) => (phase1Count.get(b) ?? 0) - (phase1Count.get(a) ?? 0),
)

w('## Start here')
w()
w(`The **${phase1Ids.length} movements** Phase 1 uses across its ${phase1.length} sessions (days 1–90).`)
w('Ordered by how many of those sessions include them — work down from the top and you can')
w('stop whenever you like, having covered the most ground.')
w()
w('| # | Movement | Equipment | In how many Phase 1 sessions | Watch |')
w('| --- | --- | --- | --- | --- |')
phase1Ids.forEach((id, index) => {
  const exercise = requireExercise(id)
  const count = phase1Count.get(id) ?? 0
  w(
    `| ${index + 1} | **${exercise.name}** | ${kitOf(exercise.equipment)} | ${count} of ${phase1.length} | [Search](${searchUrl(exercise)}) |`,
  )
})
w()
w('Then add the mobility routines you will use daily — **Morning** and **Lower Back** are the')
w('two that matter most. Their movements are listed under [Mobility routines](#mobility-routines).')
w()
w('---')
w()

/* ----------------------------------------------------- full library */

w('## The full library')
w()
w('Grouped by what each movement chiefly trains. **Difficulty** is how demanding the movement')
w('is to perform well, independent of how much weight is on it.')
w()

const GROUP_ORDER = ['mobility', 'core', 'legs', 'glutes', 'chest', 'back', 'shoulders', 'arms', 'fullBody']
const seen = new Set<string>()

for (const group of GROUP_ORDER) {
  const inGroup = EXERCISES.filter((e) => e.primary[0] === group && !seen.has(e.id))
  if (inGroup.length === 0) continue
  for (const e of inGroup) seen.add(e.id)

  w(`### ${MUSCLE_LABEL[group] ?? group}`)
  w()
  w('| Movement | Equipment | Difficulty | Used in | Watch |')
  w('| --- | --- | --- | --- | --- |')
  for (const exercise of inGroup) {
    const kit = kitOf(exercise.equipment)
    const where = usage.get(exercise.id) ?? []
    const used = where.length === 0 ? '—' : where.length > 2 ? `${where.length} sessions` : where.join(', ')
    w(
      `| **${exercise.name}**<br/>${exercise.summary} | ${kit} | ${DIFFICULTY_LABEL[exercise.difficulty]} | ${used} | [Search](${searchUrl(exercise)}) |`,
    )
  }
  w()
}

const leftovers = EXERCISES.filter((e) => !seen.has(e.id))
if (leftovers.length > 0) {
  w('### Other')
  w()
  w('| Movement | Equipment | Difficulty | Watch |')
  w('| --- | --- | --- | --- |')
  for (const exercise of leftovers) {
    const kit = kitOf(exercise.equipment)
    w(`| **${exercise.name}** | ${kit} | ${DIFFICULTY_LABEL[exercise.difficulty]} | [Search](${searchUrl(exercise)}) |`)
  }
  w()
}

w('---')
w()

/* ------------------------------------------------------- the programme */

w('## The programme')
w()
w('Four phases over twelve months. Each phase repeats its sessions weekly, with volume')
w('climbing three weeks on and one week down. **Phases never advance without asking you.**')
w()

for (const phase of PHASES) {
  const kit = kitOf(phase.equipment)
  w(`### Phase ${phase.number} — ${phase.name}`)
  w()
  w(`*${phase.tagline}*`)
  w()
  w(`**Days ${phase.startDay}–${phase.endDay}** · Assumes: ${kit}`)
  w()
  w(`Focus: ${phase.focus.join(' · ')}`)
  w()

  for (const template of TEMPLATES.filter((t) => t.phase === phase.number)) {
    w(`#### ${template.name} — ${template.subtitle}`)
    w()

    // A rest day is a real entry in the plan with nothing to perform.
    if (template.blocks.length === 0) {
      w(`${template.intent}`)
      w()
      w('Nothing to watch — that is the point.')
      w()
      continue
    }

    w(`${template.intent} · about ${template.estimatedMinutes} minutes`)
    w()
    w('| Section | Movement | Target | Rest | Watch |')
    w('| --- | --- | --- | --- | --- |')
    for (const block of template.blocks) {
      const exercise = requireExercise(block.exerciseId)
      const section = block.section === 'warmup' ? 'Warm-up' : block.section === 'cooldown' ? 'Cool-down' : 'Main'
      w(
        `| ${section} | **${exercise.name}** | ${target(block)} | ${block.restSeconds}s | [Search](${searchUrl(exercise)}) |`,
      )
    }
    w()
  }
}

w('---')
w()

/* -------------------------------------------------- mobility routines */

w('## Mobility routines')
w()
w('Eight routines in four groups. Durations are derived from the movements themselves, so')
w('what it says is what it takes.')
w()

for (const category of ['Morning', 'Office', 'Evening', 'Recovery'] as const) {
  const routines = MOBILITY_ROUTINES.filter((r) => r.category === category)
  if (routines.length === 0) continue

  w(`### ${category}`)
  w()
  for (const routine of routines) {
    w(`#### ${routine.name} — ${routine.subtitle}`)
    w()
    w(`${routine.intent}`)
    w()
    w(`**${routineMinutes(routine)} min · ${routine.moves.length} stretches**`)
    w()
    w('| Movement | Hold | Watch |')
    w('| --- | --- | --- |')
    for (const move of routine.moves) {
      const exercise = requireExercise(move.exerciseId)
      w(`| **${exercise.name}** | ${target(move)} | [Search](${searchUrl(exercise)}) |`)
    }
    w()
  }
}

w('---')
w()
w('## A note on form')
w()
w('The whole programme is built around a lower back that complains, so two things are worth')
w('more attention than the rest:')
w()
w('- **The hip hinge.** Deadlifts, good mornings, hip hinges and kettlebell-style patterns all')
w('  depend on it. Watching one good hinge tutorial pays for itself across a dozen movements.')
w('- **Bracing, not crunching.** Planks, bird dogs, dead bugs and Pallof presses train the')
w('  trunk to resist movement. If a video has you curling the spine under load, it is teaching')
w('  something this programme deliberately avoids.')
w()
w('Every movement in the app carries an easier and a harder variation on its own screen. If a')
w('video shows a version that feels wrong today, the easier one is one tap away.')
w()

const page = `${out.join('\n')}\n`

/* A movement that exists but never reaches the page is the failure mode this
   whole script is meant to prevent. */
const missing = EXERCISES.filter((e) => !page.includes(`**${e.name}**`))
if (missing.length > 0) {
  throw new Error(`Not written to the page: ${missing.map((e) => e.name).join(', ')}`)
}

writeFileSync('docs/EXERCISE_REFERENCE.md', page)
console.log(
  `Wrote docs/EXERCISE_REFERENCE.md — ${EXERCISES.length} movements, ${TEMPLATES.length} templates, ${MOBILITY_ROUTINES.length} routines`,
)
