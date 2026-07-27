# Changelog

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
