# Known Issues

Honest state of the app at **Version 1.0 Beta**. Ordered by risk.

Five of the eight issues from Phase 2 are closed — see [Closed](#closed) at the bottom for
what changed and why it mattered.

---

## 1. Mobile Lighthouse performance is unverified on real hardware

Desktop is a stable 100 with 0 ms total blocking time. Mobile returns 88–93 across runs on
identical code, with TBT swinging 210–330 ms. That spread is measurement noise from a
CPU-contended build container, not the app changing between runs.

The real figure needs a run on the actual iPad. Until then, treat 93 as a floor and the true
number as unknown. **This is the only quality figure in the project that has not been
independently confirmed**, and re-measuring it is the first thing worth doing with real
hardware.

## 2. The entry chunk carries the whole exercise library

633 KB raw, 198 KB gzipped, containing React, Dexie, Router, Framer Motion and all 83
movements with their full metadata. Lighthouse reports roughly 74 KiB of unused JavaScript
on first load.

Splitting the library out is possible but would push `requireExercise` from a synchronous
call to an async one, which touches most screens and every test that uses it. Not worth
doing without a measured problem on real hardware — which is issue #1.

Mitigations already in place: Progress and Settings are lazy, so Chart.js never touches the
critical path, and the Body screen uses an inline SVG sparkline rather than a charting
library.

## 3. Photos are never pruned, and inflate in the backup

Progress photos are downscaled to 1280 px on the long edge and stored as native `Blob`s,
which is efficient. Nothing deletes them, and the JSON export encodes them as base64 —
roughly a third larger than the binary.

A year of weekly photos produces an export in the tens of megabytes. Everything else in the
database put together is a few hundred kilobytes. If the export becomes unwieldy in
practice, the fix is either pruning older photos or a binary export format; neither is worth
building before that happens.

## 4. Reminders only fire while the app is open

Timers are scheduled in a `useEffect`. This is honest for a PWA with no backend, and the
Settings UI says so plainly, but it is not what most people expect from the word "reminder".

Fixing it properly requires a push service and therefore a server, which the specification
rules out. Treat them as in-app nudges. The one reminder that genuinely matters — the
monthly backup — belongs in the system calendar, and the
[Backup Guide](BACKUP_GUIDE.md) says so.

## 5. Exercise illustrations are procedural glyphs

Each movement gets a generated stick-figure glyph rather than a photograph or a drawing, so
the whole app installs and works offline with no image assets to fetch. They convey the
shape of a movement and not much more; the written instructions and cues do the real work.

Replacing them with real illustrations is the single largest content investment available
and should be made only if daily use shows the glyphs are actually insufficient — not on
speculation.

## 6. Three deliberate hook-dependency suppressions

`ActiveWorkoutPage`, `useCssVars` and `PhotoStrip` each suppress
`react-hooks/exhaustive-deps`.

The one in `ActiveWorkoutPage` is the notable one: the effect that marks a set done when a
hold expires depends only on `hold.isActive` but calls `toggleSet`, which closes over the
session. It is correct because the effect runs on the render where the flag flips, but that
is an unwritten invariant. `session.test.ts` covers the mutation it calls; it does not cover
the timing that makes the suppression safe.

## 7. Minor

- **`npm audit` reports two advisories that do not apply here.** A React Router RSC-mode
  CSRF issue — this is a client-only SPA with no server actions — and a DoS in a transitive
  build-time dependency of `vite-plugin-pwa`. Both fixes require breaking major bumps.
- **The daily quote has no favourite mechanism.** The `quotes` table that once backed one
  was dropped in schema v2; quotes are read from the static module. Nothing is missing
  functionally, but the idea was never finished.
- **`workouts` holds one row by convention, not by constraint.** `startSession` clears the
  table before writing, and the tests assert it, but the schema would happily store two.
  `getActiveSession` defends against it by returning the newest rather than an arbitrary
  row — a guard for something that should be impossible.

---

## Closed

Resolved in the v1.0 Beta sprint. Kept here because the reasoning is worth not losing.

**No tests → 128 tests.** This was the largest risk in the codebase for two phases running:
every bug found in Phase 1 and Phase 2 was caught by driving a real browser, which is slower
and less reliable than an assertion. The suite now covers the coach, streaks, progression,
substitution, dates, trends, session mechanics, backup round-trips and the schema migration,
and it caught four real bugs before anyone opened the app.

**No database migration path → schema v2, migrated and tested.** The schema sat on
`version(1)` with no upgrade function, so the first change to a stored record shape would
have broken existing installs. There is now a v2 with a documented upgrade, a test that
seeds the v1 shape and asserts the v2 result, a written procedure for adding v3 in
[Database Schema](DATABASE_SCHEMA.md), and a doc comment in `db.ts` pointing at both.

**No IndexedDB persistence guarantee → `storage.persist()` requested at launch.** iPadOS
evicts IndexedDB for sites it considers inactive, and the failure mode is silent, total data
loss. The grant is now requested on every launch and its state and usage are shown in
Settings. It is not a guarantee — Safari can refuse — which is why the JSON backup still
matters.

**Motion did not honour `prefers-reduced-motion` → `MotionConfig reducedMotion="user"`.**
The CSS media query zeroed CSS transitions, but Framer Motion animations — page transitions,
sheets, the celebration burst — ran at full amplitude regardless.

**Dead schema fields → removed in v2.** The `quotes` store (written, backed up and restored;
never read), the `achievements.seen` flag (written on unlock, never read) and the
`[date+habitId]` compound index (declared, never queried) are all gone. `tempo-push-up`,
which duplicated `push-up`, was removed from the library too.
