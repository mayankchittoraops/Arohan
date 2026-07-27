# Phase 3 — Recommended Roadmap

Phase 1 built the app. Phase 2 made it worth opening. Phase 3 should make it
**trustworthy over a full year**, because that is the only thing left standing
between the current state and the original goal.

The ordering below is deliberate: the first two items are about not losing data
or breaking working behaviour, and everything else is easier once they exist.

Nothing here adds cloud sync, a backend, authentication, AI, nutrition, social
features or payments.

---

## Sprint A — Safety net (highest priority)

*Roughly 4–5 days.*

### 1. Tests over the pure logic

The single highest-value change available. No UI tests, no snapshots — just
Vitest over the functions that decide things:

| Target | Why it earns a test |
| --- | --- |
| `coach()` | Ten ordered rules. Reordering two of them silently changes advice. |
| `computeStreak` | Off-by-one at midnight, month and DST boundaries. |
| `progressionFor` | Deload weeks are easy to break and hard to notice. |
| `resolveSession` | Equipment substitution and duplicate suppression. |
| `summarise` / `toHistoryEntry` | Every number the user sees on Progress. |
| `lib/date` | Local date keys across month ends and DST. |

Gate CI on it, before the build step in `deploy.yml`.

### 2. Database migration path

Add `version(2)` with a real upgrade function, even if the change is trivial, so
the pattern exists and is exercised by a test before it is needed under pressure.
Document the convention in the technical report.

### 3. Storage durability

Request `navigator.storage.persist()` on first run. Surface usage and quota in
Settings. Add a gentle reminder to export a backup when one has not been taken
in a month. iPadOS eviction is silent and total; this is the difference between
an inconvenience and losing a year.

---

## Sprint B — The year in use

*Roughly 3–4 days.*

### 4. Honour `prefers-reduced-motion`

Wire Framer Motion's `useReducedMotion` through the shared motion tokens so one
change covers every animation. The CSS half is already done.

### 5. Coaching, informed by more history

The engine currently reads today plus the last session. With a few months of
data it could reasonably also notice:

- a pattern between poor sleep and reported pain
- which movements consistently precede a bad back day
- when a phase has been comfortable for three straight weeks, and say so rather
  than waiting for the calendar

All still deterministic rules over stored data. No model.

### 6. Weekly review

A once-a-week screen: what was done, how the back trended, one thing to carry
into next week. The data is all present; it needs a screen and a rule set.

---

## Sprint C — Craft

*Roughly 3 days.*

### 7. Replace the placeholder illustrations

The stick-figure glyphs are honest placeholders and the specification's
"no placeholder assets" goal is not truly met. Options, cheapest first: refine
the existing SVGs per movement rather than per category; or commission a small
consistent set. Must stay inline SVG so the app installs with no image fetches.

### 8. Bundle work, driven by a real measurement

Only after Lighthouse has been run on an actual iPad. If it is genuinely slow,
the exercise library is the obvious split, at the cost of making
`requireExercise` async. Do not do this speculatively.

### 9. Achievement polish

Use the `seen` flag that is already stored: show new unlocks once, distinctly,
rather than as an ordinary toast among others.

---

## Explicitly not recommended

- **Anything that needs a server.** The offline-first, no-account design is the
  reason the app is trustworthy and fast. Reminders that fire while closed,
  cross-device sync and shared progress all break it.
- **A broader exercise library.** 84 movements is already more than a year of
  the programme prescribes. More would be content for its own sake.
- **Nutrition, weight prediction or body-composition estimates.** Out of scope
  and outside what the stored data can honestly support.
