# Arohan — Release Notes

## Version 1.0.1 Beta

**27 July 2026** · Schema v3 · Backup format v3

A fix from the first day of real use.

### The Muscle field asked for the wrong metric

**Reported:** a Dr Trust scale shows Muscle Rate 78%; the field would not accept it.

The field was labelled "Skeletal muscle" and capped at 70. Those two things were consistent
with each other and wrong for every scale that feeds them:

- **Skeletal muscle mass %** — voluntary muscle attached to bone — runs 33–45% in adult
  men, perhaps 55% in a lean athlete. 78% is not physiologically reachable.
- **Muscle Rate**, what Dr Trust and most consumer BIA scales actually report, is all lean
  soft tissue: skeletal and smooth muscle, organs and their water, everything except fat
  and bone mineral. **70–85% is normal.**

So the reading was correct and the app was asking for a different measurement. The field is
now **Muscle**, accepting 0–100, with a hint saying it is the scale's Muscle Rate and what
range to expect.

**This was worse than a rejected input.** `NumberInput` clamps silently rather than
refusing — entering 78 against a max of 70 showed no error and stored **70**. Any reading
logged before this release should be checked against the scale.

`bodyFatPct` was capped at 70 for the same reason and is now 0–100 as well. It had not been
hit yet; it was the same latent bug.

### Schema v3

`skeletalMusclePct` is renamed to `musclePct`. The stored value carries across untouched —
it was always a Muscle Rate reading, so only the name needed correcting. Existing installs
migrate on first launch with no action needed.

Backups at version 1 and 2 still import correctly: the rename is mirrored on the import
path, because restoring a file bypasses the database migration entirely.

### Tests

142, up from 128. New `metrics.test.ts` asserts that every stored column has an entry field,
and checks real scale readings against each field's bounds — the guard that would have
caught this before it reached a device. New migration cases cover v2 → v3 in both
directions of the replay, and a backup case covers importing a pre-rename file.

---

## Version 1.0 Beta

**27 July 2026** · Schema v3 · Backup format v3 · Feature complete

This is the release Arohan was built toward: reliable enough to open every day for a year
without thinking about it. From here, changes should come from actually using it, not from
a plan written before it was used.

**Install:** open https://mayankchittoraops.github.io/Arohan/ in Safari, then
**Share → Add to Home Screen**.

---

### The headline

Three things changed the character of the app this release.

**Full body tracking.** Weight and waist became sixteen metrics across composition, girths
and performance, with BMI derived from your height, left/right asymmetry called out, and
trends shown as a direction and a sparkline rather than a chart to interpret.

**A test suite.** 128 tests over the logic that decides things — the coach, streaks,
progression, substitution, dates, trends, session mechanics, backup round-trips and the
schema migration. Every bug in the first two phases was caught by driving a browser; four
bugs in this one were caught by an assertion before anyone ran the app.

**The reliability gaps are closed.** Migrations are versioned and tested, storage
persistence is requested, reduced motion is honoured everywhere, and the seeding bug that
could have left the app frozen after a restore is gone.

---

## New

### Body tracking — sixteen metrics

| Group | Metrics |
| --- | --- |
| Composition | Weight, Body fat %, Muscle %, Visceral fat |
| Girths | Neck, Chest, Waist, Hips, Left/Right arm, Left/Right thigh, Left/Right calf |
| Performance | Push-up max, Plank hold |

Every field is optional — a weigh-in day and a tape-measure day are usually different days,
and requiring both would mean neither happens.

- **BMI**, derived from the latest weight and a new height field in Settings, shown as a
  band ("In the healthy range") rather than a bare number. It is never stored, so it cannot
  disagree with the weight next to it.
- **Trends, not charts.** Each metric shows its latest value, the change since the reading
  before, and an inline sparkline. Movements below a per-metric noise floor are not
  reported as trends — 0.1 kg is not a direction.
- **Asymmetry.** Left and right are separate columns, and a gap of 3% or more is flagged
  with the context that some difference is normal.
- Every metric is described once, in `src/data/metrics.ts` — the entry form, the trend list
  and the unit conversion all read from the same table, so they cannot drift.

### Schema v2, migrated and verified

- Twelve new measurement columns and `settings.heightCm`, backfilled as null on every
  existing row.
- The `quotes` store dropped — it was written, backed up and restored, but the daily quote
  has always come from the static module.
- The unused `[date+habitId]` index and the write-only `achievements.seen` flag removed.
- `migration.test.ts` seeds a genuine v1 database, reopens it through the real schema, and
  asserts the v2 result field by field. The same path was then run in a real browser
  against a v1 database built in Safari's engine.

### 128 tests

| File | Covers |
| --- | --- |
| `date.test.ts` | Local date keys, relative formatting, ranges |
| `coach.test.ts` | All ten rules, ordering, determinism, encouragement variety |
| `stats.test.ts` | Streaks, personal bests, weekly summaries, pain runs |
| `program.test.ts` | Phases, templates, progression, equipment substitution |
| `session.test.ts` | Start, tick, advance, pause, resume, finish |
| `migration.test.ts` | v1 → v2 upgrade, and a fresh install landing on v2 |
| `trends.test.ts` | Trend direction, noise floors, asymmetry |
| `backup.test.ts` | Export shape and a full export → reset → import round trip |
| `mobility.test.ts` | Routine content, durations, sequencing, equipment resolution |

`npm test` runs them in about a second. CI runs them before every deploy.

### Storage durability

`navigator.storage.persist()` is requested at launch, and Settings shows whether the
browser granted it along with how much space Arohan is using. Without it, iPadOS can evict
the database silently — the failure mode this was the only real defence against.

---

## Fixed

**Seeding could leave the app frozen.** `ensureSeeded()` memoised its result permanently.
Importing a backup that contained no settings row meant nothing ever reseeded, and every
screen sat on a skeleton forever. It is now an in-flight guard that clears in `finally`.
*Caught by the backup round-trip test.*

**Mobility durations were wrong on six of eight routines**, every one overstated by two to
three minutes. Morning claimed 8 and ran 5; Hamstrings claimed 9 and ran 6. The number was
hand-written per routine and had drifted from the moves beneath it. It is now derived from
the content and guarded by a test, so it cannot disagree again.

**Mobility routines ignored your equipment.** Workouts resolved against what you own;
routines were handed to the runner untouched, so anyone without bands opening Shoulders was
shown a band pass-through with no way to do it. Routines now resolve through the same chain
— minus progression, since a stretch is not something you overload — and the screen says
when something was swapped.

**A gap in the substitution chain.** `db-floor-press` fell back to a bodyweight push-up,
skipping the band press entirely, which left `band-chest-press` unreachable for anyone with
bands but no dumbbells. *Caught by a test.*

**Encouragement repeated too soon.** Three lines per streak band meant a visible cycle
within a week. Now twelve lines per band across five bands, with tests asserting no
consecutive repeat and at least ten distinct lines over thirty days.

**Reduced motion was only half-honoured.** CSS transitions respected
`prefers-reduced-motion`; Framer Motion animations — page transitions, sheets, the
celebration — did not. `MotionConfig reducedMotion="user"` now sits at the root.

**BMI rendered as "26" instead of "26.0"** — the rounding helper drops trailing zeros.
*Caught during browser verification.*

**A duplicate exercise removed.** `tempo-push-up` duplicated `push-up` under a different
name; the library is now 83 movements with no redundancy.

---

## Verified

Driven in a real browser against the production build. **39 checks, all passing**, with no
console errors and no failed requests.

| Area | Result |
| --- | --- |
| Live v1 → v2 migration | Upgrades, preserves legacy data, backfills nulls, renders |
| Workout engine | Rest timer, +15s, skip, set counter, celebration, streak |
| Session resume | Survives a reload mid-set, and closing the tab entirely |
| Health tracking | All sixteen fields, three groups, BMI banded, asymmetry flagged |
| Backup | Export → reset → import, with history and measurements intact |
| Offline | Boots, navigates, and resolves a cold deep link with the network off |
| PWA | Service worker active, manifest standalone, maskable icon, correct scope |
| Responsiveness | No horizontal overflow at 375×667, 393×852, 834×1112, 1194×834 |

### Lighthouse

| | Desktop | Mobile |
| --- | --- | --- |
| Performance | **100** | 93 |
| Accessibility | **100** | **100** |
| Best Practices | **100** | **100** |
| SEO | **100** | **100** |

Desktop returned 100 across all four on consecutive runs, with 0 ms total blocking time.
The mobile figure is measured in a CPU-contended container and is worth re-checking on real
hardware.

### Bundle

| Chunk | Raw | Gzip |
| --- | --- | --- |
| Entry | 633 KB | 198 KB |
| Progress (lazy) | 201 KB | 70 KB |
| Settings (lazy) | 15 KB | 6 KB |
| CSS | 36 KB | 7 KB |

Chart.js stays off the critical path entirely; the Body screen uses a ~70-line inline SVG
sparkline instead.

---

## Deliberately not in this release

Cloud sync · authentication · a backend · nutrition tracking · social features · Apple
Watch integration · AI chat · subscriptions.

None of these are missing by oversight. Each one would require the app to stop being a
single-user, single-device, offline-first thing that keeps your data where you can see it.

---

## Upgrading from Phase 2

Nothing to do. Open the app; the database migrates itself on first launch and existing data
is preserved. A Phase 2 backup (format v1) imports cleanly into this version. A v2 backup
will **not** import into an older build — the app refuses backups from a newer version
rather than partially restoring them.

---

## What comes next

Nothing, until it has been used.

The next twelve months are the point of the app, and the only sensible source of the next
change is what actually goes wrong — or feels wrong — in daily use. Suggestions for what to
watch:

- Whether the coach's advice still feels right in week 12, when the novelty has worn off
- Whether the check-in is too long to do every morning
- Whether the stick-figure glyphs are good enough, or whether real illustrations matter
- Whether the mobile performance figure holds up on the actual iPad
- What you find yourself wanting on the Body screen after three months of real data

Ideas that were parked, with reasons, are in the [Phase 3 Roadmap](PHASE_3_ROADMAP.md).
Everything currently known to be imperfect is in [Known Issues](KNOWN_ISSUES.md).

---

## Earlier releases

### Phase 2 — Product Polish

Accessibility from 91 to **100** (the light palette failed WCAG AA on 28 elements; the
replacement values were solved numerically, and pinch-zoom was restored). A full design
token system — seven type steps, radius, elevation, spacing, motion. `StatCard`,
`ExerciseCard`, `CircularTimer`, `ErrorBoundary`, and one shared `Overlay` behind both
`Modal` and `BottomSheet`. Secondary muscles, difficulty and progression/regression on all
83 movements. The deterministic coaching engine. Full detail in the
[Changelog](../CHANGELOG.md).

### Phase 1 — Build

The app: Home, Workout, Mobility, Progress, Settings. A twelve-month, four-phase programme
over an 83-movement library built for an irritable back. Dexie persistence, the session
runner with autosave, the PWA shell, and deployment to GitHub Pages.
