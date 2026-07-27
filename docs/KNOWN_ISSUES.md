# Known Issues

Honest state of the app after Phase 2. Ordered by risk.

## 1. No tests

There is no test runner and no assertions anywhere. This remains the largest
risk in the codebase, and Phase 2 did not change it — the phase brief listed
error boundaries, loading states, dead code, types, bundle size and
documentation under code quality, and adding a test framework was outside that
scope.

It matters because the highest-value targets are pure and trivially testable:
`coach()`, `computeStreak`, `progressionFor`, `resolveSession` substitution,
`summarise`, `painFreeRun` and the date maths. Every bug found across both
phases lived in exactly that kind of code:

- the Dexie live-query tracking failure that froze settings
- the lost-update race between ticking a set and advancing
- the duplicate substitute when bands were unticked
- the celebration being skipped by the redirect guard
- the `Card` background lost to CSS ordering

All five were caught by driving a real browser, which is slower and less
reliable than a unit test would have been. **First item of Phase 3.**

## 2. Mobile Lighthouse performance is unverified on real hardware

Desktop is a stable 100. Mobile returned 88–95 across runs on identical code,
with total blocking time swinging 230–330 ms against 10 ms on desktop. That
spread is measurement noise from a CPU-contended build container, not a change
in the app between runs.

The real figure needs a run on an actual iPad or iPhone. Until then, treat the
mobile number as unknown rather than as 92.

The entry chunk is 616 KB (about 195 KB gzipped) and carries React, Dexie,
Router, Framer Motion and the whole exercise library. Lighthouse reports ~74 KiB
of unused JavaScript on first load. Splitting the library out is possible but
would push `requireExercise` from a synchronous call to an async one, which
touches most screens — not worth it without a measured problem on real hardware.

## 3. No database migration path

The schema is still only `version(1)`. The first change to a stored record
shape needs a Dexie upgrade function; without one, existing installs break on
open. `backup.ts` versions the export format, but nothing versions the database.

Phase 2 added fields to `Exercise`, which is static content and therefore safe —
but `ExerciseLog` and the rest of `storage/types.ts` are stored, and the next
change there is the dangerous one.

## 4. IndexedDB has no persistence guarantee

`navigator.storage.persist()` is never requested and quota is never surfaced.
iPadOS evicts IndexedDB for sites it considers inactive, and the failure mode is
silent, total data loss. The JSON backup in Settings is the only mitigation, and
it depends on the user remembering to run it.

Photos are downscaled to 1280px but never pruned, and the backup embeds them as
base64 — roughly a third larger than the binary. A year of weekly photos makes
for a large export.

## 5. Reminders only fire while the app is open

Timers are scheduled in a `useEffect`. This is honest for a PWA with no backend,
and the UI says so, but it is not what most people expect from a reminder. Fixing
it properly needs a push service, which the specification rules out.

## 6. Motion does not honour `prefers-reduced-motion`

The CSS media query zeroes out CSS transitions, but Framer Motion animations —
page transitions, sheets, the celebration burst — still run at full amplitude.
Framer Motion has `useReducedMotion` for exactly this; it is not yet wired in.

## 7. Three deliberate hook-dependency suppressions

`ActiveWorkoutPage`, `useCssVars` and `PhotoStrip` each suppress
`react-hooks/exhaustive-deps`. The one in `ActiveWorkoutPage` is the notable one:
the effect that marks a set done when a hold expires depends only on
`hold.isActive` but calls `toggleSet`, which closes over the session. It is
correct because the effect runs on the render where the flag flips, but that is
an unwritten invariant with no test guarding it.

## 8. Minor

- `achievements.seen` is written as `false` on unlock and never read. It was
  intended for a "new unlock" indicator that has not been built.
- The `quotes` table is seeded, backed up and restored, but the daily quote is
  read from the static module. The `favourite` flag has no UI.
- The `[date+habitId]` compound index on `habits` is declared but never queried.
- `npm audit` reports two advisories that do not apply: a React Router RSC-mode
  CSRF issue (this is a client-only SPA with no server actions) and a DoS in a
  transitive build-time dependency of `vite-plugin-pwa`. Both need breaking major
  bumps.
