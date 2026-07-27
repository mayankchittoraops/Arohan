# Arohan — Final Technical Report

**Version 1.0 Beta** · 27 July 2026 · Schema v3 · Deployed to GitHub Pages

An offline-first Progressive Web App for one person's twelve-month health and exercise
programme. No backend, no authentication, no runtime network request, no model.

Companion documents: [Architecture](ARCHITECTURE.md) · [Database Schema](DATABASE_SCHEMA.md)
· [Release Notes](RELEASE_NOTES.md) · [User Guide](USER_GUIDE.md) ·
[Backup Guide](BACKUP_GUIDE.md) · [Known Issues](KNOWN_ISSUES.md) ·
[Changelog](../CHANGELOG.md)

---

## 1. Folder structure

```
Arohan/
├── .github/workflows/deploy.yml      CI: type-check → lint → test → build → Pages
├── .oxlintrc.json                    correctness as errors, react-hooks rules on
├── index.html                        pre-paint theme script, PWA meta, safe-area viewport
├── vite.config.ts                    base=/Arohan/, PWA manifest
├── vitest.config.ts                  node environment, src/**/*.test.ts, @ alias
├── CHANGELOG.md
├── docs/
│   ├── TECHNICAL_REPORT.md           this document
│   ├── ARCHITECTURE.md               diagrams and layering rules
│   ├── DATABASE_SCHEMA.md            every stored field, and the migration procedure
│   ├── USER_GUIDE.md
│   ├── BACKUP_GUIDE.md
│   ├── RELEASE_NOTES.md
│   ├── KNOWN_ISSUES.md
│   ├── PHASE_3_ROADMAP.md
│   └── screenshots/                  11 captures, iPhone and iPad, light and dark
├── scripts/generate-icons.mjs        procedural PNG icon generator (zlib, no deps)
├── public/icons/                     favicon.svg, apple-touch-icon, 192/512/512-maskable
└── src/                              13,090 lines
    ├── main.tsx                      root, ErrorBoundary, Router, ToastProvider,
    │                                 SW registration, storage.persist()
    ├── App.tsx                       routes, lazy boundaries, MotionConfig, theme, nav
    ├── index.css                     design tokens: colour, type, radius, shadow, motion
    │
    ├── components/                   1,750 lines — presentational, no data access
    │   ├── BottomNav · Page · Card · Button · Icon · Fields · Feedback
    │   ├── ExerciseCard              row + hero forms, muscles, difficulty
    │   ├── CircularTimer             countdown as a depleting ring
    │   ├── Sparkline                 inline SVG trend line — no charting library
    │   ├── Overlay                   BottomSheet + Modal, one implementation
    │   ├── ErrorBoundary             render-error recovery
    │   └── ProgressRing · StatCard · Chart · ExerciseGlyph
    │
    ├── features/                     3,989 lines
    │   ├── home/                     HomePage, TodayCard, Insights, HabitChecklist,
    │   │                             DailyCheckInSheet, OnboardingSheet
    │   ├── workout/                  WorkoutPage, ActiveWorkoutPage, ExerciseRunner,
    │   │                             SetRow, RestTimer, SessionComplete, FinishSheet,
    │   │                             SessionPlan, useActiveSession, start
    │   ├── mobility/                 MobilityPage (categorised), MobilityRoutinePage
    │   ├── progress/                 ProgressPage, OverviewTab, WeeklySummary, BodyTab,
    │   │                             MetricRow, HistoryTab, JourneyTab, PhotoStrip
    │   └── settings/                 SettingsPage
    │
    ├── storage/                      2,033 lines — persistence, no React
    │   ├── db.ts                     schema v1–v3, migrations, seeding, reset
    │   ├── types.ts                  every stored record shape
    │   ├── repo.ts                   table-level read/write API
    │   ├── session.ts                session lifecycle and mutation
    │   ├── stats.ts                  streaks, records, summaries — all derived
    │   ├── trends.ts                 metric direction, noise floors, asymmetry
    │   ├── backup.ts                 versioned JSON export/import
    │   └── *.test.ts                 migration, session, stats, trends, backup
    │
    ├── hooks/                        699 lines
    │   ├── useSettings · useStats · useJourney · useCoach · useToday
    │   ├── useTheme · useTimer · useFeedback · useWakeLock · useStorageEstimate
    │   └── useReminders · useAchievementWatcher · useCssVars · useToast
    │
    ├── data/                         4,154 lines — pure, no React or storage
    │   ├── exercises.ts              83 movements, full metadata
    │   ├── program.ts                4 phases, 16 templates, progression, substitution
    │   ├── coach.ts                  10 deterministic coaching rules
    │   ├── mobility.ts               8 routines in 4 categories, derived durations
    │   ├── metrics.ts                the 16 body metrics, described once
    │   ├── achievements · habits · quotes · types
    │   └── *.test.ts                 coach, program, mobility
    │
    └── lib/                          370 lines
        ├── date · format · image · motion · cn
        └── date.test.ts
```

---

## 2. Tech stack

| Layer | Choice | Version |
| --- | --- | --- |
| UI | React | 19.2 |
| Language | TypeScript (`strict`) | 6.0 |
| Build | Vite (rolldown) | 8.1 |
| Styling | TailwindCSS v4, `@theme inline` tokens | 4.3 |
| Routing | react-router-dom | 7.18 |
| Persistence | Dexie (IndexedDB) | 4.4 |
| Reactivity | dexie-react-hooks `useLiveQuery` | 4.4 |
| Animation | Framer Motion | 12.42 |
| Charts | Chart.js + react-chartjs-2, lazy-loaded | 4.5 / 5.3 |
| Icons | lucide-react | 0.545 |
| PWA | vite-plugin-pwa (Workbox `generateSW`) | 1.3 |
| Tests | Vitest + fake-indexeddb | 4.1 / 6.2 |
| Lint | oxlint | 1.75 |

**One dependency added across Phases 2 and 3**, both dev-only: Vitest and
`fake-indexeddb`. Nothing was added to the runtime bundle. The coaching engine, the design
tokens, the sparkline and every new component are plain TypeScript and CSS.

---

## 3. Design system

Tokens live in `index.css` under `@theme inline`, with motion mirrored in `lib/motion.ts` so
CSS transitions and Framer Motion animations of the same intent move at the same speed.

- **Colour** — semantic roles (`canvas`, `surface`, `raised`, `sunken`, `line`, `ink`,
  `muted`, `faint`, `accent`) plus seven data colours, flipped by a `.dark` class. Every
  text pair clears WCAG AA 4.5:1 in both themes; graphics clear 3:1.
- **Typography** — seven steps (`display`, `title`, `heading`, `body`, `label`, `caption`,
  `micro`), each carrying its own leading, tracking and weight, so a heading is picked by
  role rather than by choosing a pixel size per screen. Numeric readouts use tabular
  figures so they do not jitter as they count.
- **Radius** — `control`, `xl2`, `xl3`. **Elevation** — `card`, `lifted`.
- **Spacing** — `gutter`, `section`, `nav` for the page rhythm.
- **Motion** — `instant` 120 ms, `fast` 180 ms, `base` 260 ms, `slow` 420 ms, plus two
  easings and three spring presets (`panel`, `control`, `bounce`). All of it deferring to
  `prefers-reduced-motion` through `MotionConfig reducedMotion="user"` at the root.

`Modal` and `BottomSheet` share one `Overlay` implementation rather than being two
components that drift apart. `Card` takes its background through a `tone` prop, not a class
— two background classes at equal specificity resolve by stylesheet order, which is not a
decision anyone should be making by accident.

---

## 4. Features

### Home
Time-aware greeting; **Today's Focus** (Workout / Mobility / Recovery / Rest) with the
coach's read on it; completion ring; a primary button whose label and destination follow the
coach's verdict; recovery suggestion; consistency over 14 days against the fortnight before;
pain trend; check-in tiles with an inviting empty state; six habits; daily quote; phase
prompt. Starting the scheduled session is **one tap from a cold open**.

### Workout
Session resolved from the weekly plan with duration, set count and week number. Full-screen
runner: per-set rep, weight and hold controls; a circular rest timer with next-up, +15s and
skip; countdown holds that mark the set done at zero; instructions, cues and easier/harder
variations; per-exercise notes; skip and restore; pause/resume; screen wake lock. Finishing
captures RPE and post-session pain, then celebrates.

**The session autosaves on every tap.** Reloading mid-set, or closing the tab entirely and
reopening hours later, resumes on the same set with the elapsed clock intact.

### Mobility
Eight routines in four categories — Morning, Office, Evening, Recovery. Durations are
derived from the moves rather than hand-written, and routines resolve against your equipment
through the same substitution chain as workouts.

### Progress
**Overview**: this week against last, two personal bests, sessions-per-week bars, a pain
trend that leads with a sentence. **Body**: sixteen metrics in three groups, BMI as a band,
sparkline trends, asymmetry callouts, photos. **History**: expandable sessions. **Journey**:
year ring, four-phase timeline, 18 achievements.

### Settings
Name, height, units, theme, equipment, phase, reminders, sound and vibration, storage state
and usage, JSON export/import, reset.

---

## 5. Coaching engine

`data/coach.ts` — a pure function. No React, no storage, no clock, no randomness, and
explicitly no model.

**Inputs:** scheduled kind, trained today, sleep, energy, back pain, days since last
session, last session's RPE, streak, journey day.

**Outputs:** focus, verdict (`go` / `ease` / `swap` / `rest` / `done`), headline, detail,
recovery suggestion, encouragement, optional suggested routine.

Ten ordered rules, first match wins, so behaviour reads top to bottom. Thresholds are named
constants: `PAIN_STOP` 6, `PAIN_EASE` 4, `SLEEP_LOW` 6, `ENERGY_LOW` 2, `RPE_HARD` 9,
`LAYOFF_DAYS` 4. Two principles are enforced by the ordering rather than by prose:

1. **Pain outranks the plan.** A back at 6 or above swaps the session for the Lower Back
   routine regardless of the calendar.
2. **Never guilt.** Four days away yields *"Nothing is lost. Picking it up again is the hard
   part, and you just did."*

Encouragement comes from five streak bands (done / long / strong / building / restart) of
twelve lines each, indexed by journey day — so it varies over weeks but never on a refresh.
`coach.test.ts` asserts the rule ordering, determinism, and that thirty consecutive days
produce no consecutive repeat and at least ten distinct lines.

---

## 6. State management

Unchanged since Phase 1, and deliberately so.

| Kind | Where | Mechanism |
| --- | --- | --- |
| Persistent domain state | IndexedDB | Dexie + `useLiveQuery` |
| Ephemeral UI state | Component | `useState` |
| Cross-cutting UI | Context | `ToastContext`, `FieldLabelContext` |

No state library. **The database is the store**: a write anywhere re-renders every dependent
screen. Derived values — streaks, records, trends, BMI, coaching advice — are recomputed
from history rather than stored, so they cannot drift from their inputs.

In-session mutations are read-modify-write over the whole session row, so `useActiveSession`
serialises them through a promise chain. Two of the three worst bugs in Phase 1 were
consequences of getting this wrong before it was serialised.

---

## 7. Storage

**All application data is in IndexedDB via Dexie.** Database `arohan`, schema version 3,
eight object stores. `localStorage` holds one key, `arohan.theme`, so the inline script in
`index.html` can apply the dark class before first paint; the settings table remains the
source of truth.

```ts
// v1 — Phase 1, left exactly as shipped
this.version(1).stores({
  settings: 'id', daily_health: 'date', workouts: 'id, date, source',
  workout_history: 'id, date, templateId, kind, source', measurements: 'date',
  habits: 'id, date, habitId, [date+habitId]', achievements: 'id, unlockedAt',
  quotes: 'id, favourite', photos: 'id, date',
})

// v2 — full body composition; drops what nothing read
this.version(2)
  .stores({ quotes: null, habits: 'id, date, habitId' })
  .upgrade(async (tx) => { /* 12 metric columns + heightCm → null; drop seen */ })

// v3 — the muscle field asked for the wrong metric
this.version(3)
  .upgrade(async (tx) => { /* skeletalMusclePct → musclePct, value unchanged */ })
```

Full field-by-field documentation, the migration rationale, and the procedure for adding v4
are in **[Database Schema](DATABASE_SCHEMA.md)**.

One thing v3 established that is easy to miss: **backup import bypasses Dexie's upgrade
path entirely**, since `bulkPut` writes rows straight into the tables. A renamed field
therefore needs handling in `backup.ts` as well as in the migration, or restoring an older
file lands the value under a key nothing reads.

Three conventions worth repeating here:

- **Date keys** are local `YYYY-MM-DD` built from calendar parts, never `toISOString()`,
  which would shift the day outside UTC.
- **Storage is always metric.** Imperial is a display transform, so switching units never
  rewrites history or loses precision to a round trip.
- **Habit ids are composite** (`${date}:${habitId}`), so a toggle is an idempotent `put`
  with no read-then-write race.

`navigator.storage.persist()` is requested at launch, and Settings surfaces the grant state
and usage estimate. Without it, iPadOS can evict the database silently — which is the
failure mode the JSON backup exists to survive.

---

## 8. Testing

**142 tests across 10 files**, run by Vitest in a Node environment in about a second. CI runs
them before every build; `npm run check` runs type-check, lint and tests together.

| File | Tests | Covers |
| --- | --- | --- |
| `lib/date.test.ts` | 14 | Local keys, relative formatting, ranges, DST edges |
| `data/coach.test.ts` | 20 | All ten rules, ordering, determinism, encouragement variety |
| `data/program.test.ts` | 19 | Phases, templates, progression, substitution chains |
| `data/mobility.test.ts` | 14 | Content, derived durations, sequencing, equipment |
| `data/metrics.test.ts` | 9 | Field coverage, entry bounds against real readings, BMI |
| `storage/stats.test.ts` | 17 | Streaks, personal bests, weekly summaries, pain runs |
| `storage/session.test.ts` | 15 | Start, tick, advance, pause, resume, finish |
| `storage/trends.test.ts` | 15 | Direction, noise floors, asymmetry |
| `storage/migration.test.ts` | 7 | v1 → v2 and v2 → v3 upgrades; a fresh install landing on the current version |
| `storage/backup.test.ts` | 12 | Export shape; export → reset → import round trip; older formats |

The database tests run against `fake-indexeddb`, which is why the migration can be verified
without a browser. `createTestDatabase(name)` gives each test its own isolated instance of
the real schema class — the tests exercise the production migration code, not a copy of it.

Five real bugs were caught by assertions rather than by a browser: the substitution chain
gap, the encouragement repetition, the permanent seeding memoisation, the mobility duration
drift, and — added after a real reading was rejected in daily use — a second percentage
field still capped below 100. That is the case for the suite in one sentence.

`metrics.test.ts` carries two guards worth naming. One asserts `METRICS` describes every
stored measurement column exactly once, so a renamed or added field cannot ship without an
entry control. The other checks a set of real scale readings against each field's bounds,
because `NumberInput` **clamps silently rather than rejecting** — a `max` set below a
genuine value does not raise an error, it records a different number.

---

## 9. Verification

Beyond the unit suite, the production build was driven in a real browser across six areas:
**39 checks, all passing**, with no console errors and no failed requests.

| Area | What was checked |
| --- | --- |
| Migration | A genuine v1 IndexedDB seeded in the browser, then booted under v2 — upgrades, drops `quotes`, preserves legacy settings/weight/waist/history, backfills nulls, renders |
| Workout engine | Rest timer appears, +15s extends, skip dismisses, counter increments, celebration shows, streak increments |
| Resume | Survives a mid-session reload, and a full tab close and reopen |
| Health | All 16 fields accept input, 3 groups render, BMI derived and banded, a 5.7% arm gap flagged |
| Backup | Exports at v2 with no `quotes` and all 15 metrics; survives reset and restore |
| Offline / PWA | Boots offline, navigates offline, cold deep link resolves offline; SW active, manifest standalone, maskable icon, correct scope |
| Responsive | No horizontal overflow at 375×667, 393×852, 834×1112, 1194×834 |

---

## 10. Performance

Lighthouse against a production build served locally, headless Chromium.

| Category | Phase 1 desktop | v1.0 desktop | Phase 1 mobile | v1.0 mobile |
| --- | --- | --- | --- | --- |
| Performance | 94 | **100** | 95 | 93 † |
| Accessibility | 91 | **100** | 91 | **100** |
| Best Practices | 100 | **100** | 100 | **100** |
| SEO | 100 | **100** | 100 | **100** |

Desktop returned 100 across all four on consecutive runs, TBT **0 ms**, LCP 0.5–0.6 s.

† The mobile figure is measured in a CPU-contended container: total blocking time swung
210–330 ms across runs on identical code against 0–10 ms on desktop. Treat 93 as a floor and
re-measure on the actual iPad. See Known Issues.

**Bundle:**

| Chunk | Raw | Gzip |
| --- | --- | --- |
| Entry | 633 KB | 198 KB |
| ProgressPage (lazy) | 201 KB | 70 KB |
| SettingsPage (lazy) | 15 KB | 6 KB |
| CSS | 36 KB | 7 KB |

Chart.js loads only with the Progress route. The Body screen uses a ~70-line inline SVG
sparkline instead, so per-metric trends cost nothing on the critical path.

---

## 11. PWA status

Installable and fully offline; verified by disabling the network and reloading, including a
cold deep link.

| Item | State |
| --- | --- |
| Service worker | Workbox `generateSW`, `registerType: 'autoUpdate'` |
| Precache | 17 entries, ~894 KiB |
| Navigation fallback | `/Arohan/index.html` — SPA routes work offline |
| Manifest | `start_url` and `scope` `/Arohan/`, standalone, theme colours |
| Icons | 192/512/512-maskable PNG, apple-touch-icon, SVG favicon |
| Deep links | `404.html` copied from `index.html` in CI |

The app is served from `/Arohan/`. That base must match the repository name exactly, capital
A included — Pages mounts a project site at the repo's path and URL path segments are
case-sensitive, so a lowercase base leaves every asset link pointing nowhere. This was a
real deployment failure in Phase 1.

---

## 12. Architecture

Diagrams, the layering rules and the data-flow loop are in
**[Architecture](ARCHITECTURE.md)**. The summary:

- One loop, no store: screen → repository → Dexie → IndexedDB → `useLiveQuery` → every
  dependent screen re-renders. No dispatcher, no cache to invalidate.
- `components/` never touches storage; `data/` is pure and imports neither React nor
  `storage/`; `storage/` imports no React. That rule is what makes the coaching engine, the
  programme logic and the trend maths testable without a browser.
- The only two exits from the device are the manual JSON backup and the initial download of
  the app itself. Nothing is transmitted at runtime.

---

## 13. Known technical debt

Full list, with reasoning, in **[Known Issues](KNOWN_ISSUES.md)**. The state at v1.0:

**Closed this sprint** — no test suite, no migration path, no persistence request, reduced
motion partially honoured, unused `quotes` table and `seen` flag and compound index.

**Still open** — mobile performance unverified on real hardware; the 633 KB entry chunk
carries the whole exercise library synchronously; reminders only fire while the app is open
(a PWA limitation, not a bug); exercise illustrations are procedural glyphs rather than real
art; three deliberate hook-dependency suppressions; two `npm audit` advisories that do not
apply to a client-only SPA and would need breaking major bumps.

---

## 14. Recommended next steps

Deliberately short, because the correct next step is **use the app for thirty days**.
Version 1.0 Beta is feature complete; development from here should be driven by what daily
use exposes.

When feedback arrives, these are the things already known to be worth watching:

1. **Re-measure mobile Lighthouse on the real iPad.** Everything about the current mobile
   number is suspect, and it is the only quality figure not independently confirmed.
2. **Check whether the coach still lands in week 12.** Twelve lines per band is a large
   improvement on three, but novelty wears off in ways only real use reveals.
3. **Watch the photo count.** Nothing prunes them, and the base64 export inflates them by a
   third. If the export becomes unwieldy, pruning or a binary export format is the fix.
4. **Revisit the exercise glyphs** only if they turn out to matter in practice. Real
   illustrations are the single largest content investment available and should not be made
   on speculation.

Ideas parked with reasons are in [Phase 3 Roadmap](PHASE_3_ROADMAP.md).
