# Changelog

## Version 1.0 Beta — Reliability and Health Tracking

The final sprint before daily use. The goal was not more features; it was making the
app reliable enough to open every morning for a year without thinking about it.
User-facing highlights are in the [Release Notes](docs/RELEASE_NOTES.md); this is the
engineering record.

### A test suite, at last

128 tests across 9 files, Vitest in a Node environment, running in about a second.
This was the top item on the Phase 3 roadmap and the largest standing risk in the
codebase: every bug across the first two phases was caught by driving a real browser,
which is slower and less reliable than an assertion.

| File | Tests | Covers |
| --- | --- | --- |
| `lib/date.test.ts` | 14 | Local keys, DST in both directions, leap days, ranges |
| `data/coach.test.ts` | 20 | All ten rules, ordering, determinism, encouragement |
| `data/program.test.ts` | 19 | Phases, templates, progression, substitution chains |
| `data/mobility.test.ts` | 14 | Content, derived durations, sequencing, equipment |
| `storage/stats.test.ts` | 17 | Streaks, personal bests, weekly summaries, pain runs |
| `storage/session.test.ts` | 15 | Start, tick, advance, pause, resume, finish |
| `storage/trends.test.ts` | 15 | Direction, noise floors, asymmetry |
| `storage/migration.test.ts` | 3 | v1 → v2 upgrade; a fresh install landing on v2 |
| `storage/backup.test.ts` | 11 | Export shape; export → reset → import round trip |

Database tests run against `fake-indexeddb`, so the real schema class is exercised
without a browser. `createTestDatabase(name)` gives each test an isolated instance of
the production code rather than a copy of it.

CI runs `npm test` before the build. `npm run check` runs type-check, lint and tests.

**Four real bugs were caught by assertions rather than by a browser.** They are listed
under Fixed below, each marked with the test that found it.

### Schema v2 — full body composition

The measurement table went from four fields to sixteen, which required the first
migration in the project's life.

```ts
this.version(2)
  .stores({ quotes: null, habits: 'id, date, habitId' })
  .upgrade(async (tx) => { /* 12 columns + heightCm → null; drop seen */ })
```

| Change | Reason |
| --- | --- |
| 12 new `measurements` columns | Body fat, skeletal muscle, visceral fat, neck, chest, hips, and left/right arm, thigh and calf |
| `settings.heightCm` | Needed to derive BMI |
| `quotes` store dropped | Written, backed up and restored — never read. The daily quote has always come from the static module |
| `[date+habitId]` index dropped | Never queried; the primary key already encodes the pair |
| `achievements.seen` deleted | Written on unlock, never read |

`version(1)` was left byte-for-byte as it shipped. Dexie replays versions in order on an
existing database, so editing history changes what installed clients upgrade *from* — the
class doc block in `db.ts` now says so, and points at the migration test.

The upgrade uses `??=` throughout, so it is idempotent and replay-safe.

### Body tracking

- **`data/metrics.ts`** describes each metric once — field, label, group, kind, bounds,
  step, decimals, direction, hint. The entry form, the trend list and the unit conversion
  all read from it, so they cannot drift. It is typed against `MeasurementField`, so
  adding a column without describing it fails the type check.
- **`storage/trends.ts`** turns a column into a direction: latest, previous, first,
  change, whether the movement is favourable, and the points for a sparkline. Per-kind
  noise floors mean 0.1 kg is not reported as a trend.
- **`components/Sparkline.tsx`** — about 70 lines of inline SVG. Chart.js never loads for
  the Body screen.
- **BMI** is derived at display time from the latest weight and `settings.heightCm`, and
  shown as a band rather than a bare number. It is deliberately not a stored column: a
  stored derived value is one that can disagree with the weight next to it.
- **Asymmetry** — left and right are separate columns rather than one averaged number,
  and a gap of 3% or more is surfaced with the context that some difference is normal.

Storage stays metric regardless of the display unit, so switching to imperial never
rewrites history.

### Reliability

- **`navigator.storage.persist()`** is requested at launch, and Settings shows the grant
  state and usage estimate. Without it, iPadOS can evict the database silently — the
  failure mode the JSON backup exists to survive.
- **`MotionConfig reducedMotion="user"`** at the root. The CSS media query already zeroed
  CSS transitions, but Framer Motion animations — page transitions, sheets, the
  celebration burst — ran at full amplitude regardless.
- **`ensureSeeded()` is now an in-flight guard**, not a permanent memoisation. See Fixed.

### Fixed

**Seeding could freeze the app after a restore.** `ensureSeeded()` cached its result
forever. Importing a backup with no settings row meant nothing reseeded, and every screen
sat on a skeleton indefinitely. It is now an in-flight-only guard that clears in
`finally`. *Found by `backup.test.ts`.*

**Mobility durations were wrong on six of eight routines**, every one overstated by two
to three minutes — Morning claimed 8 and ran 5, Hamstrings claimed 9 and ran 6. The
number was hand-written per routine and had drifted from the moves beneath it. The
`minutes` field is gone; `routineMinutes(routine)` derives it from `estimateSeconds`, and
a test guards the derivation. *Found by reviewing routines against their own content.*

**Mobility ignored equipment.** Workouts resolved against what you own; routines were
handed to the runner untouched, so someone without bands opening Shoulders was shown a
band pass-through with no way to do it. New `resolveMoves()` runs routines through the
same substitution chain minus progression — a stretch is not something you overload — and
the detail screen says when something was swapped.

**A gap in the substitution chain.** `FALLBACKS['db-floor-press']` pointed at
`'push-up'`, skipping the band press and leaving `band-chest-press` unreachable for anyone
with bands but no dumbbells. Now `'band-chest-press'`, restoring dumbbell → band →
bodyweight. *Found by `program.test.ts`.*

**Encouragement repeated too soon.** Three lines per streak band produced a visible cycle
within a week. Now twelve lines per band across five bands, with tests asserting no
consecutive repeat and at least ten distinct lines over thirty days. *Found by
`coach.test.ts`.*

**BMI rendered as "26" instead of "26.0"** — `roundTo` drops trailing zeros. Uses
`toFixed(1)`, with a comment saying why. *Found during browser verification.*

**`tempo-push-up` removed** — it duplicated `push-up` under a different name and was
unreachable. The library is 83 movements with no redundancy; `PUSHUP_IDS` in `stats.ts`
updated to match.

### Verified

The production build was driven in a real browser across six areas: **39 checks, all
passing**, no console errors, no failed requests.

A genuine v1 IndexedDB was seeded in the browser and the v2 build booted over it —
upgrades, drops `quotes`, preserves legacy settings, weight, waist and history, backfills
every new metric as null, renders. The workout engine showed no regressions: rest timer,
+15s, skip, set counter, resume after a reload, resume after closing the tab entirely,
celebration, streak. Backup survived export → reset → import with measurements and
history intact. The app boots offline, navigates offline, and resolves a cold deep link
offline. No horizontal overflow at 375×667, 393×852, 834×1112 or 1194×834.

Lighthouse desktop **100 / 100 / 100 / 100** on consecutive runs with 0 ms total blocking
time; mobile **93 / 100 / 100 / 100**, measured in a CPU-contended container and worth
re-checking on the real iPad.

### Documentation

Seven deliverables: this changelog entry, plus an updated
[README](README.md), a final [Technical Report](docs/TECHNICAL_REPORT.md), an
[Architecture](docs/ARCHITECTURE.md) document with five diagrams, a complete
[Database Schema](docs/DATABASE_SCHEMA.md) covering every stored field and the procedure
for adding v3, a [User Guide](docs/USER_GUIDE.md), a [Backup Guide](docs/BACKUP_GUIDE.md)
and [Release Notes](docs/RELEASE_NOTES.md). [Known Issues](docs/KNOWN_ISSUES.md) was
rewritten — five of its eight entries are now closed.

---

## Phase 2 — Product Polish

No new features. The app already worked end to end; this phase was about making
it worth opening every day, and about meeting the accessibility bar the original
specification set and the app was quietly missing.

### Accessibility — the headline fix

The light palette failed WCAG AA. Lighthouse flagged 28 elements and the cause
was systematic rather than incidental: two of the three text greys and the
accent were too light for the sizes they were used at. Replacement values were
solved numerically, not eyeballed.

| Token | Before | After | Contrast on canvas |
| --- | --- | --- | --- |
| `--muted` (light) | `#63636f` | `#4d4d57` | 5.35 → **7.54** |
| `--faint` (light) | `#93939f` | `#5f5f6b` | 2.74 → **5.68** |
| `--accent` (light) | `#f2622e` | `#bd4318` | 2.89 → **4.76** |
| `--faint` (dark) | `#71717e` | `#8b8b98` | 3.52 → **5.04** on raised |

The two secondary greys now sit close together, so hierarchy comes from size and
weight instead of a third grey step.

`user-scalable=no` and `maximum-scale=1` were removed from the viewport, which
had been blocking pinch-zoom. They were guarding against iPadOS zoom-on-focus,
which the 16px minimum input size already prevents.

**Lighthouse Accessibility: 91 → 100** on both desktop and mobile.

### Design system

Added a seven-step type scale with per-step leading, tracking and weight; a
radius scale; a second elevation; spacing for the layout rhythm; and motion
durations and easings. Motion tokens are mirrored in `lib/motion.ts`, so a CSS
transition and a Framer Motion animation of the same intent move at the same
speed.

### Components

The set the specification asked for now exists, without duplicating what was
already there:

- `StatTile` → **`StatCard`**, renamed to match the design system
- `Sheet` → **`Overlay`**, with **`BottomSheet`** and **`Modal`** as variants
  sharing one implementation rather than two that drift apart
- **`ExerciseCard`** — the single presentation of an exercise, in a dense `row`
  form for plans and a `hero` form for the movement in progress
- **`CircularTimer`** — countdown drawn as a depleting ring
- **`ErrorBoundary`** — new, see below

`ConfirmDialog` moved from a full-height sheet to `Modal`, since it asks one
question.

### Exercise library

79 of 87 records had no progression or regression, and there was no notion of
secondary muscles or difficulty at all. Every movement now carries all four,
authored individually rather than generically — a wall sit gets "sit higher", a
plank gets "add load rather than time". `regression` and `progression` are
required by the type, so the next exercise cannot ship without them.

Three records no template or routine referenced were removed (`chair-squat`,
`step-up`, `slow-mountain-climber`). 87 → 84, all prescribed.

Pull-up bar movements were kept: the Phase 2 brief lists bodyweight, bands and
future dumbbells, but the master specification lists a pull-up bar as year-one
equipment and phases 3 and 4 schedule it.

### Coaching engine

`data/coach.ts` maps a snapshot of sleep, energy, back pain, days since the last
session, that session's effort, streak and the scheduled kind to a focus, a
verdict, a recommendation, a recovery suggestion and an encouraging line.

Ten ordered rules, first match wins. Two principles are enforced by the
ordering: **pain outranks the plan** (a back at 6+ swaps the session for the
Lower Back routine regardless of the calendar), and **never guilt** (four days
away produces "Nothing is lost. Picking it up again is the hard part, and you
just did"). No model, no randomness, no network — the same inputs always give
the same advice, because advice that changes on refresh is not advice.

### Home

- **Today's Focus** — Workout, Mobility, Recovery or Rest, with the coach's read
  on it, above the button that acts on it.
- The primary button's label and destination now follow the verdict, so what is
  on screen is what actually makes sense today. Starting the scheduled session
  is **one tap from a cold open**.
- Generic statistics replaced with two actionable things: consistency over the
  last fourteen days compared against the fortnight before, and a pain trend.
- An unlogged day shows an invitation explaining what the check-in feeds,
  instead of four em dashes.

### Workout

- **Circular rest timer** in a panel large enough to read from the mat, with a
  "next up" line so the following movement can be set up during the rest.
- Larger exercise cards showing secondary muscles and a difficulty badge.
- Cards slide in the **direction of travel** rather than always the same way.
- **Finish celebration** — a filling ring, the session's numbers, the streak and
  a line in the coach's voice, replacing a toast that vanished while the user
  was still catching their breath.

### Mobility

Routines grouped into **Morning, Office, Evening and Recovery**, each with a line
on why you would reach for it. Every stretch shows its duration and target
muscles, via the shared `ExerciseCard`.

### Progress

- **Weekly summary** comparing this week against last on sessions, time and sets.
- Overview cut from six stat tiles to two personal bests; the totals it repeated
  already live on the Journey tab.
- The sleep-and-energy dual-line chart was removed — two series with different
  units on one axis was busy and said little — replaced by a sleep average in
  the weekly card.
- The pain chart now leads with a sentence saying which way it is going.

### Code quality

- **Error boundary.** A render error previously left a blank screen, which
  installed to the Home Screen has no address bar and so no way out. The
  recovery path never touches stored data.
- **Loading states.** Three Progress tabs returned bare `null` while their query
  resolved, so switching tabs flashed empty. They now show a skeleton.
- Removed `useStopwatch`, which nothing used.

### Bugs found by driving the built app

- **The celebration was being skipped.** `finishSession` clears the active
  session row, so the live query emitted `undefined` several awaits before the
  completion state was set, and the redirect guard fired in that gap. Closed
  with a ref set synchronously at the start of finishing.
- **`Card` lost its background.** The background came from a class passed
  through `className`, colliding with the component's own `bg-surface` at equal
  specificity — which won depended on stylesheet order, and two cards on Home
  rendered white instead of sunken. Background is now a `tone` prop.

### Measured

| | Desktop | Mobile |
| --- | --- | --- |
| Performance | 94 → **100** | 95 → 88–92 (see note) |
| Accessibility | 91 → **100** | 91 → **100** |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Desktop returned 100 across all four categories on two consecutive runs
(TBT 10 ms). The mobile figure is noisy in this build container — total blocking
time swung between 230 ms and 330 ms across runs on identical code, against
10 ms on desktop — so the mobile number reflects a CPU-contended measurement
machine as much as the app. Worth re-measuring on real hardware.

Verified end to end at 393×852 and 834×1112: onboarding, check-in, session
runner, rest timer, celebration, all five tabs, dark mode. No console errors, no
failed requests, no horizontal overflow on any tab.
