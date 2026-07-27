# Roadmap

Phase 1 built the app. Phase 2 made it worth opening. The v1.0 Beta sprint made it
**trustworthy over a full year** — which was the whole of what this roadmap called Sprint A,
plus most of Sprint B.

**Version 1.0 Beta is feature complete.** Everything below the Delivered section is parked,
and should stay parked until twelve months of daily use says otherwise. The correct next
step is not on this page; it is to use the app.

Nothing here adds cloud sync, a backend, authentication, AI, nutrition, social features,
Apple Watch integration or payments.

---

## Delivered in v1.0 Beta

| Item | Outcome |
| --- | --- |
| **Tests over the pure logic** | 128 tests across 9 files, gating CI before the build. Caught four real bugs before a browser saw them. |
| **Database migration path** | Schema v2 with a real upgrade function, a test that seeds v1 and asserts v2, and a written procedure for v3 in [Database Schema](DATABASE_SCHEMA.md). |
| **Storage durability** | `navigator.storage.persist()` requested at launch; grant state and usage shown in Settings. |
| **Honour `prefers-reduced-motion`** | `MotionConfig reducedMotion="user"` at the root, covering every Framer Motion animation. |
| **Full health tracking** | Sixteen metrics, derived BMI, trend directions with noise floors, asymmetry callouts. Went beyond what this page anticipated. |

The one item from Sprint A not delivered: a **backup-overdue nudge** — a gentle reminder in
Settings when no export has been taken in a month. It is genuinely useful and genuinely
small. It was left out because it needs a stored `lastExportedAt`, and adding a schema
column purely for a nudge, in the sprint whose point was reliability, was the wrong trade.
It is the first candidate if a v3 migration happens for any other reason.

---

## Parked — worth doing if daily use asks for it

### Coaching informed by more history

The engine reads today plus the last session. With a few months of real data it could also
notice:

- a pattern between poor sleep and reported pain
- which movements consistently precede a bad back day
- when a phase has been comfortable for three straight weeks, and say so rather than
  waiting for the calendar

All still deterministic rules over stored data. **No model, ever.** The reason this is
parked rather than built: rules inferred from imagined data tend to be wrong about real
data. Three months of history is the input this needs.

### Weekly review screen

Once a week: what was done, how the back trended, one thing to carry into next week. The
data is all present; it needs a screen and a rule set. Park it until it is clear whether the
Progress → Overview tab already covers the need.

### Replace the placeholder illustrations

The stick-figure glyphs are honest placeholders. Options, cheapest first: refine the
existing SVGs per movement rather than per category, or commission a small consistent set.
Must stay inline SVG so the app installs with no image fetches.

This is the single largest content investment available. Do not make it on speculation —
make it if the glyphs turn out to be insufficient in practice.

### Bundle work, driven by a real measurement

Only after Lighthouse has been run on an actual iPad. If it is genuinely slow, the exercise
library is the obvious split, at the cost of making `requireExercise` async across most
screens and every test that uses it. **Do not do this speculatively.**

### Photo management

Nothing prunes photos, and the base64 export inflates them by about a third. If a year of
weekly photos makes the backup unwieldy, the fix is either pruning older ones from the Body
tab or a binary export format.

---

## Withdrawn

**Achievement polish using the `seen` flag.** The flag was written on unlock and never read,
so v2 deleted it rather than building on it. If a "new unlock" indicator is ever wanted, it
should be designed first and stored second — the previous order is how the dead column
happened.

---

## Explicitly not recommended

- **Anything that needs a server.** The offline-first, no-account design is the reason the
  app is trustworthy and fast. Reminders that fire while closed, cross-device sync and
  shared progress all break it.
- **A broader exercise library.** 83 movements is already more than a year of the programme
  prescribes. More would be content for its own sake.
- **Nutrition, weight prediction or body-composition estimates.** Out of scope, and outside
  what the stored data can honestly support.
